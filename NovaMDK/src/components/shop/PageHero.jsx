import React from "react";
import Reveal from "../ui/Reveal";
import BackButton from "../ui/BackButton";

/** Centered page header used by the Treatments / Supplements / Contact pages. */
export default function PageHero({ eyebrow, title, subtitle, chips = [], children, showBack = false }) {
  return (
    <section className="border-b border-line bg-surface">
      {showBack && (
        <div className="mx-auto max-w-[1340px] px-5 pt-6 md:px-10">
          <BackButton />
        </div>
      )}
      <div className="mx-auto max-w-[760px] px-5 pb-[clamp(2.8rem,6vw,4.5rem)] pt-[clamp(1.6rem,3vw,2.4rem)] text-center md:px-10">
        <Reveal>
          {eyebrow && <span className="nv-eyebrow">{eyebrow}</span>}
          <h1 className="mt-3 text-[clamp(2.2rem,5.5vw,3.6rem)] font-extrabold leading-[1.05] tracking-tight">{title}</h1>
          {subtitle && <p className="mx-auto mt-4 max-w-[52ch] text-[clamp(1rem,1.7vw,1.15rem)] text-muted">{subtitle}</p>}
          {chips.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              {chips.map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3.5 py-1.5 text-[0.82rem] font-medium text-muted">
                  {c}
                </span>
              ))}
            </div>
          )}
          {children}
        </Reveal>
      </div>
    </section>
  );
}
