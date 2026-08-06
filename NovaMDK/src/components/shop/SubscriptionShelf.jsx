import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Check, RefreshCw, Stethoscope, Truck, Sparkles } from "lucide-react";
import { productPath } from "../../lib/slug";
import { getLenis } from "../../lib/smoothScroll";
import { doseStage, doseSize, doseWindow, refillCadence, priceValue } from "../data/subscriptions";

const EASE = [0.16, 1, 0.3, 1];

const REASSURANCE = [
  { icon: RefreshCw, text: "Cancel or pause anytime" },
  { icon: Stethoscope, text: "Provider reviews every refill" },
  { icon: Truck, text: "Shipped discreetly" },
];

/* ------------------------------- program card ------------------------------ */

function ProgramCard({ program, onOpen, delay }) {
  const { name, tagline, blurb, blends, fromPrice, image } = program;
  // The ladder is the whole point of a subscription, so it goes on the card face
  // rather than behind a tap. Shows the first blend's rungs because that's the one
  // the modal opens preselected — card and modal never disagree.
  const ladder = blends[0];
  const cadence = ladder.cadence;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: EASE, delay }}
      className="h-full"
    >
      <button
        type="button"
        onClick={() => onOpen(program)}
        aria-label={`Choose your ${name} plan`}
        className="group flex h-full w-full flex-col overflow-hidden rounded-[calc(22px*var(--nv-r-scale,1))] border border-line bg-surface p-4 text-left transition-all duration-300 nv-shadow hover:-translate-y-1 hover:border-primary/40 hover:nv-shadow-lg focus-visible:-translate-y-1 focus-visible:border-primary sm:p-5"
      >
        <div className="flex items-start gap-3.5">
          {/* no framing box — the vial is a transparent cut-out, so it reads as a
              product sitting on the card rather than a thumbnail in a well */}
          {image && (
            <img
              src={image}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="h-20 w-16 shrink-0 object-contain drop-shadow-[0_8px_16px_rgba(15,22,34,0.14)] transition-transform duration-500 group-hover:scale-105 sm:h-24 sm:w-20"
            />
          )}
          <span className="min-w-0 flex-1">
            <span className="block font-mono text-[0.56rem] uppercase tracking-[0.14em] text-accent sm:text-[0.62rem]">
              {tagline}
            </span>
            <span className="mt-1 block font-display text-[1.35rem] font-extrabold leading-tight tracking-tight text-ink transition-colors group-hover:text-primary sm:text-[1.6rem]">
              {name}
            </span>
            <span className="mt-1 block text-[0.72rem] text-muted sm:text-[0.8rem]">
              {blends.length} {blends.length === 1 ? "formulation" : "formulations"}
            </span>
          </span>
        </div>

        <p className="mt-3.5 line-clamp-3 text-[0.82rem] leading-relaxed text-muted sm:text-[0.9rem]">{blurb}</p>

        {/* Plain numbered steps with real calendar timing. The earlier version used
            connected bars, which read as a progress meter — implying a state the
            card doesn't have, and unreadable at a glance. */}
        <div className="mt-4 rounded-[calc(14px*var(--nv-r-scale,1))] border border-line bg-surface-2/50 p-3 sm:p-3.5">
          <span className="block text-[0.76rem] font-semibold text-ink sm:text-[0.8rem]">How your plan works</span>
          <ol className="mt-2.5 space-y-2">
            {ladder.products.map((p, i) => {
              const when = doseWindow(p);
              return (
                <li key={p.id} className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line bg-surface font-mono text-[0.68rem] font-bold text-ink">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[0.84rem] font-semibold text-ink sm:text-[0.9rem]">
                    {doseStage(p)}
                  </span>
                  {when && <span className="shrink-0 text-[0.74rem] text-muted sm:text-[0.78rem]">{when}</span>}
                </li>
              );
            })}
          </ol>
          <p className="mt-2.5 text-[0.72rem] leading-snug text-muted sm:text-[0.76rem]">
            You always begin at step 1. Your provider decides when you move up.
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-2 pt-4">
          <span>
            {fromPrice != null && (
              <span className="block font-display text-[1.5rem] font-extrabold leading-none text-ink sm:text-[1.7rem]">
                <span className="align-middle text-[0.72rem] font-semibold text-muted">From </span>${fromPrice}
              </span>
            )}
            {cadence && <span className="mt-1 block text-[0.7rem] text-muted sm:text-[0.76rem]">Refills {cadence}</span>}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--nv-accent)_72%,var(--nv-surface))] px-4 py-2 text-[0.8rem] font-semibold text-ink transition-all group-hover:bg-[color-mix(in_oklab,var(--nv-accent)_86%,var(--nv-surface))] sm:text-[0.86rem]">
            Choose your plan
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </button>
    </motion.div>
  );
}

