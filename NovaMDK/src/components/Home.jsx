import React, { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ShieldCheck, Truck, Clock, Ban,
} from "lucide-react";

import Navbar from "./Nav/Navbar";
import Footer from "./Nav/Footer";
import HeroStage, { KIOSK_VARIANT_IDS } from "./home/HeroStage";
import Reveal from "./ui/Reveal";
import Photo from "./ui/Photo";
import { useTheme } from "../theme/ThemeContext";
import useKioskMode from "../lib/useKioskMode";

// Which hero the homepage shows on the portrait tablet / kiosk view.
//   • `?kiosk=<id>` (the studio preview iframe) forces a specific layout.
//   • Otherwise, on a real kiosk/portrait-tablet screen, the layout chosen in
//     the Design Studio drives the LIVE view — so picking "Desktop Hero"
//     changes the kiosk immediately, no preview needed. Persisted across reloads.
//   • On any other screen (normal desktop), returns null → standard hero.
function useKioskVariant() {
  const { kioskLayout } = useTheme();
  // Shared detection (param-sticky + portrait MQ) — must match the navbar and
  // the rest of the kiosk chrome, or the hero and nav disagree mid-session.
  const isKiosk = useKioskMode();

  const paramVariant = () => {
    if (typeof window === "undefined") return null;
    const v = new URLSearchParams(window.location.search).get("kiosk");
    return v && KIOSK_VARIANT_IDS.includes(v) ? v : null;
  };

  const forced = paramVariant();
  if (forced) return forced;
  return isKiosk ? kioskLayout.id : null;
}

// Testimonials disabled per legal review (no verified member feedback yet).
// const Testimonials = lazy(() => import("./Testimonials"));
const FAQ = lazy(() => import("./FAQ"));
const TreatmentsCarousel = lazy(() => import("./TreatmentsCarousel"));

const TRUST = [
  { text: "US-licensed pharmacy", icon: ShieldCheck },
  { text: "Fast delivery", icon: Truck },
  { text: "Dedicated online care", icon: Clock },
  { text: "No subscription lock-in", icon: Ban },
];

const STATS = [
  { b: "100%", s: "Physician-reviewed" },
  { b: "Fast", s: "Doorstep delivery" },
  { b: "~2 min", s: "Guided questionnaire" },
  { b: "0", s: "Waiting rooms" },
];

// The three-step "How it works" cards (replaces the old bento + steps section).
const HOW_STEPS = [
  {
    n: "01", eyebrow: "Step one", title: "Pick a treatment",
    desc: "Browse doctor-formulated options built around your goal.",
    img: "/visit-phone.avif", alt: "Choosing a treatment on a tablet",
    cta: "Browse treatments", to: "/treatments",
  },
  {
    n: "02", eyebrow: "Step two", title: "Talk to a doctor",
    desc: "Answer a few questions and a licensed provider reviews your plan and prescribes what fits.",
    img: "/doctor-consult.avif", alt: "A licensed doctor on a telehealth consultation",
    cta: "Start your assessment", to: "/start",
  },
  {
    n: "03", eyebrow: "Step three", title: "Delivered discreetly",
    desc: "Approved treatment ships free in plain, unmarked packaging, right to your door.",
    img: "/courier-delivery.avif", alt: "A courier delivering a discreet package",
    cta: "See treatments", to: "/treatments",
  },
];

