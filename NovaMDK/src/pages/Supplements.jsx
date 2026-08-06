import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Seo from "../components/Seo";
import Navbar from "../components/Nav/Navbar";
import Footer from "../components/Nav/Footer";
import PageHero from "../components/shop/PageHero";
// import CategoryGrid from "../components/shop/CategoryGrid"; // re-enable with the peptide list below
import Photo from "../components/ui/Photo";
import Reveal from "../components/ui/Reveal";
import { CompoundedDisclaimer } from "../components/Compliance";
import { ProductCard, QuickViewModal } from "../components/shop/ProductCard";
import { visibleProducts } from "../components/data/products";

// Only products flagged `live: true` are shoppable — the rest of the supplement
// catalog in products.jsx is placeholder data still awaiting the real list.
const LIVE_SUPPLEMENTS = visibleProducts.filter((p) => p.categorySlug === "supplements" && p.live);

/* ---------------------------------------------------------------------------
 * Peptide molecule list — HIDDEN at client request (2026-06-20). The page stays
 * live for upcoming supplement products. Uncomment this + the section below to
 * restore the "Browse by molecule" grid.
 * ---------------------------------------------------------------------------
const SUPPLEMENT_CATS = [
  { name: "Semaglutide", tag: "GLP-1", link: "/contact" },
  { name: "Tirzepatide", tag: "GLP-1 / GIP", link: "/contact" },
  { name: "Retatrutide", tag: "GLP-3", link: "/contact" },
  { name: "BPC-157", tag: "Recovery", link: "/contact" },
  { name: "NAD+", tag: "Longevity", link: "/contact" },
  { name: "GHK-Cu", tag: "Skin & repair", link: "/contact" },
  { name: "Thymosin Alpha 1", tag: "Immune", link: "/contact" },
  { name: "MOTS-C", tag: "Metabolic", link: "/contact" },
  { name: "Tesamorelin", tag: "Growth", link: "/contact" },
];
--------------------------------------------------------------------------- */

export default function SupplementsPage() {
  const [quickView, setQuickView] = useState(null);

  return (
    <main className="min-h-screen w-full bg-bg text-ink">
      <Seo
        title="Supplements — Clinical-Grade Formulas"
        description="Compounded peptides and daily-foundation supplements from NovaMDK, prepared by FDA-regulated pharmacies and matched to your protocol."
        path="/supplements"
      />
      <Navbar />

      <PageHero
        showBack
        eyebrow="Supplements"
        title="Clinical-grade formulas, tailored to your labs"
        subtitle="Compounded peptides and daily-foundation supplements, prepared by FDA-regulated pharmacies and matched to your protocol."
        chips={["503A compounding", "Physician-reviewed", "Purity tested"]}
      />

      {/* ===== Shoppable supplements — same card grid as the treatment listings ===== */}
      {LIVE_SUPPLEMENTS.length > 0 && (
        <section className="bg-surface-2 py-[clamp(2.5rem,5.5vw,4rem)]">
          <div className="mx-auto max-w-[1180px] px-5 md:px-10">
            <div className="mb-5 text-center sm:mb-6">
              <span className="nv-eyebrow">Available now</span>
              <h2 className="mt-1.5 text-[1.4rem] font-extrabold leading-tight sm:mt-2 sm:text-[clamp(1.8rem,4vw,2.6rem)]">
                Shop supplements
              </h2>
              <p className="mx-auto mt-1.5 max-w-[44ch] text-[0.78rem] text-muted sm:mt-2 sm:text-[1.02rem]">
                Non-prescription formulas we stock alongside your protocol — no intake required.
              </p>
            </div>

            {/* 2-up on phones, 3-up from tablet/kiosk width — matches the treatment shop */}
            <div className="grid grid-cols-2 gap-[clamp(0.9rem,1.6vw,1.25rem)] md:grid-cols-3">
              {LIVE_SUPPLEMENTS.map((p, i) => (
                <ProductCard key={p.id} p={p} delay={(i % 3) * 0.05} floatDelay={-(i % 4) * 0.9} onQuickView={setQuickView} />
              ))}
            </div>
          </div>

          <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
        </section>
      )}

      {/* Peptide molecule list hidden at client request (2026-06-20) — restore with SUPPLEMENT_CATS above.
      <section className="mx-auto max-w-[1180px] px-5 py-[clamp(2.6rem,5vw,4rem)] md:px-10">
        <span className="nv-eyebrow">Browse by molecule</span>
        <div className="mt-6">
          <CategoryGrid items={SUPPLEMENT_CATS} />
        </div>
      </section>
      */}

      {/* What arrives band */}
      <section className="mx-auto max-w-[1180px] px-5 pb-[clamp(3.5rem,7vw,6rem)] md:px-10">
        <div className="grid items-center gap-[clamp(2rem,5vw,4.5rem)] md:grid-cols-2">
          <Reveal>
            <span className="nv-eyebrow">What arrives</span>
            <h2 className="mt-3 text-[clamp(1.8rem,4vw,2.7rem)] font-extrabold leading-tight">Pre-sorted, dated, and ready to take</h2>
            <p className="mt-4 max-w-[46ch] text-[1.04rem] text-muted">Your supplements come split into morning and evening packs alongside any prescription treatments — one box, no juggling bottles.</p>
            <Link to="/contact" className="group mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[0.96rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow">
              Build your protocol <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
          <Reveal delay={0.08}>
            <Photo src="/site/amber-bottles.avif" alt="Hands holding two amber supplement bottles" className="min-h-[320px] w-full rounded-[calc(26px*var(--nv-r-scale,1))] border border-line nv-shadow" imgClassName="object-cover" />
          </Reveal>
        </div>

        {/* required compounded-drug + GLP-1 marketing disclaimers */}
        <CompoundedDisclaimer className="mx-auto mt-12 max-w-[680px] border-t border-line pt-6 text-center" />
      </section>

      <Footer />
    </main>
  );
}
