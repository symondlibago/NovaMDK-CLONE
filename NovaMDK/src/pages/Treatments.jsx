import React, { Suspense, lazy } from "react";
import { Link, useParams, useSearchParams, Navigate } from "react-router-dom";
import {
  Stethoscope, Truck, Ban, ShieldCheck, ClipboardCheck, PackageOpen,
} from "lucide-react";
import Seo from "../components/Seo";
import Navbar from "../components/Nav/Navbar";
import Footer from "../components/Nav/Footer";
import PageHero from "../components/shop/PageHero";
import CategoryGrid from "../components/shop/CategoryGrid";
import TreatmentShop from "../components/shop/TreatmentShop";
import Reveal from "../components/ui/Reveal";
import { CONSULTS, CONSULT_ORDER } from "../components/data/consultations";
import { visibleProducts } from "../components/data/products";
import { CATEGORY_META } from "../lib/categoryMeta";
import { track, EVENTS } from "../lib/analytics";

const FAQ = lazy(() => import("../components/FAQ"));

const CAT_PHOTOS = {
  "weight-loss": { photo: "/cat-weightloss-right.webp", tone: "light", photoPos: "right 16%" },
  "unisex-skin-health": { photo: "/cat-skinhealth.webp", tone: "light", photoPos: "right center" },
  "unisex-sports-medicine": { photo: "/cat-sportsmedicine.webp", tone: "dark", photoPos: "right center" },
  "unisex-anti-aging-rx": { photo: "/cat-longetivity.webp", overlay: "/cat-longetivity-bottle.webp", tone: "dark", photoPos: "right center" },
};

// Mirror the homepage funnels — each tile browses that goal's shoppable catalog.
const TREATMENT_CATS = CONSULT_ORDER.map((k) => ({
  name: CONSULTS[k].name,
  tag: CONSULTS[k].tag,
  blurb: CONSULTS[k].blurb,
  cta: "Browse treatments",
  goal: CONSULTS[k].goalSlug,
  link: `/treatments/${CONSULTS[k].goalSlug}`,
  ...(CAT_PHOTOS[CONSULTS[k].goalSlug] || {}),
}));

// Valid product categories a quiz can land on (everything but pure supplements).
// Driven by visibility: a category with nothing shoppable is commented out of the
// nav, footer and carousel, so its URL should redirect here rather than render an
// empty shelf.
const VALID_GOALS = new Set(
  visibleProducts.filter((p) => p.categorySlug !== "supplements").map((p) => p.categorySlug)
);

const TRUST = [
  { icon: Stethoscope, label: "U.S. licensed providers" },
  { icon: Truck, label: "Fast, discreet delivery" },
  { icon: Ban, label: "No subscription lock-in" },
  { icon: ShieldCheck, label: "FDA-regulated pharmacies" },
];

const STEPS = [
  { icon: ClipboardCheck, title: "Take the 2-minute assessment", desc: "Answer a few private questions about your goals and history — no wrong answers." },
  { icon: Stethoscope, title: "A provider builds your plan", desc: "A licensed U.S. clinician reviews your intake and prescribes what actually fits you." },
  { icon: PackageOpen, title: "Delivered to your door", desc: "Fast, discreet delivery — with ongoing care and easy adjustments anytime." },
];

const STATS = [
  { b: "100%", s: "Physician-reviewed" },
  { b: "Fast", s: "Doorstep delivery" },
  { b: "0", s: "Waiting rooms" },
];

