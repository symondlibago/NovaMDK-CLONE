import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ClipboardCheck, Stethoscope, Dna, PackageOpen } from "lucide-react";
import Reveal from "../ui/Reveal";
import Photo from "../ui/Photo";

const EASE = [0.16, 1, 0.3, 1];

// On phones the four steps share the viewport, so without help they'd pop in all
// at once. Detect mobile to slow each step down and reveal them one-by-one as the
// patient scrolls.
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return mobile;
}

const STEPS = [
  { title: "Free Assessment", desc: "Complete a brief, secure intake form detailing your health history and unique goals to see if you qualify.", Icon: ClipboardCheck },
  { title: "Provider Review", desc: "A licensed US specialist evaluates your profile to design a treatment plan explicitly tailored to your biology.", Icon: Stethoscope },
  { title: "Customized Treatment", desc: "Your provider formulates a precise dosage and medication schedule tailored exclusively for your body and goals.", Icon: Dna },
  { title: "Discreet Delivery", desc: "Medication is shipped rapidly and discreetly to your door, with unlimited ongoing access to your care team.", Icon: PackageOpen },
];

/**
 * "How it works" — the steps sit beside a photo and reveal one-by-one as they
 * scroll into view.
 */
export default function HowItWorks() {
  const isMobile = useIsMobile();
  return (
    <section id="how" className="relative scroll-mt-24 bg-bg py-[clamp(2rem,4vw,3.5rem)]">
      <div className="mx-auto max-w-[1180px] px-5 md:px-10">
        <Reveal className="mx-auto mb-[clamp(1.75rem,4vw,3.5rem)] max-w-[60ch] text-center">
          <span className="nv-eyebrow">How it works</span>
          <h2 className="mt-3 text-[clamp(1.9rem,4vw,2.9rem)] font-extrabold leading-tight">Exceptional care, made simple </h2>
        </Reveal>

        <div className="overflow-hidden rounded-[calc(28px*var(--nv-r-scale,1))] border border-line bg-surface nv-shadow-lg">
          <div className="grid md:grid-cols-2">
            {/* Steps — reveal step by step on scroll */}
            <div className="flex flex-col justify-center gap-6 p-[clamp(1.6rem,4vw,3rem)] md:gap-7">
              {STEPS.map((step, i) => {
                const Icon = step.Icon;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: -26, filter: "blur(4px)" }}
                    whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    viewport={isMobile ? { once: false, amount: 0.6 } : { once: false, margin: "0px 0px -22% 0px" }}
                    transition={{ duration: isMobile ? 0.95 : 0.6, ease: EASE, delay: isMobile ? i * 0.12 : 0 }}
                    className="group flex items-start gap-4"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-on-primary shadow-sm transition-transform duration-300 group-hover:scale-105">
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[0.72rem] font-medium text-accent">0{i + 1}</span>
                        <h3 className="font-display text-[1.18rem] font-bold text-ink">{step.title}</h3>
                      </div>
                      <p className="mt-1 max-w-[44ch] text-[0.93rem] leading-relaxed text-muted">{step.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Photo */}
            <div className="relative min-h-[320px] md:min-h-0">
              <div className="absolute inset-0">
                <Photo src="/how-it-works.avif" alt="A member completing their online visit on a laptop at home" className="h-full w-full" imgClassName="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