/* ------------------------------ program modal ------------------------------ */

function ProgramModal({ program, onClose }) {
  const [blendSlug, setBlendSlug] = useState(null);

  useEffect(() => {
    if (!program) return;
    setBlendSlug(program.blends[0].slug);
    const lenis = getLenis();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      if (lenis) lenis.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [program, onClose]);

  const blend = program?.blends.find((b) => b.slug === blendSlug) || program?.blends[0];

  return (
    <AnimatePresence>
      {program && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          data-lenis-prevent
          role="dialog"
          aria-modal="true"
          aria-label={`${program.name} plans`}
          /* bottom sheet on phones, centred dialog from sm up */
          className="fixed inset-0 z-[120] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.28, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92vh] w-full max-w-[620px] overflow-y-auto rounded-t-[calc(28px*var(--nv-r-scale,1))] border border-line bg-surface nv-shadow-lg nv-scroll sm:max-h-[88vh] sm:rounded-[calc(28px*var(--nv-r-scale,1))]"
          >
            {/* grab handle — phones only */}
            <span className="sticky top-0 z-10 flex justify-center bg-surface pb-1 pt-2.5 sm:hidden">
              <span className="h-1 w-10 rounded-full bg-line-strong" aria-hidden="true" />
            </span>

            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3.5 top-3.5 z-20 grid h-9 w-9 place-items-center rounded-full bg-surface-2/80 text-muted backdrop-blur transition-colors hover:bg-surface-2 hover:text-ink sm:right-4 sm:top-4"
            >
              <X size={18} />
            </button>

            <div className="p-5 sm:p-7">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-accent">{program.tagline}</span>
              <h3 className="mt-1.5 pr-10 font-display text-[1.5rem] font-extrabold leading-tight tracking-tight sm:text-[1.9rem]">
                {program.name}
              </h3>
              <p className="mt-2 text-[0.88rem] leading-relaxed text-muted sm:text-[0.96rem]">{program.blurb}</p>

              {/* step 1 — formulation */}
              {program.blends.length > 1 && (
                <div className="mt-6">
                  <span className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-muted">
                    1 · Choose your formulation
                  </span>
                  <div className="mt-2.5 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Formulation">
                    {program.blends.map((b) => {
                      const on = b.slug === blend.slug;
                      return (
                        <button
                          key={b.slug}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setBlendSlug(b.slug)}
                          className={`flex items-center gap-2.5 rounded-[calc(14px*var(--nv-r-scale,1))] border px-3.5 py-3 text-left transition-all ${
                            on
                              ? "border-primary bg-[color-mix(in_oklab,var(--nv-accent)_16%,var(--nv-surface))]"
                              : "border-line bg-surface hover:border-line-strong"
                          }`}
                        >
                          <span
                            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
                              on ? "border-primary bg-primary text-on-primary" : "border-line-strong text-transparent"
                            }`}
                          >
                            <Check size={11} strokeWidth={3} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[0.86rem] font-semibold leading-tight text-ink">{b.name}</span>
                            {b.note && <span className="mt-0.5 block text-[0.72rem] leading-snug text-muted">{b.note}</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* step 2 — dose ladder */}
              <div className="mt-6">
                <span className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-muted">
                  {program.blends.length > 1 ? "2 · " : ""}How your plan works
                </span>
                <p className="mt-1.5 text-[0.82rem] leading-relaxed text-muted">
                  Everyone begins at step 1. Your provider moves you up as you tolerate it — you don't pick this yourself.
                </p>
                <ol className="mt-3 space-y-2">
                  {blend.products.map((p, i) => {
                    const price = priceValue(p);
                    const cadence = refillCadence(p);
                    return (
                      <li key={p.id}>
                        <Link
                          to={productPath(p)}
                          onClick={onClose}
                          className="group/step flex items-center gap-3 rounded-[calc(16px*var(--nv-r-scale,1))] border border-line bg-surface p-3 transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:nv-shadow sm:p-3.5"
                        >
                          <span
                            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-[0.72rem] font-bold ${
                              i === 0 ? "bg-primary text-on-primary" : "bg-surface-2 text-muted"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-baseline gap-x-2">
                              <span className="text-[0.92rem] font-semibold leading-tight text-ink">{doseStage(p)}</span>
                              {doseWindow(p) && (
                                <span className="text-[0.76rem] font-medium text-accent">{doseWindow(p)}</span>
                              )}
                            </span>
                            <span className="mt-0.5 block truncate text-[0.75rem] text-muted">
                              {doseSize(p)}
                              {cadence && ` · refills ${cadence}`}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            {price != null && (
                              <span className="block font-display text-[1rem] font-extrabold leading-none text-ink">${price}</span>
                            )}
                            <ArrowRight
                              size={13}
                              className="ml-auto mt-1 text-muted transition-transform group-hover/step:translate-x-0.5"
                            />
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-4">
                {REASSURANCE.map(({ icon: Icon, text }) => (
                  <span key={text} className="inline-flex items-center gap-1.5 text-[0.72rem] text-muted">
                    <Icon size={13} className="text-accent" /> {text}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* --------------------------------- section --------------------------------- */

export default function SubscriptionShelf({ programs }) {
  const [open, setOpen] = useState(null);
  if (!programs?.length) return null;

  return (
    <section aria-labelledby="subscription-heading" className="mt-1">
      <div className="relative rounded-[calc(26px*var(--nv-r-scale,1))] border border-line bg-linear-to-b from-surface to-surface-2/40 p-4 pt-7 nv-shadow sm:p-7 sm:pt-9">
        {/* badge straddles the panel edge */}
        <span
          className="absolute -top-3 left-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[0.56rem] font-semibold uppercase tracking-[0.14em] text-ink nv-shadow sm:left-7 sm:text-[0.62rem]"
          style={{
            background:
              "linear-gradient(100deg, color-mix(in oklab, var(--nv-accent) 60%, var(--nv-surface)) 0%, color-mix(in oklab, var(--nv-accent) 86%, var(--nv-surface)) 100%)",
          }}
        >
          <Sparkles size={11} /> Membership · Best value
        </span>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2
              id="subscription-heading"
              className="font-display text-[1.5rem] font-extrabold leading-tight tracking-tight sm:text-[clamp(1.7rem,3.2vw,2.2rem)]"
            >
              Subscription
            </h2>
            <p className="mt-1.5 max-w-[46ch] text-[0.84rem] leading-relaxed text-muted sm:text-[0.98rem]">
              Your program on autopilot — refilled and adjusted step by step with provider oversight.
            </p>
          </div>
          <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-[0.72rem] font-medium text-muted sm:text-[0.78rem]">
            <RefreshCw size={13} className="text-accent" /> Cancel or pause anytime
          </span>
        </div>

        <div className="mt-5 grid gap-3.5 sm:mt-6 sm:grid-cols-2 sm:gap-4">
          {programs.map((p, i) => (
            <ProgramCard key={p.slug} program={p} onOpen={setOpen} delay={i * 0.06} />
          ))}
        </div>
      </div>

      <ProgramModal program={open} onClose={() => setOpen(null)} />
    </section>
  );
}
