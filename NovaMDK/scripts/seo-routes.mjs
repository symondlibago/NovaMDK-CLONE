import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { slugify, productSlug } from "../src/lib/slug.js";
import { CATEGORY_META } from "../src/lib/categoryMeta.js";

export const SITE_URL = "https://www.novamdk.com";
const SITE_NAME = "NovaMDK";
export const DEFAULT_TITLE = "NovaMDK | Premium Telehealth & Longevity";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function extractProducts() {
  const src = readFileSync(join(root, "src/components/data/products.jsx"), "utf8");
  const idMatches = [...src.matchAll(/^\s{4}id:\s*(\d+),/gm)];
  if (idMatches.length === 0) {
    throw new Error("seo-routes: no product ids found in products.jsx — regex out of sync?");
  }
  const field = (block, name) => block.match(new RegExp(`${name}:\\s*"([^"]*)"`))?.[1] ?? "";
  const flag = (block, name) => new RegExp(`${name}:\\s*true`).test(block);
  // Stop the last product's block at the array's closing bracket. Left to run
  // to end-of-file it swallows the helpers and comments below, so merely
  // mentioning `hidden: true` in prose down there would delist a real product.
  const lastIndex = idMatches[idMatches.length - 1].index;
  const arrayEnd = src.indexOf("\n];", lastIndex);
  const limit = arrayEnd === -1 ? src.length : arrayEnd;

  const products = idMatches
    .map((m, i) => {
      const end = i + 1 < idMatches.length ? idMatches[i + 1].index : limit;
      const block = src.slice(m.index, end);
      return {
        id: Number(m[1]),
        name: field(block, "name"),
        subtitle: field(block, "subtitle"),
        categoryName: field(block, "categoryName"),
        categorySlug: field(block, "categorySlug"),
        img: field(block, "img"),
        brandName: field(block, "brandName"),
        hidden: flag(block, "hidden"),
      };
    })
    // `hidden: true` products redirect to their category, so listing them would
    // hand Google a sitemap full of redirects.
    .filter((p) => !p.hidden);
  // Guard against slug collisions — two products must never share a URL.
  const seen = new Map();
  for (const p of products) {
    const slug = productSlug(p);
    if (seen.has(slug)) {
      throw new Error(`seo-routes: duplicate product slug "${slug}" (ids ${seen.get(slug)} and ${p.id})`);
    }
    seen.set(slug, p.id);
  }
  return products;
}

export function buildRoutes() {
  const products = extractProducts();

  const routes = [
    {
      path: "/",
      title: DEFAULT_TITLE,
      description:
        "NovaMDK — personalized supplements and treatments, prescribed online. Dedicated online care, a physician's protocol, delivered fast to your door.",
      priority: "1.0",
    },
    {
      path: "/treatments",
      title: `Treatments — Physician-Prescribed Telehealth Care | ${SITE_NAME}`,
      description:
        "Explore NovaMDK treatments for weight loss, longevity, skin health, sexual wellness and recovery — prescribed online by licensed physicians and shipped to your door.",
      priority: "0.9",
    },
    {
      path: "/supplements",
      title: `Supplements — Clinical-Grade Formulas | ${SITE_NAME}`,
      description:
        "Compounded peptides and daily-foundation supplements from NovaMDK, prepared by FDA-regulated pharmacies and matched to your protocol.",
      priority: "0.9",
    },
    {
      path: "/kiosk",
      title: `Smart Kiosk — Telehealth in Gyms, Med Spas & Clubs | ${SITE_NAME}`,
      description:
        "NovaMDK Smart Kiosks bring physician-guided telehealth consultations to flagship centers, premium gyms, luxury med spas and member clubs.",
      priority: "0.7",
    },
    {
      path: "/contact",
      title: `Contact Us | ${SITE_NAME}`,
      description:
        "Get in touch with the NovaMDK care team — questions about treatments, orders, kiosk partnerships or anything else.",
      priority: "0.6",
    },
  ];

  for (const [slug, meta] of Object.entries(CATEGORY_META)) {
    routes.push({
      path: `/treatments/${slug}`,
      title: `${meta.title} | ${SITE_NAME}`,
      description: meta.description,
      priority: "0.9",
    });
  }

  for (const p of products) {
    routes.push({
      path: `/product/${productSlug(p)}`,
      title: `${p.name} — ${p.categoryName} | ${SITE_NAME}`,
      description: p.subtitle || `${p.name} from NovaMDK — physician-guided telehealth treatment, delivered to your door.`,
      image: p.img ? `${SITE_URL}${p.img}` : undefined,
      priority: "0.8",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.name,
        description: p.subtitle || undefined,
        image: p.img ? `${SITE_URL}${p.img}` : undefined,
        category: p.categoryName,
        brand: { "@type": "Brand", name: p.brandName || SITE_NAME },
      },
    });
  }

  const legal = [
    ["terms-and-conditions", "Terms of Service"],
    ["privacy-policy", "Privacy Policy"],
    ["telehealth-consent", "Telehealth Consent"],
    ["hipaa-notice-of-privacy-practices", "HIPAA Notice of Privacy Practices"],
    ["consumer-health-data", "Consumer Health Data Privacy Notice"],
  ];
  for (const [id, title] of legal) {
    routes.push({
      path: `/legal/${id}`,
      title: `${title} | ${SITE_NAME}`,
      description: `${title} for NovaMDK telehealth services.`,
      priority: "0.3",
    });
  }

  return routes;
}

// slugify re-exported for scripts that need it directly.
export { slugify, productSlug };