export default function Home() {
  const kioskVariant = useKioskVariant();

  return (
    <main className="min-h-screen w-full bg-bg text-ink">
      <Navbar />
      <HeroStage kioskVariant={kioskVariant} />

      {/* ===== Trust strip ===== */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 py-4 md:px-10">
          {TRUST.map((t) => (
            <span key={t.text} className="flex items-center gap-2 text-[0.88rem] font-medium text-muted">
              <t.icon size={16} className="text-primary" /> {t.text}
            </span>
          ))}
        </div>
      </section>

      {/* ===== How it works (3 cards) ===== */}
      <section id="how" className="mx-auto w-full max-w-[1240px] scroll-mt-24 px-5 pt-[clamp(1.75rem,4.5vw,4.5rem)] md:px-10">
        <Reveal className="mx-auto mb-[clamp(1.5rem,3vw,2.5rem)] max-w-[60ch] text-center">
          <span className="nv-eyebrow">How it works</span>
          <h2 className="mt-3 text-[clamp(1.9rem,4vw,2.9rem)] font-extrabold leading-tight">Care in three simple steps</h2>
        </Reveal>
        <div className="grid grid-cols-1 items-stretch gap-3.5 md:grid-cols-3">
          {HOW_STEPS.map((s, i) => (
            <Reveal key={s.n} delay={(i % 3) * 0.08} className="h-full">
              <Link
                to={s.to}
                className="group relative flex h-full min-h-[clamp(300px,40vw,440px)] flex-col justify-between overflow-hidden rounded-[calc(26px*var(--nv-r-scale,1))] p-6 text-white md:p-7 nv-shadow transition-all duration-300 hover:-translate-y-1.5 hover:nv-shadow-lg"
              >
                <div className="absolute inset-0 z-0">
                  <Photo src={s.img} alt={s.alt} loading={i === 0 ? "eager" : "lazy"} className="h-full w-full" imgClassName="object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <span className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, color-mix(in oklab, var(--nv-ink-panel) 28%, transparent) 0%, color-mix(in oklab, var(--nv-ink-panel) 50%, transparent) 55%, color-mix(in oklab, var(--nv-ink-panel) 90%, transparent) 100%)" }} />
                <div className="relative z-10 flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-white/45 font-mono text-[0.72rem] font-bold">{s.n}</span>
                  <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-white/75">{s.eyebrow}</span>
                </div>
                <div className="relative z-10">
                  <h3 className="max-w-[16ch] font-display text-[clamp(1.4rem,2.4vw,1.95rem)] font-extrabold leading-tight">{s.title}</h3>
                  <p className="mt-2 max-w-[30ch] text-[0.92rem] leading-relaxed text-white/85">{s.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-[0.95rem] font-semibold">
                    {s.cta}
                    <span className="grid h-[34px] w-[34px] place-items-center rounded-full border border-white/50 transition-all group-hover:bg-white group-hover:text-ink"><ArrowRight size={14} /></span>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== Treatments & Solutions showcase (moved from Treatments page) ===== */}
      <Suspense fallback={<div className="grid h-[200px] place-items-center bg-bg text-muted">Loading…</div>}>
        <TreatmentsCarousel />
      </Suspense>

      {/* ===== Stats band ===== */}
      <section className="border-y border-line bg-surface-2 text-ink">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-6 px-5 py-[clamp(2.4rem,4vw,3.2rem)] md:grid-cols-4 md:px-10">
          {STATS.map((s) => (
            <div key={s.s} className="text-center">
              <b className="block text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-tight text-primary">{s.b}</b>
              <span className="mt-1.5 block font-mono text-[0.72rem] uppercase tracking-[0.13em] text-muted">{s.s}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FAQ ===== */}
      {/* Testimonials disabled per legal review until we have verified member
          feedback from actual clinician services. Re-enable <Testimonials />
          here once real reviews exist. */}
      <Suspense fallback={<div className="grid h-[200px] place-items-center bg-bg text-muted">Loading…</div>}>
        <div id="faq" className="scroll-mt-24"><FAQ /></div>
      </Suspense>

      {/* ===== Closing CTA ===== */}
      <section className="mx-auto mb-12 max-w-[1240px] px-5 md:px-10">
        <Reveal>
          <div className="relative grid min-h-[clamp(300px,42vw,460px)] items-center overflow-hidden rounded-[calc(28px*var(--nv-r-scale,1))]">
            <div className="absolute inset-0 z-0">
              <Photo src="/outdoor-group.avif" alt="A group of people standing together outdoors" className="h-full w-full" imgClassName="object-cover" />
            </div>
            <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(100deg, color-mix(in oklab, var(--nv-ink-panel) 86%, transparent) 0%, color-mix(in oklab, var(--nv-ink-panel) 55%, transparent) 52%, color-mix(in oklab, var(--nv-ink-panel) 18%, transparent) 100%)" }} />
            <div className="relative z-10 max-w-[34rem] p-[clamp(1.8rem,5vw,3rem)] text-white">
              <span className="nv-eyebrow text-accent">Begin</span>
              <h2 className="mt-3 text-[clamp(1.9rem,4.5vw,3rem)] font-extrabold leading-[1.06] text-white">A quick visit to a protocol that's yours</h2>
              <p className="mb-7 mt-3 max-w-[42ch] text-[1.06rem] text-white/85">Answer a few questions and let a doctor do the rest. Nothing to pay until you see your formulation</p>
              <Link to="/treatments" className="group inline-flex items-center gap-2 rounded-full bg-bg px-7 py-3.5 text-[0.96rem] font-semibold text-ink transition-all hover:-translate-y-0.5 nv-shadow-lg">
                Start your visit <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
