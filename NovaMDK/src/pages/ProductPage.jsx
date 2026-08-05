import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { track, EVENTS } from "../lib/analytics";
import {
  ArrowRight, ArrowLeft, Check, ShieldAlert, ShieldCheck, Truck, Stethoscope, Lock, FlaskConical, Loader2,
  QrCode, X, UserRound, ChevronDown, MapPin,
} from "lucide-react";
import Seo from "../components/Seo";
import Navbar from "../components/Nav/Navbar";
import Footer from "../components/Nav/Footer";
import Reveal from "../components/ui/Reveal";
import { productsData, visibleProducts, isCompounded, isOtc, isHidden, isPhotoImage } from "../components/data/products";
import { productSlug, productPath } from "../lib/slug";
import { syncToGhl, treatmentLabel } from "../lib/ghl";
import { ComplianceBadges, CompoundedDisclaimer, FdaDisclaimer, fdaDisclaimer } from "../components/Compliance";
import useKioskMode from "../lib/useKioskMode";
import useLockBodyScroll from "../lib/useLockBodyScroll";
import DatePicker from "../components/ui/DatePicker";

const TRUST = [
  { icon: Stethoscope, label: "U.S. licensed providers" },
  { icon: Truck, label: "Fast delivery" },
  { icon: Lock, label: "Discreet packaging" },
  { icon: FlaskConical, label: "Compounded in the USA" },
];

// The retail (non-Rx) line isn't compounded and doesn't run through a provider.
const TRUST_OTC = [
  { icon: Truck, label: "Fast delivery" },
  { icon: Lock, label: "Discreet packaging" },
  { icon: FlaskConical, label: "Third-party lab tested" },
  { icon: ShieldCheck, label: "No prescription needed" },
];

// Fallback questionnaire used when a product has no questionnaireId yet.
const DEFAULT_QUESTIONNAIRE_ID = "";

