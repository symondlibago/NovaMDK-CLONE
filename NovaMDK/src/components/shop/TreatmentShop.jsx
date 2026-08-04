import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { productsData, visibleProducts } from "../data/products";
import { CompoundedDisclaimer } from "../Compliance";
import { ProductCard, QuickViewModal } from "./ProductCard";
import BackButton from "../ui/BackButton";

// Product ids pinned to the front of a category's listing (marketing priority).
// Empty since the final-offerings catalog swap — repopulate with new ids as needed.
const PINNED_FIRST = {};

export default function TreatmentShop({ category, showBack = false }) {
  const [quickView, setQuickView] = useState(null);
  const pinned = PINNED_FIRST[category] || [];
  const products = visibleProducts
    .filter((p) => p.categorySlug === category)
    .sort((a, b) => {
      const ai = pinned.indexOf(a.id);
      const bi = pinned.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;      // both unpinned â†’ keep original order
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;                            // both pinned â†’ pinned order
    });
  // The display name has to come from the full catalogue, not the visible list,
  // so the safety net below still has a heading to show.
  const name =
    products[0]?.categoryName ||
    productsData.find((p) => p.categorySlug === category)?.categoryName ||
    "";

  // Safety net only. Categories with nothing shoppable are commented out of the
  // nav, footer, carousel and categoryMeta, and Treatments.jsx redirects their
  // URLs — so this should never render. It exists so a stray link degrades to a
  // sentence rather than a blank page.
  if (!products.length) {
    return (
      <section id="shop" className="scroll-mt-24 bg-surface-2 pb-[clamp(2.5rem,5.5vw,5rem)] pt-2">
        <div className="mx-auto max-w-[1180px] px-5 md:px-10">
          {showBack && (
            <div className="mb-2 text-left">
              <BackButton />
            </div>
          )}
          <div className="mx-auto max-w-[520px] rounded-[calc(28px*var(--nv-r-scale,1))] border border-line bg-surface px-6 py-[clamp(2.5rem,6vw,4rem)] text-center nv-shadow">
            <span className="nv-eyebrow">{name}</span>
            <h2 className="mt-2 text-[clamp(1.6rem,3.4vw,2.2rem)] font-extrabold leading-tight">Not available right now</h2>
            <p className="mx-auto mt-3 max-w-[38ch] text-[1rem] leading-relaxed text-muted">
              Our care team can talk you through the treatments we do offer.
            </p>
            <Link
              to="/contact"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[0.95rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow"
            >
              Talk to our care team <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="shop" className="scroll-mt-24 bg-surface-2 pb-[clamp(2.5rem,5.5vw,5rem)] pt-2">
      <div className="mx-auto max-w-[1180px] px-5 md:px-10">
        {/* Back sits inline-left of the centered header from sm up — no stacked
            row above the title, so the header starts at the section's top edge */}
        <div className="relative mb-5 text-center sm:mb-6">
          {showBack && (
            <div className="mb-2 text-left sm:absolute sm:left-0 sm:top-0 sm:mb-0">
              <BackButton />
            </div>
          )}
          <span className="nv-eyebrow">Prescription treatments</span>
          <h2 className="mt-1.5 text-[1.4rem] font-extrabold leading-tight sm:mt-2 sm:text-[clamp(1.8rem,4vw,2.6rem)]">
            {name}
          </h2>
          <p className="mx-auto mt-1.5 max-w-[44ch] text-[0.78rem] text-muted sm:mt-2 sm:text-[1.02rem]">
            Pick a treatment to start your visit — a licensed provider confirms the right fit before anything ships.
          </p>
        </div>

        {/* 2-up on phones, 3-up from tablet/kiosk width, keeps the list scannable */}
        <div className="grid grid-cols-2 gap-[clamp(0.9rem,1.6vw,1.25rem)] md:grid-cols-3">
          {products.map((p, i) => (
            <ProductCard key={p.id} p={p} delay={(i % 3) * 0.05} floatDelay={-(i % 4) * 0.9} onQuickView={setQuickView} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/treatments"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-6 py-3 text-[0.95rem] font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-primary"
          >
            Explore other goals <ArrowRight size={15} />
          </Link>
        </div>

        {/* required compounded-drug + GLP-1 marketing disclaimers */}
        <CompoundedDisclaimer className="mx-auto mt-10 max-w-[680px] border-t border-line pt-6 text-center" />
      </div>

      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </section>
  );
}