/* ------------------------------- sections ------------------------------- */
function TrustBand() {
  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-x-6 gap-y-5 px-5 py-6 md:grid-cols-4 md:px-10">
        {TRUST.map((t) => (
          <div key={t.label} className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-primary"><t.icon size={16} /></span>
            <span className="text-[0.88rem] font-medium leading-tight">{t.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="mx-auto max-w-[1180px] px-5 py-[clamp(2.5rem,5vw,5.5rem)] md:px-10">
      <Reveal className="mx-auto max-w-[60ch] text-center">
        <span className="nv-eyebrow">How it works</span>
        <h2 className="mt-3 text-[clamp(1.7rem,3.6vw,2.5rem)] font-extrabold leading-tight">Care in three simple steps</h2>
        <p className="mt-3 text-[1.02rem] leading-relaxed text-muted">From first question to front door — no clinics, no waiting rooms, no awkward pharmacy runs.</p>
      </Reveal>
      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal as="div" key={s.title} delay={(i % 3) * 0.08}>
            <div className="relative h-full rounded-[calc(22px*var(--nv-r-scale,1))] border border-line bg-surface p-7 nv-shadow">
              <span className="absolute right-6 top-6 font-mono text-[1.15rem] font-bold text-line-strong">0{i + 1}</span>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-on-primary"><s.icon size={22} /></span>
              <h3 className="mt-5 font-display text-[1.15rem] font-bold leading-tight">{s.title}</h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">{s.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="mx-auto max-w-[1180px] px-5 pb-[clamp(2rem,4vw,3rem)] md:px-10">
      <Reveal>
        <div className="relative overflow-hidden rounded-[calc(28px*var(--nv-r-scale,1))] border border-line bg-surface-2 px-6 py-[clamp(2.4rem,5vw,3.4rem)] text-ink md:px-10">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(60% 90% at 85% 0%, color-mix(in srgb, var(--nv-accent) 18%, transparent), transparent 70%)" }}
          />
          <div className="relative flex flex-col items-center gap-8 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <div>
              <h2 className="max-w-[20ch] font-display text-[clamp(1.5rem,3vw,2.2rem)] font-extrabold leading-tight">Care patients can actually stick with.</h2>
            </div>
            <div className="grid grid-cols-3 gap-x-8 gap-y-4 sm:gap-x-12">
              {STATS.map((s) => (
                <div key={s.s} className="text-center">
                  <b className="block text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold tracking-tight text-primary">{s.b}</b>
                  <span className="mt-1 block font-mono text-[0.66rem] uppercase tracking-[0.12em] text-muted">{s.s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function TreatmentsPage() {
  const { goal: goalParam } = useParams();
  const [params] = useSearchParams();
  const legacyGoal = params.get("goal");

  // Legacy ?goal= URLs redirect to the crawlable /treatments/:goal path.
  if (legacyGoal && VALID_GOALS.has(legacyGoal)) {
    return <Navigate to={`/treatments/${legacyGoal}`} replace />;
  }
  if (goalParam && !VALID_GOALS.has(goalParam)) {
    return <Navigate to="/treatments" replace />;
  }
  const validGoal = goalParam || null;
  const catMeta = validGoal ? CATEGORY_META[validGoal] : null;

  return (
    <main
      className="min-h-screen w-full text-ink"
      style={{ background: "color-mix(in oklab, var(--nv-accent) 30%, var(--nv-surface))" }}
    >
      <Seo
        title={catMeta ? catMeta.title : "Treatments — Physician-Prescribed Telehealth Care"}
        description={catMeta ? catMeta.description : "Explore NovaMDK treatments for weight loss, longevity, skin health, sexual wellness and recovery — prescribed online by licensed physicians and shipped to your door."}
        path={validGoal ? `/treatments/${validGoal}` : "/treatments"}
      />
      <Navbar />

      {validGoal ? (
        /* Came from a consultation → only that category's products (their own header) */
        <TreatmentShop category={validGoal} showBack />
      ) : (
        /* Manual visit → page hero + explore by goal (each tile starts a consultation) */
        <>
          <PageHero
            showBack
            eyebrow="Treatments"
            title="Find the treatment that fits you"
            subtitle="Prescription protocols formulated by licensed U.S. physicians, shipped to your door"
            chips={["US-licensed pharmacy", "Dedicated online care", "Fast delivery", "No lock-in"]}
          />
          <section className="mx-auto max-w-[1180px] px-5 py-[clamp(2.6rem,5vw,4rem)] md:px-10">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="nv-eyebrow">Browse by goal</span>
                <h2 className="mt-2 text-[clamp(1.5rem,3vw,2.1rem)] font-extrabold leading-tight">What can we help you treat?</h2>
                <p className="mt-2 max-w-[44ch] text-[1rem] text-muted">Choose what you're focused on and browse the treatments matched to it.</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5 sm:items-end">
                <Link to="/start" className="text-[0.92rem] font-semibold text-primary transition-colors hover:text-accent">
                  Not sure? Take the 2-min quiz →
                </Link>
                <Link to="/supplements" className="text-[0.92rem] font-semibold text-muted transition-colors hover:text-accent">
                  Looking for supplements? →
                </Link>
              </div>
            </div>
            <CategoryGrid
              items={TREATMENT_CATS}
              dark
              featured
              art="/pill.avif"
              onItemClick={(it) => track(EVENTS.CATEGORY_SELECTED, { category: it.goal, source: "treatments" })}
            />
          </section>  
        </>
      )}

      <TrustBand />
      <HowItWorks />
      <SocialProof />

      {/* FAQ (reused, re-themed). Testimonials live on the homepage only. */}
      <Suspense fallback={<div className="grid h-[200px] place-items-center bg-bg text-muted">Loading…</div>}>
        <FAQ />
      </Suspense>

      <Footer />
    </main>
  );
}
