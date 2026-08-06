import { productsData, isHidden } from "./products";

/**
 * Subscription programs — a dose ladder a patient stays on, versus the one-time
 * vials listed separately.
 *
 * Products are referenced by id rather than derived from their names: the "—
 * Starter / Mid-Dose / Maintenance" suffix is a display string, and quietly
 * regrouping the shelf because someone reworded a title is not a failure mode
 * worth having on a prescription page.
 *
 * Everything else — price, dose steps, refill cadence — is read from the
 * catalogue below, so this file never carries a second copy of a price.
 */
export const PROGRAMS = [
  {
    slug: "tirzepatide",
    category: "weight-loss",
    name: "Tirzepatide",
    tagline: "Dual GIP/GLP-1",
    blurb: "A dual-receptor peptide that works on appetite and metabolic signalling together, titrated up as you settle in.",
    blends: [
      { slug: "niacinamide", name: "With Niacinamide", note: "Supports metabolic function", ids: [5, 6, 7] },
      { slug: "glycine", name: "With Glycine", note: "Helps support muscle retention", ids: [8, 9, 10] },
    ],
  },
  {
    slug: "semaglutide",
    category: "weight-loss",
    name: "Semaglutide",
    tagline: "GLP-1 receptor agonist",
    blurb: "The most established GLP-1 protocol, available as a weekly injection or a needle-free sublingual drop.",
    blends: [
      { slug: "b12", name: "With B12", note: "Helps reduce nausea", ids: [1, 2] },
      { slug: "glycine", name: "With Glycine", note: "Helps support muscle retention", ids: [3, 4] },
      { slug: "sublingual", name: "Sublingual Drops", note: "No needles required", ids: [13, 14, 15] },
    ],
  },
];

const byId = (id) => productsData.find((p) => p.id === id);
const spec = (product, label) => product?.specs?.find((s) => s.label === label)?.value || "";

/** "$179" -> 179. Returns null for "$0" / unpriced items so they can't win a min(). */
export const priceValue = (product) => {
  const n = Number(String(product?.price || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** The dose step shown on the ladder, taken from the trailing name suffix. */
export const doseStage = (product) => {
  const m = String(product?.name || "").match(/—\s*(Starter|Mid-Dose|Maintenance)\s*$/);
  return m ? m[1] : "Standard";
};

/**
 * The size/strength portion of a title, e.g. "2.5 mL vial (20 mg)".
 * Splits on the *last* " - " rather than the first, so hyphenated product names
 * ("Low-Dose Naltrexone (LDN) - 1.5 mg flex-dose") don't break on their own name.
 */
export const doseSize = (product) => {
  const withoutStage = String(product?.name || "").split("—")[0].trim();
  const i = withoutStage.lastIndexOf(" - ");
  return i === -1 ? "" : withoutStage.slice(i + 3).trim();
};

/**
 * When a step applies, in the patient's own terms — the parenthetical of the
 * "Days Supply" spec ("56 days (Weeks 1–8)" -> "Weeks 1–8", "30 days per fill
 * (Month 4+)" -> "Month 4+"). Plain calendar language beats "56 days" for
 * someone working out where they are in a protocol.
 */
export const doseWindow = (product) => {
  const m = spec(product, "Days Supply").match(/\(([^)]+)\)/);
  return m ? m[1].trim() : "";
};

/**
 * Refill rhythm, read from the "Days Supply" spec ("56 days (Weeks 1–8)" -> every
 * 8 weeks). Deliberately not called "per month": these vials run 28 or 56 days,
 * and rounding that to a calendar month on an Rx page would be a claim, not a
 * rounding.
 */
export const refillCadence = (product) => {
  const days = Number((spec(product, "Days Supply").match(/(\d+)\s*days?/i) || [])[1]);
  if (!Number.isFinite(days) || days <= 0) return "";
  if (days % 7 === 0) {
    const weeks = days / 7;
    return weeks === 1 ? "every week" : `every ${weeks} weeks`;
  }
  return `every ${days} days`;
};

/** Resolve a blend's ids into visible products, in ladder order. */
const resolveBlend = (blend) => {
  const products = blend.ids.map(byId).filter((p) => p && !isHidden(p));
  if (!products.length) return null;
  const prices = products.map(priceValue).filter(Boolean);
  return {
    ...blend,
    products,
    fromPrice: prices.length ? Math.min(...prices) : null,
    // The cadence a patient settles into long-term is the last rung, not the starter.
    cadence: refillCadence(products[products.length - 1]),
  };
};

/** Programs for one category, with every derived field resolved. Empty when the
 *  category has no programs — callers then render their normal flat grid. */
export const programsFor = (category) =>
  PROGRAMS.filter((p) => p.category === category)
    .map((program) => {
      const blends = program.blends.map(resolveBlend).filter(Boolean);
      if (!blends.length) return null;
      const prices = blends.map((b) => b.fromPrice).filter(Boolean);
      return {
        ...program,
        blends,
        fromPrice: prices.length ? Math.min(...prices) : null,
        image: blends[0].products[0]?.img,
      };
    })
    .filter(Boolean);

/** Every product id already represented by a program in this category. */
export const programProductIds = (category) =>
  new Set(programsFor(category).flatMap((p) => p.blends.flatMap((b) => b.products.map((x) => x.id))));
