import React from "react";
// `rx={false}` for the non-prescription retail line — labelling an OTC product
// "Rx only" would be plainly wrong, so it gets the opposite badge instead.
export function ComplianceBadges({ compounded = true, rx = true, className = "" }) {
  return (
    <div className={`flex flex-wrap items-center gap-1 sm:gap-1.5 ${className}`}>
      <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 font-mono text-[0.5rem] font-semibold uppercase tracking-[0.08em] text-ink sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[0.58rem] sm:tracking-[0.1em]">
        <span className={`h-1.5 w-1.5 rounded-full ${rx ? "bg-primary" : "bg-accent"}`} />
        {rx ? "Rx only" : "No prescription"}
      </span>
      {compounded && (
        <span className="inline-flex items-center rounded-full border border-line bg-surface-2 px-2 py-0.5 font-mono text-[0.5rem] font-semibold uppercase tracking-[0.08em] text-muted sm:px-2.5 sm:py-1 sm:text-[0.58rem] sm:tracking-[0.1em]">
          Compounded
        </span>
      )}
    </div>
  );
}

const FDA_RESEARCH =
  "This product is an experimental chemical compounded for research use only. Claims about the use of this product and its safety have not been evaluated or approved by the FDA. This product is not intended to diagnose, treat, cure, or prevent any disease. Use only in consultation with a medical provider. Results are not guaranteed, and you may experience side effects.";
const FDA_NOT_APPROVED =
  "Claims about the use of this product have not been evaluated or approved by the FDA. Use only in consultation with a medical provider. Results are not guaranteed, and you may experience side effects.";
const FDA_COMPOUNDED =
  "Compounded products have not been evaluated or approved by the FDA. Use only in consultation with a medical provider. Results are not guaranteed, and you may experience side effects.";

const FDA_GROUPS = [
  { text: FDA_RESEARCH, match: ["nad", "mots-c", "bpc-157", "tb-500", "tb4", "thymosin beta 4", "selank", "semax", "ipamorelin"] },
  { text: FDA_NOT_APPROVED, match: ["ss-31", "retatrutide"] },
  { text: FDA_COMPOUNDED, match: ["tesamorelin", "tirzepatide"] },
];

export function fdaDisclaimer(product) {
  // A product can carry its own required wording (e.g. the DSHEA statement on
  // the non-Rx supplement line); otherwise fall back to name matching.
  if (product?.fdaDisclaimer) return product.fdaDisclaimer;
  const name = (product?.name || "").toLowerCase();
  for (const g of FDA_GROUPS) {
    if (g.match.some((m) => name.includes(m))) return g.text;
  }
  return null;
}

export function FdaDisclaimer({ product, className = "" }) {
  const text = fdaDisclaimer(product);
  if (!text) return null;
  return <p className={`text-[0.82rem] italic leading-relaxed text-muted ${className}`}>{text}</p>;
}

export function CompoundedDisclaimer({ className = "", tone = "muted" }) {
  const color = tone === "panel" ? "text-on-panel/55" : "text-muted";
  return (
    <div className={`space-y-2 text-[0.78rem] leading-relaxed ${color} ${className}`}>
      <p>
        Compounded drug products are not approved or evaluated for safety, effectiveness, or quality by
        the FDA. Prescription required. NovaMDK does not manufacture drug products.
      </p>
      <p>
        The medication you receive may differ in appearance from the website images. Results not
        guaranteed and side effects may occur.
      </p>
    </div>
  );
}