export default function ProductPage() {
  const { id } = useParams();
  // URLs use keyword slugs (/product/semaglutide-…); legacy numeric ids still
  // resolve and 301-style redirect to the slug so old links and QR codes work.
  const product = productsData.find((p) => String(p.id) === String(id) || productSlug(p) === id);

  const isKiosk = useKioskMode();
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Record a product view (high-signal: which treatments get attention).
  useEffect(() => {
    if (product) {
      track(EVENTS.PRODUCT_VIEWED, { id: product.id, name: product.name, category: product.categorySlug });
    }
  }, [product?.id]);

  if (!product) return <Navigate to="/treatments" replace />;
  // Pulled from the catalogue: bounce to the category rather than leaving a
  // buyable page reachable by old links, QR codes or a stale search result.
  if (isHidden(product)) {
    return <Navigate to={isOtc(product) ? "/supplements" : `/treatments/${product.categorySlug}`} replace />;
  }
  if (id !== productSlug(product)) return <Navigate to={productPath(product)} replace />;

  const categoryLabel = product.categoryName;
  // Retail items live on /supplements; the mock supplement catalog has no
  // /treatments/supplements listing to go back to.
  const otc = isOtc(product);
  const backLink = otc ? "/supplements" : `/treatments/${product.categorySlug}`;
  const related = visibleProducts
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id && isOtc(p) === otc)
    .slice(0, 3);
  const relatedHeading = `More in ${product.categoryName}`;
  const hasCompounded = isCompounded(product);
  const isSupplement = product.categorySlug === "supplements";
  const hasFda = isSupplement && !!fdaDisclaimer(product);
  const startVisit = async (patient) => {
    track(EVENTS.START_VISIT, { id: product.id, name: product.name, category: product.categorySlug });
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/mdi-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionnaire_id: product.questionnaireId || DEFAULT_QUESTIONNAIRE_ID,
          patient: patient?.email ? patient : null,
          consent: patient?.consent || null,
        }),
      });
      if (!res.ok) throw new Error("We couldn't start your visit just now — please try again.");
      const voucher = await res.json();
      // Contact-only submit + no MDI record found: the modal collects the
      // rest of the profile (steps 2–3) before we mint the voucher.
      if (voucher.need_profile) return { needProfile: true };

      // The one and only CRM write, deliberately placed after the profile is
      // complete. Syncing at the email gate meant every abandoned funnel — and
      // every mistyped address — left a contact behind with nothing but an
      // email, so the CRM filled with junk rows.
      //
      // Reaching this line means the profile exists: either MDI recognised a
      // returning patient (who never sees steps 1–3), or a new patient finished
      // step 3 and MDI created them. `patient_profile` is MDI's own record and
      // is authoritative; fall back to the modal's data if MDI couldn't be
      // read, so a completed profile is never lost.
      const profile = voucher.patient_profile || (patient?.first_name ? patient : null);
      if (profile?.email) {
        syncToGhl({
          patient: profile,
          treatment: treatmentLabel(product),
          // Prices are display strings ("$249"), so strip to a number for the
          // opportunity's value — GHL rejects anything non-numeric.
          value: Number(String(product.price).replace(/[^0-9.]/g, "")) || undefined,
          source: "NovaMDK website",
          tags: ["website-lead", product.categorySlug, "intake-started"],
          note: `Started ${treatmentLabel(product)}.` +
            (patient?.consent?.accepted_at
              ? ` Accepted telehealth consent and terms at ${patient.consent.accepted_at}.`
              : ""),
        });
      }

      const token = voucher.id || new URL(voucher.onboarding_url || "https://x.invalid").searchParams.get("token");
      if (token) {

        if (voucher.release_token) {
          try { sessionStorage.setItem("mdi_release_token", voucher.release_token); } catch { /* private mode */ }
        }
        navigate(`/intake?token=${encodeURIComponent(token)}&product=${encodeURIComponent(product.name)}&pid=${product.id}`);
        return;
      }
      // No URL on the voucher yet — surface it so the handoff can be finalized.
      console.info("MDI voucher minted:", voucher);
      setErr("Visit started — connecting you to intake shortly.");
    } catch (e) {
      setErr(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-bg text-ink">
      <Seo
        title={`${product.name} — ${product.categoryName}`}
        description={product.subtitle || `${product.name} from NovaMDK — physician-guided telehealth treatment, delivered to your door.`}
        path={productPath(product)}
        image={product.img}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.subtitle || undefined,
          image: `https://www.novamdk.com${product.img}`,
          category: product.categoryName,
          brand: { "@type": "Brand", name: product.brandName || "NovaMDK" },
        }}
      />
      <Navbar />

      {/* breadcrumb */}
      <div className="mx-auto max-w-[1180px] px-5 pt-6 md:px-10">
        <Link to={backLink} className="inline-flex items-center gap-1.5 text-[0.9rem] font-medium text-muted transition-colors hover:text-ink">
          <ArrowLeft size={15} /> Back to {categoryLabel}
        </Link>
      </div>

      {/* ===== Hero ===== */}
      <section className="mx-auto max-w-[1180px] px-5 py-[clamp(1.5rem,4vw,3rem)] md:px-10">
        {/* min-w-0 on the columns: long unbreakable product names (e.g.
            "Semaglutide/Cyanocobalamin") must not widen the grid track past
            the viewport on phones */}
        <div className="grid gap-8 md:grid-cols-2 md:items-start lg:gap-14">
          {/* image */}
          <Reveal className="min-w-0">
            <div className={`group/img relative flex min-h-90 items-center justify-center overflow-hidden rounded-[calc(30px*var(--nv-r-scale,1))] border border-line nv-shadow md:min-h-140 ${isPhotoImage(product.img) ? "" : "bg-white p-7 md:p-10"}`}>
              {/* pedestal shadow — only grounds a cut-out; a photo has its own */}
              {!isPhotoImage(product.img) && (
                <div className="pointer-events-none absolute bottom-[16%] left-1/2 h-6 w-2/5 -translate-x-1/2 rounded-[50%] bg-ink/15 blur-xl" />
              )}

              <span className="absolute left-6 top-6 z-10 rounded-full border border-line bg-surface/90 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-accent backdrop-blur-sm">
                {categoryLabel}
              </span>
              {product.dosageForm && (
                <span className="absolute bottom-6 left-6 z-10 rounded-full bg-ink px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-on-panel">
                  {product.dosageForm}
                </span>
              )}

              <img
                src={product.img}
                alt={product.name}
                className={
                  isPhotoImage(product.img)
                    ? "absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-[1.03]"
                    : "relative max-h-100 w-auto max-w-full object-contain mix-blend-multiply drop-shadow-2xl transition-transform duration-500 group-hover/img:scale-[1.03] md:max-h-115"
                }
              />
            </div>
          </Reveal>

          {/* info */}
          <Reveal delay={0.08} className="min-w-0">
            <div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-accent">{categoryLabel}</span>
              </div>

              <h1 className="mt-3 wrap-break-word font-display text-[clamp(1.85rem,3.6vw,2.6rem)] font-extrabold leading-[1.08] tracking-tight">{product.name}</h1>
              <p className="mt-3 max-w-[46ch] text-[1.05rem] leading-relaxed text-muted">{product.subtitle}</p>

              {/* required regulatory labels */}
              <ComplianceBadges compounded={isCompounded(product)} rx={!otc} className="mt-4" />

              {/* price block */}
              <div className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-2 border-t border-line pt-5">
                <span className="font-display text-[clamp(2.1rem,3vw,2.5rem)] font-extrabold leading-none tracking-tight">{product.price}</span>
                <span className="mb-0.5 flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-[0.82rem] font-medium text-muted">
                  <Truck size={14} className="text-accent" /> {product.shipping}
                </span>
              </div>

              {product.highlights?.length > 0 && (
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {product.highlights.map((h) => (
                    <li key={h.text} className="flex items-center gap-2.5 text-[0.94rem] font-medium">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/20 text-accent"><Check size={12} strokeWidth={3} /></span>
                      {h.text}
                    </li>
                  ))}
                </ul>
              )}

              {otc ? (
                /* No prescription, so no intake — the care team handles retail orders. */
                <Link
                  to="/contact"
                  className="group mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-4 text-[1rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow"
                >
                  Ask about this supplement <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              ) : isKiosk ? (
                <button
                  onClick={() => setShowQR(true)}
                  className="group mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-4 text-[1rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow"
                >
                  Start consultation <QrCode size={17} className="transition-transform group-hover:scale-110" />
                </button>
              ) : (
                <button
                  onClick={() => setShowInfo(true)}
                  disabled={loading}
                  className="group mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-4 text-[1rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Starting consultation…</>
                  ) : (
                    <>Start consultation <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>
                  )}
                </button>
              )}
              {err && !isKiosk && <p className="mt-2 text-center text-[0.84rem] font-medium text-primary">{err}</p>}

            </div>
          </Reveal>
        </div>

        {/* compliance disclaimers — one aligned row, icon + label so they're noticed quickly */}
        {(hasCompounded || hasFda) && (
          <div className={`mt-8 grid items-stretch gap-4 ${hasCompounded && hasFda ? "md:grid-cols-2" : "grid-cols-1"}`}>
            {hasCompounded && (
              <div className="flex gap-3.5 rounded-2xl border border-line bg-surface-2/60 p-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <FlaskConical size={16} />
                </span>
                <div>
                  <h4 className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.13em] text-ink">Compounded drug notice</h4>
                  <CompoundedDisclaimer className="mt-1.5" />
                </div>
              </div>
            )}
            {hasFda && (
              <div className="flex gap-3.5 rounded-2xl border border-line bg-surface-2/60 p-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <ShieldAlert size={16} />
                </span>
                <div>
                  <h4 className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.13em] text-ink">FDA disclaimer</h4>
                  <FdaDisclaimer product={product} className="mt-1.5" />
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ===== Trust band ===== */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-x-6 gap-y-5 px-5 py-6 md:grid-cols-4 md:px-10">
          {(otc ? TRUST_OTC : TRUST).map((t) => (
            <div key={t.label} className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-primary"><t.icon size={16} /></span>
              <span className="text-[0.88rem] font-medium leading-tight">{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== How it works ===== */}
      {product.howItWorks && (
        <section className="bg-surface-2 py-[clamp(2.5rem,5vw,5.5rem)]">
          <div className="mx-auto max-w-[1180px] px-5 md:px-10">
            <Reveal className="mx-auto max-w-[60ch] text-center">
              <span className="nv-eyebrow">How it works</span>
              <h2 className="mt-3 text-[clamp(1.6rem,3.4vw,2.4rem)] font-extrabold leading-tight">{product.howItWorks.title}</h2>
              <p className="mt-3 text-[1.02rem] leading-relaxed text-muted">{product.howItWorks.description}</p>
            </Reveal>
            <div className="mt-12 grid gap-5 sm:grid-cols-3">
              {product.howItWorks.steps.map((s, i) => (
                <Reveal as="div" key={i} delay={(i % 3) * 0.08}>
                  <div className="relative h-full rounded-[calc(22px*var(--nv-r-scale,1))] border border-line bg-surface p-7 nv-shadow">
                    <span className="absolute right-6 top-6 font-mono text-[1.1rem] font-bold text-line-strong">0{i + 1}</span>
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-on-primary">{s.icon}</span>
                    <h3 className="mt-5 font-display text-[1.15rem] font-bold">{s.title}</h3>
                    <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">{s.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Specs ===== */}
      {product.specs?.length > 0 && (
        <section className="mx-auto max-w-[1180px] px-5 py-[clamp(2.5rem,5vw,5.5rem)] md:px-10">
          <div className={`grid gap-10 ${isKiosk ? "" : "md:grid-cols-[1fr_1.25fr] md:items-start"}`}>
            <Reveal className={isKiosk ? "text-center" : ""}>
              <span className="nv-eyebrow">The details</span>
              <h2 className="mt-3 text-[clamp(1.6rem,3.4vw,2.2rem)] font-extrabold leading-tight">What's inside &amp; how it's dosed.</h2>
              <p className={`mt-3 max-w-[40ch] text-[1rem] text-muted ${isKiosk ? "mx-auto" : ""}`}>
                {otc
                  ? "A non-prescription formula you can add to your routine — our care team can tell you how it fits alongside your protocol."
                  : "Compounded by a licensed U.S. pharmacy and dispensed only after a provider's review of your intake."}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-[0.85rem] font-medium text-ink">
                <ShieldCheck size={15} className="text-accent" /> Quality-tested every batch
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <dl className="divide-y divide-line overflow-hidden rounded-[calc(22px*var(--nv-r-scale,1))] border border-line bg-surface nv-shadow">
                {product.specs.map((s) => (
                  <div key={s.label} className="grid grid-cols-1 gap-1 px-6 py-4 transition-colors hover:bg-surface-2 sm:grid-cols-[170px_1fr] sm:gap-4">
                    <dt className="font-mono text-[0.66rem] uppercase tracking-[0.1em] text-muted">{s.label}</dt>
                    <dd className="text-[0.94rem] leading-relaxed text-ink">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>
      )}

      {/* ===== Safety ===== */}
      {product.safety && (
        <section className="mx-auto mb-[clamp(3rem,6vw,5rem)] max-w-[1180px] px-5 md:px-10">
          <div className="rounded-[calc(22px*var(--nv-r-scale,1))] border border-line bg-surface-2 p-6 md:p-8">
            <h3 className="flex items-center gap-2 font-display text-[1.1rem] font-bold">
              <ShieldAlert size={18} className="text-primary" /> Important safety information
            </h3>
            <p className="mt-3 text-[0.92rem] leading-relaxed text-muted">{product.safety}</p>
          </div>
        </section>
      )}

      {/* ===== Closing CTA ===== */}
      <section className="mx-auto mb-[clamp(3rem,6vw,5rem)] max-w-[1180px] px-5 md:px-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-[calc(28px*var(--nv-r-scale,1))] border border-line bg-surface-2 px-6 py-[clamp(2.4rem,5vw,3.6rem)] text-center text-ink">
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(50% 80% at 50% 0%, color-mix(in srgb, var(--nv-accent) 18%, transparent), transparent 70%)" }}
            />
            <div className="relative">
              <h2 className="mx-auto max-w-[22ch] font-display text-[clamp(1.6rem,3.4vw,2.4rem)] font-extrabold leading-tight">
                {otc ? "Add " : "Start consultation for "}
                {product.name.split("—")[0].split("(")[0].split("/")[0].trim()}
                {otc ? " to your routine." : "."}
              </h2>
              <p className="mx-auto mt-3 max-w-[46ch] text-[1rem] text-muted">
                {otc
                  ? "No prescription or intake required. Message the care team and we'll get it on its way — and tell you how it pairs with your protocol."
                  : "A licensed provider reviews your intake and confirms the right fit. Nothing to pay until you're prescribed."}
              </p>
              {otc ? (
                <Link
                  to="/contact"
                  className="group mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-[1rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow-lg"
                >
                  Ask about this supplement <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              ) : isKiosk ? (
                <button
                  onClick={() => setShowQR(true)}
                  className="group mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-[1rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow-lg"
                >
                  Start consultation <QrCode size={17} className="transition-transform group-hover:scale-110" />
                </button>
              ) : (
                <button
                  onClick={() => setShowInfo(true)}
                  disabled={loading}
                  className="group mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-[1rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow-lg disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Starting…</>
                  ) : (
                    <>Start consultation <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>
                  )}
                </button>
              )}
              {err && !isKiosk && <p className="mt-3 text-[0.84rem] font-medium text-on-panel/80">{err}</p>}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ===== Related ===== */}
      {related.length > 0 && (
        <section className="mx-auto mb-[clamp(3.5rem,7vw,6rem)] max-w-[1180px] px-5 md:px-10">
          <h2 className="mb-6 text-[clamp(1.4rem,3vw,2rem)] font-extrabold">{relatedHeading}</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.id}
                to={productPath(r)}
                className="group rounded-[calc(22px*var(--nv-r-scale,1))] border border-line bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:nv-shadow-lg"
              >
                <div className="pointer-events-none flex h-32 items-center justify-center rounded-[calc(16px*var(--nv-r-scale,1))] bg-linear-to-br from-surface to-surface-2">
                  <img src={r.img} alt={r.name} loading="lazy" className="h-[88%] object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <h3 className="text-[0.98rem] font-bold leading-snug">{r.name}</h3>
                  <span className="shrink-0 text-[0.9rem] font-bold text-primary">{r.price}</span>
                </div>
                <span className="mt-2 inline-flex items-center gap-1 text-[0.82rem] font-semibold text-muted transition-colors group-hover:text-accent">
                  Shop now <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {showQR && (
        <KioskQrModal
          product={product}
          loading={loading}
          err={err}
          onClose={() => setShowQR(false)}
          onContinueHere={() => {
            setShowQR(false);
            setShowInfo(true);
          }}
        />
      )}

      {showInfo && (
        <PatientInfoModal
          loading={loading}
          err={err}
          onClose={() => setShowInfo(false)}
          onSubmit={startVisit}
        />
      )}

      <Footer />
    </main>
  );
}

const fmtCountdown = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, "0")}`;

/* Kiosk hand-off — two ways to continue: scan to finish privately on your own
   phone (recommended), or continue right here on the public kiosk. Auto-closes
   after 60s so the screen resets for the next patient. */
function KioskQrModal({ product, onClose, onContinueHere, loading = false, err = "" }) {
  const qrSrc = product.qrImg || `/qr/${product.id}.png`;
  const [imgError, setImgError] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  // Don't auto-close while a "continue here" request is in flight.
  useEffect(() => {
    if (loading) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [loading]);
  useEffect(() => {
    if (secondsLeft <= 0) onClose();
  }, [secondsLeft, onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] grid place-items-center bg-ink/65 p-6 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[440px] rounded-[calc(28px*var(--nv-r-scale,1))] border border-line bg-surface p-6 text-center nv-shadow-lg md:p-8"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <X size={18} />
        </button>

        <h3 className="mt-1 font-display text-[1.4rem] font-extrabold leading-tight">How would you like to continue?</h3>
        <p className="mx-auto mt-1.5 max-w-[34ch] text-[0.86rem] text-muted">
          Finishing on <span className="font-semibold text-ink">{product.name}</span>.
        </p>

        {/* Recommended — scan to your phone */}
        <div className="relative mt-6 rounded-2xl border-2 border-primary/30 bg-surface-2/40 p-5">
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-on-primary">
            Recommended
          </span>
          <div className="mx-auto grid h-[190px] w-[190px] place-items-center overflow-hidden rounded-xl border border-line bg-white p-2.5">
            {imgError ? (
              <div className="flex flex-col items-center gap-2 text-muted">
                <QrCode size={48} strokeWidth={1.4} />
                <span className="px-3 text-[0.68rem] leading-snug">Add a QR at <code className="text-ink">{qrSrc}</code></span>
              </div>
            ) : (
              <img
                src={qrSrc}
                alt={`QR code to continue ${product.name} on your phone`}
                onError={() => setImgError(true)}
                className="h-full w-full object-contain"
              />
            )}
          </div>
          <h4 className="mt-3.5 font-display text-[1.08rem] font-bold leading-tight">Scan to continue on your phone</h4>
          <span className="mx-auto mt-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[0.74rem] font-medium text-muted">
            <Lock size={12} className="text-primary" /> Private to your own device
          </span>
        </div>

        {/* divider */}
        <div className="my-4 flex items-center gap-3 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-muted">
          <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
        </div>

        {/* Continue here on the kiosk */}
        <button
          onClick={onContinueHere}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-6 py-3 text-[0.95rem] font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-surface-2 disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Starting consultation…</>
          ) : (
            "Continue here on the kiosk"
          )}
        </button>
        {err && (
          <p className="mx-auto mt-2.5 max-w-[34ch] rounded-lg bg-surface-2 px-3 py-2 text-[0.74rem] leading-snug text-muted">
            {err}
          </p>
        )}

        <p className="mt-5 border-t border-line pt-3 text-[0.72rem] text-muted">
          This screen resets in <span className="font-semibold text-ink">{fmtCountdown(secondsLeft)}</span>
        </p>
      </div>
    </div>
  );
}

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah",
  "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

const FEET_OPTIONS = ["3", "4", "5", "6", "7"].map((f) => ({ value: f, label: `${f} ft` }));
const INCH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ value: String(i), label: `${i} in` }));

/* Three-step pre-intake funnel. Step 1 captures the lead (the future
   marketing-CRM contact); steps 2–3 complete the record MDI requires to
   create the patient file up front — with it, the white-label intake skips
   every contact/profile screen and opens straight at the medical questions.
   Height/weight are entered in ft/in + lbs and converted to MDI's cm/kg. */
function PatientInfoModal({ onClose, onSubmit, loading = false, err = "" }) {
  useLockBodyScroll(); // mobile: page behind the modal must not scroll
  const [step, setStep] = useState(0); // 0 = email gate, then steps 1–3
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone_number: "",
    dob: "", gender: "", feet: "", inches: "", pounds: "",
    street: "", city: "", state: "", zip: "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setVal = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  // Consent lives on the email gate (step 0) — the one screen every patient
  // passes through, new or returning. We stamp the moment they agree and carry
  // it to MDI so it's recorded on the patient file, not just enforced in the UI.
  const [consent, setConsent] = useState({ telehealth: false, terms: false });
  const [consentAt, setConsentAt] = useState("");
  const toggleConsent = (k) => () => setConsent((c) => ({ ...c, [k]: !c[k] }));
  const consentValid = consent.telehealth && consent.terms;
  const consentRecord = (at) => ({
    telehealth_informed_consent: consent.telehealth,
    terms_and_privacy: consent.terms,
    accepted_at: at || consentAt,
    documents: {
      telehealth_consent: "/legal/telehealth-consent",
      terms_and_conditions: "/legal/terms-and-conditions",
      notice_of_privacy_practices: "/legal/hipaa-notice-of-privacy-practices",
    },
  });

  const emailValid = /^\S+@\S+\.\S+$/.test(form.email.trim());
  const step1Valid =
    form.first_name.trim().length > 0 &&
    form.last_name.trim().length > 0 &&
    form.phone_number.replace(/\D/g, "").length >= 10;

  const pounds = Number(form.pounds);
  const step2Valid =
    form.dob &&
    (form.gender === "1" || form.gender === "2") &&
    form.feet !== "" &&
    form.inches !== "" &&
    pounds >= 50 && pounds <= 999;

  const step3Valid =
    form.street.trim().length > 0 &&
    form.city.trim().length > 0 &&
    form.state &&
    /^\d{5}(-\d{4})?$/.test(form.zip.trim());

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (step === 0) {
      if (!emailValid || !consentValid) return;
      // Stamp consent at the moment they agree, then reuse that same timestamp
      // when the new-patient record is created a few steps later.
      const at = new Date().toISOString();
      setConsentAt(at);
      // Email-first: an existing MDI record is bound and goes straight into
      // the intake — returning patients never re-type their details.
      const res = await onSubmit({ email: form.email.trim(), consent: consentRecord(at) });
      if (res?.needProfile) setStep(1);
      return;
    }
    if (step === 1) {
      if (step1Valid) setStep(2);
      return;
    }
    if (step === 2) {
      if (step2Valid) setStep(3);
      return;
    }
    if (!step3Valid) return;
    const totalInches = Number(form.feet) * 12 + Number(form.inches);
    onSubmit({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone_number: form.phone_number.trim(),
      date_of_birth: form.dob, // <input type="date"> emits Y-m-d — MDI's format
      gender: Number(form.gender), // MDI: 1 = male, 2 = female
      height: Math.round(totalInches * 2.54), // MDI stores cm
      weight: Math.round(pounds * 0.45359237 * 10) / 10, // MDI stores kg
      address: {
        address: form.street.trim(),
        zip_code: form.zip.trim(),
        city_name: form.city.trim(),
        state_name: form.state,
      },
      consent: consentRecord(), // agreed at step 0; stored on the patient file
    });
  };

  const inputCls =
    "w-full rounded-xl border border-line bg-bg px-3.5 py-3 text-[0.95rem] text-ink placeholder:text-muted/60 focus:border-primary focus:outline-none";
  const labelCls = "flex flex-col gap-1 text-left text-[0.7rem] font-semibold uppercase tracking-wide text-muted";
  const TITLES = {
    0: ["What's your email address?", ""],
    1: ["First, a few details", "So your care team can reach you about your visit."],
    2: ["About you", "These go on your private patient file — your intake will skip them."],
    3: ["Where should we deliver?", "Physical delivery address — no PO boxes."],
  };

  return (
    /* data-lenis-prevent: Lenis intercepts touchmove globally, so without it a
       modal taller than the phone viewport can't be scrolled at all. */
    <div onClick={onClose} data-lenis-prevent className="fixed inset-0 z-120 flex overflow-y-auto bg-ink/65 p-6 backdrop-blur-sm">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative m-auto w-full max-w-110 rounded-3xl border border-line bg-surface p-6 nv-shadow-lg md:p-8"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <X size={18} />
        </button>

        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <UserRound size={22} />
        </span>
        <h3 className="mt-3 font-display text-[1.35rem] font-extrabold leading-tight">{TITLES[step][0]}</h3>
        {TITLES[step][1] && <p className="mt-1 text-[0.86rem] text-muted">{TITLES[step][1]}</p>}
        {step > 0 && (
          <p className="mt-2 font-mono text-[0.64rem] uppercase tracking-[0.16em] text-primary">Step {step} of 3</p>
        )}

        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          {step === 0 && (
            <>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="Email address"
                autoComplete="email"
                autoFocus
                className={inputCls}
              />
              <div className="mt-1 flex flex-col gap-2.5">
                <ConsentCheck checked={consent.telehealth} onToggle={toggleConsent("telehealth")}>
                  I consent to receive care via telehealth and agree to the{" "}
                  <ConsentLink href="/legal/telehealth-consent">Telehealth Consent</ConsentLink>.
                </ConsentCheck>
                <ConsentCheck checked={consent.terms} onToggle={toggleConsent("terms")}>
                  I agree to the{" "}
                  <ConsentLink href="/legal/terms-and-conditions">Terms &amp; Conditions</ConsentLink>{" "}
                  and{" "}
                  <ConsentLink href="/legal/hipaa-notice-of-privacy-practices">Notice of Privacy Practices</ConsentLink>,
                  and authorize NovaMDK to process my health information to provide care.
                </ConsentCheck>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <input value={form.first_name} onChange={set("first_name")} placeholder="First name" autoComplete="given-name" className={inputCls} />
                <input value={form.last_name} onChange={set("last_name")} placeholder="Last name" autoComplete="family-name" className={inputCls} />
              </div>
              <input type="tel" value={form.phone_number} onChange={set("phone_number")} placeholder="Mobile number" autoComplete="tel" className={inputCls} />
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className={labelCls}>
                  Date of birth
                  <DatePicker value={form.dob} onChange={setVal("dob")} placeholder="Select…" />
                </label>
                <label className={labelCls}>
                  Sex at birth
                  <NvSelect
                    value={form.gender}
                    onChange={setVal("gender")}
                    placeholder="Select…"
                    options={[{ value: "1", label: "Male" }, { value: "2", label: "Female" }]}
                  />
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className={labelCls}>
                  Height
                  <NvSelect value={form.feet} onChange={setVal("feet")} placeholder="ft…" options={FEET_OPTIONS} />
                </label>
                <label className={`${labelCls} justify-end`}>
                  <NvSelect value={form.inches} onChange={setVal("inches")} placeholder="in…" options={INCH_OPTIONS} />
                </label>
                <label className={labelCls}>
                  Weight
                  <input
                    value={form.pounds}
                    onChange={set("pounds")}
                    placeholder="lbs"
                    inputMode="numeric"
                    className={inputCls}
                  />
                </label>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {/* Street with live suggestions — picking one fills city/state/ZIP too */}
              <AddressAutocomplete
                value={form.street}
                onChange={set("street")}
                onPick={({ street, city, state, zip }) =>
                  setForm((f) => ({
                    ...f,
                    street: street || f.street,
                    city: city || f.city,
                    state: US_STATES.includes(state) ? state : f.state,
                    zip: zip || f.zip,
                  }))
                }
                className={inputCls}
              />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.city} onChange={set("city")} placeholder="City" autoComplete="address-level2" className={inputCls} />
                <input value={form.zip} onChange={set("zip")} placeholder="ZIP code" autoComplete="postal-code" inputMode="numeric" className={inputCls} />
              </div>
              <NvSelect value={form.state} onChange={setVal("state")} placeholder="State…" options={US_STATES} />
            </>
          )}

          <div className="mt-1 flex gap-2.5">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 rounded-full border border-line px-5 py-3.5 text-[0.92rem] font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-60"
              >
                <ArrowLeft size={15} /> Back
              </button>
            )}
            <button
              type="submit"
              disabled={(step === 0 ? !emailValid || !consentValid : step === 1 ? !step1Valid : step === 2 ? !step2Valid : !step3Valid) || loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[0.98rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> {step === 0 ? "Checking your records…" : "Preparing your intake…"}</>
              ) : step < 3 ? (
                <>Continue <ArrowRight size={16} /></>
              ) : (
                <>Continue to intake <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </form>

        {err && (
          <p className="mt-2.5 rounded-lg bg-surface-2 px-3 py-2 text-center text-[0.74rem] leading-snug text-muted">{err}</p>
        )}

        <p className="mt-3 flex items-center justify-center gap-1.5 text-[0.74rem] font-medium text-muted">
          <Lock size={12} className="text-primary" /> Encrypted &amp; used only for your medical visit
        </p>
      </div>
    </div>
  );
}

/* A required-consent checkbox row. Legal links open in a new tab so tapping one
   never navigates the patient out of the modal mid-consent. */
function ConsentCheck({ checked, onToggle, children }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="checkbox"
      aria-checked={checked}
      className="flex items-start gap-2.5 text-left text-[0.8rem] leading-snug text-muted"
    >
      <span
        className={`mt-px grid h-4.5 w-4.5 shrink-0 place-items-center rounded-md border transition-colors ${
          checked ? "border-primary bg-primary text-on-primary" : "border-line-strong bg-bg"
        }`}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      <span>{children}</span>
    </button>
  );
}

function ConsentLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="font-semibold text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
    >
      {children}
    </a>
  );
}

/* Themed dropdown — same pattern as Contact's TopicSelect: a button + branded
   menu instead of the unstylable native <select>. Options are strings or
   {value, label}; long lists scroll. */
function NvSelect({ value, onChange, options, placeholder = "Select…" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);

  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const current = opts.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-bg px-3.5 py-3 text-left text-[0.95rem] transition-colors focus:outline-none ${
          open ? "border-primary ring-2 ring-primary/15" : "border-line"
        } ${current ? "text-ink" : "text-muted/60"}`}
      >
        <span className="truncate">{current ? current.label : placeholder}</span>
        <ChevronDown size={17} className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          data-lenis-prevent
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-56 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 nv-shadow-lg nv-scroll"
        >
          {opts.map((o) => {
            const on = o.value === value;
            return (
              <li key={o.value} role="option" aria-selected={on}>
                <button
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[0.92rem] transition-colors ${
                    on ? "bg-surface-2 font-semibold text-primary" : "text-ink hover:bg-surface-2"
                  }`}
                >
                  {o.label}
                  {on && <Check size={14} className="text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* Street-address input with live suggestions (OpenStreetMap/Nominatim — free,
   no API key). Picking a suggestion also fills city, state, and ZIP. Swap the
   fetch for Google Places when an API key lands. */
function AddressAutocomplete({ value, onChange, onPick, className }) {
  const [sugs, setSugs] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => { document.removeEventListener("mousedown", onDoc); clearTimeout(timer.current); };
  }, []);

  const onInput = (e) => {
    onChange(e);
    const q = e.target.value.trim();
    clearTimeout(timer.current);
    if (q.length < 4) { setSugs([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=us&limit=5&q=${encodeURIComponent(q)}`
        );
        const list = await r.json();
        setSugs(Array.isArray(list) ? list : []);
        setOpen(Array.isArray(list) && list.length > 0);
      } catch {
        /* suggestions are best-effort — typing manually always works */
      }
    }, 350);
  };

  const pick = (s) => {
    const a = s.address || {};
    onPick({
      street: [a.house_number, a.road].filter(Boolean).join(" "),
      city: a.city || a.town || a.village || a.hamlet || "",
      state: a.state || "",
      zip: (a.postcode || "").slice(0, 5),
    });
    setOpen(false);
    setSugs([]);
  };

  return (
    <div ref={ref} className="relative">
      <input
        value={value}
        onChange={onInput}
        placeholder="Street address"
        autoComplete="off"
        className={className}
      />
      {open && (
        <ul data-lenis-prevent className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-56 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 nv-shadow-lg nv-scroll">
          {sugs.map((s) => (
            <li key={s.place_id}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-[0.88rem] leading-snug text-ink transition-colors hover:bg-surface-2"
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
                <span className="min-w-0">{s.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
