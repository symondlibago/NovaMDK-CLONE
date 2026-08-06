import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { ChevronDown, ArrowRight, Menu, X, ClipboardList, LogIn, LifeBuoy } from "lucide-react";
import { getLenis } from "../../lib/smoothScroll";
import Marquee from "../ui/Marquee";
import useKioskMode from "../../lib/useKioskMode";
import { visibleProducts } from "../data/products";
import { productPath } from "../../lib/slug";

// Kiosk burger menu — top categories, each expanding to a few treatments plus
// the consultation quiz. Slugs mirror the treatment catalog + questionnaires.
const KIOSK_MENU = [
  { label: "Anti Aging", goal: "unisex-anti-aging-rx", consult: "longevity" },
  { label: "Sexual Health", goal: "mens-health", consult: "intimacy" },
  { label: "Weight Loss", goal: "weight-loss", consult: "weight-loss" },
  { label: "Skin Health", goal: "unisex-skin-health", consult: "skin" },
  { label: "Sport Medicine", goal: "unisex-sports-medicine", consult: "recovery" },
];

const EASE = [0.16, 1, 0.3, 1];

// Mirror the real treatment categories (see data/consultations.jsx). Each item
const treatmentItems = [
  { name: "Weight Loss", img: "/products/tirzepatide-niacinamide.avif", link: "/treatments/weight-loss" },
  { name: "Anti-Aging", img: "/products/nad-plus.avif", link: "/treatments/unisex-anti-aging-rx" },
  { name: "Skin Health", img: "/products/luminance.avif", link: "/treatments/unisex-skin-health" },
  { name: "Sexual Health", img: "/products/olympus-peak.avif", link: "/treatments/mens-health" },
  { name: "Sports Medicine", img: "/products/ldn.avif", link: "/treatments/unisex-sports-medicine" },
];

/* Peptide molecule list HIDDEN at client request (2026-06-20). "Supplements" is a
   plain link for now; restore this array + the NavDropdown/MobileGroup to bring the
   peptide menu back.
const supplementItems = [
  { name: "Semaglutide", img: "/site/luvirasupplement.avif", link: "/supplements" },
  { name: "Tirzepatide", img: "/site/luvirasupplement.avif", link: "/supplements" },
  { name: "Retatrutide (GLP-3)", img: "/site/luvirasupplement.avif", link: "/supplements" },
  { name: "BPC-157", img: "/site/luvirasupplement.avif", link: "/supplements" },
  { name: "NAD+", img: "/site/luvirasupplement.avif", link: "/supplements" },
  { name: "GHK-Cu", img: "/site/luvirasupplement.avif", link: "/supplements" },
  { name: "Thymosin Alpha 1", img: "/site/luvirasupplement.avif", link: "/supplements" },
  { name: "MOTS-C", img: "/site/luvirasupplement.avif", link: "/supplements" },
  { name: "IGF-1-LR3", img: "/site/luvirasupplement.avif", link: "/supplements" },
  { name: "Tesamorelin", img: "/site/luvirasupplement.avif", link: "/supplements" },
  { name: "Glow Blend", img: "/site/luvirasupplement.avif", link: "/supplements" },
];
*/

/* --------------------------- desktop dropdown --------------------------- */
function NavDropdown({ title, items, viewAllLink, openOnClick = false }) {
  const [open, setOpen] = useState(false);
  // Touch screens (kiosk) can't hover — open on tap and dim-tap to close.
  const hoverProps = openOnClick ? {} : { onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false) };
  return (
    <div className="relative" {...hoverProps}>
      <button
        aria-expanded={open}
        onClick={openOnClick ? () => setOpen((o) => !o) : undefined}
        className="flex items-center gap-1.5 py-2 text-[15px] font-medium text-muted transition-colors hover:text-ink"
      >
        {title}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="opacity-50" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            {openOnClick && <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setOpen(false)} />}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-1/2 top-full z-50 mt-2 max-h-[72vh] w-[330px] -translate-x-1/2 overflow-y-auto rounded-3xl border border-line bg-surface p-2.5 nv-shadow-lg nv-scroll"
          >
            <Link
              to={viewAllLink}
              onClick={() => setOpen(false)}
              className="group mb-2 flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3 text-[15px] font-medium text-primary transition-colors hover:bg-primary hover:text-on-primary"
            >
              <span className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-surface">
                  <img src={items[0]?.img} className="h-full w-full scale-[1.15] object-contain transition-transform group-hover:scale-[1.3]" alt="" />
                </span>
                View all {title.toLowerCase()}
              </span>
              <ArrowRight size={18} />
            </Link>
            <ul className="space-y-0.5">
              {items.map((item, i) => (
                <li key={i}>
                  <Link
                    to={item.link}
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between rounded-2xl px-4 py-2.5 transition-colors hover:bg-surface-2"
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-lg">
                        <img src={item.img} className="h-full w-full scale-[1.15] object-contain transition-transform group-hover:scale-[1.3]" alt={item.name} />
                      </span>
                      <span className="text-[15px] font-medium text-ink/80 transition-colors group-hover:text-ink">{item.name}</span>
                    </span>
                    <span className="font-mono text-[11px] tracking-tight text-muted/50">Rx</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------------------------- mobile accordion --------------------------- */
function MobileGroup({ title, items, close, viewAllLink, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-4">
      <button aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-[17px] font-medium text-ink">
        {title}
        <ChevronDown size={18} className={`text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex flex-col gap-3.5 pt-4">
              <Link to={viewAllLink} onClick={close} className="flex items-center gap-2 text-[15px] font-medium text-primary">
                View all {title.toLowerCase()} <ArrowRight size={14} />
              </Link>
              {items.map((item, i) => (
                <Link key={i} to={item.link} onClick={close} className="flex items-center gap-3 text-[15px] text-muted transition-colors hover:text-ink">
                  <span className="grid h-8 w-8 place-items-center rounded bg-surface-2">
                    <img src={item.img} alt={item.name} className="h-full w-full scale-[1.1] object-contain" />
                  </span>
                  {item.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KioskMenuGroup({ cat, close, open, onToggle }) {
  const treatments = visibleProducts.filter((p) => p.categorySlug === cat.goal);
  return (
    <div className="border-b border-line py-4">
      <button aria-expanded={open} onClick={onToggle} className="flex w-full items-center justify-between text-[17px] font-medium text-ink">
        {cat.label}
        <ChevronDown size={18} className={`text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex flex-col gap-1 pt-3">
              {treatments.map((t) => (
                <Link key={t.id} to={productPath(t)} onClick={close} className="flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] text-muted transition-colors hover:bg-surface-2 hover:text-ink">
                  <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2">
                    <img src={t.img} alt={t.name} loading="lazy" className="h-full w-full scale-[1.1] object-contain" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{t.name}</span>
                  <ArrowRight size={14} className="shrink-0 opacity-50" />
                </Link>
              ))}
              <Link to={`/start/${cat.consult}`} onClick={close} className="mt-2 flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-[14px] font-semibold text-on-primary transition-all hover:bg-primary-deep">
                <ClipboardList size={15} /> Start a Consultation
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------- navbar ------------------------------- */
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Which kiosk category is expanded — null for none. Single value, so opening
  // one closes whichever was open.
  const [openKioskGoal, setOpenKioskGoal] = useState(null);
  const isKiosk = useKioskMode();

  // Horizontal scroll meter pinned to the bottom of the header.
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  useEffect(() => {
    const lenis = getLenis();
    document.body.style.overflow = mobileOpen ? "hidden" : "unset";
    if (lenis) mobileOpen ? lenis.stop() : lenis.start();
    return () => { document.body.style.overflow = "unset"; if (lenis) lenis.start(); };
  }, [mobileOpen]);

  return (
    <>
      {/* promo bar — scrolling credential marquee */}
      <Marquee />

      <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl">
        <nav className="mx-auto flex min-h-[68px] max-w-[1340px] items-center justify-between px-5 md:px-10">
          <Link to="/" aria-label="NovaMDK home"><img src="/logo.png" alt="NovaMDK" className="h-[46px] w-auto md:h-[52px]" /></Link>

          {/* Desktop links stay off in kiosk mode at ANY width — the physical
              kiosk is 1080px wide (≥ lg), which otherwise doubles the menu */}
          {!isKiosk && (
            <div className="hidden items-center gap-7 lg:flex">
              <NavDropdown title="Treatments" viewAllLink="/treatments" items={treatmentItems} />
              <Link to="/supplements" className="py-2 text-[15px] font-medium text-muted transition-colors hover:text-ink">Supplements</Link>
              <Link to="/kiosk" className="py-2 text-[15px] font-medium text-muted transition-colors hover:text-ink">Kiosk</Link>
              <Link to="/contact" className="py-2 text-[15px] font-medium text-muted transition-colors hover:text-ink">Contact</Link>
            </div>
          )}

          {/* Kiosk mode: primary sections live on the navbar (the burger holds the meds menu) */}
          {isKiosk && (
            <div className="flex items-center gap-6">
              {/* touch screen: tap opens the dropdown instead of jumping to /treatments */}
              <NavDropdown title="Treatments" viewAllLink="/treatments" items={treatmentItems} openOnClick />
              <Link to="/supplements" className="py-2 text-[15px] font-medium text-muted transition-colors hover:text-ink">Supplements</Link>
              <Link to="/kiosk" className="py-2 text-[15px] font-medium text-muted transition-colors hover:text-ink">Kiosk</Link>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            {!isKiosk && (
              <>
                <Link to="/portal" className="hidden h-10 items-center gap-2 rounded-full border-2 border-primary bg-surface px-5 text-[14px] font-semibold text-primary transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-on-primary nv-shadow lg:flex">
                  <LogIn size={15} /> Patient Portal
                </Link>
                <Link to="/treatments" className="hidden h-10 items-center gap-2 rounded-full bg-primary px-5 text-[14px] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow lg:flex">
                  Get started
                </Link>
              </>
            )}

            {/* kiosk keeps the burger at any width — it holds the meds menu */}
            <button aria-label="Menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)} className={`grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink ${isKiosk ? "" : "lg:hidden"}`}>
              <Menu size={20} />
            </button>
          </div>
        </nav>

        {/* scroll progress meter */}
        <motion.div
          aria-hidden="true"
          style={{ scaleX }}
          className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-linear-to-r from-accent to-primary"
        />
      </header>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 z-[100] bg-ink/30 backdrop-blur-sm lg:hidden" />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220, ease: EASE }}
              data-lenis-prevent
              className="fixed right-0 top-0 z-[101] flex h-full w-[86%] max-w-sm flex-col overflow-y-auto bg-surface lg:hidden nv-scroll"
            >
              <div className="flex items-center justify-between border-b border-line p-4">
                <img src="/logo.png" alt="NovaMDK" className="h-9 w-auto" />
                <button aria-label="Close" onClick={() => setMobileOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-muted hover:text-ink">
                  <X size={20} />
                </button>
              </div>
              {isKiosk ? (
                /* Kiosk burger — category sections, then Portal / Support as buttons
                   directly under the last one (not pinned to the drawer foot, so
                   they sit with the list rather than floating away from it). */
                <div className="flex grow flex-col p-4">
                  {KIOSK_MENU.map((cat) => (
                    <KioskMenuGroup
                      key={cat.goal}
                      cat={cat}
                      open={openKioskGoal === cat.goal}
                      onToggle={() => setOpenKioskGoal((g) => (g === cat.goal ? null : cat.goal))}
                      close={() => setMobileOpen(false)}
                    />
                  ))}
                  <div className="mt-5 grid grid-cols-2 gap-2.5 pb-2">
                    <Link
                      to="/portal"
                      onClick={() => setMobileOpen(false)}
                      /* same accent mix as the marquee / Quick view / Choose your plan */
                      className="flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[color-mix(in_oklab,var(--nv-accent)_72%,var(--nv-surface))] px-3 py-3.5 text-[14px] font-semibold text-ink nv-shadow transition-all hover:-translate-y-0.5 hover:bg-[color-mix(in_oklab,var(--nv-accent)_86%,var(--nv-surface))]"
                    >
                      <LogIn size={16} /> Patient Portal
                    </Link>
                    <Link
                      to="/contact"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-line-strong bg-surface px-3 py-3.5 text-[14px] font-semibold text-ink transition-all hover:-translate-y-0.5 hover:bg-surface-2"
                    >
                      <LifeBuoy size={16} /> Support
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex grow flex-col p-4">
                  <MobileGroup title="Treatments" items={treatmentItems} close={() => setMobileOpen(false)} viewAllLink="/treatments" defaultOpen />
                  <Link to="/supplements" onClick={() => setMobileOpen(false)} className="flex items-center justify-between border-b border-line py-5 text-[17px] font-medium text-ink">
                    Supplements <ArrowRight size={16} className="text-muted" />
                  </Link>
                  <Link to="/kiosk" onClick={() => setMobileOpen(false)} className="flex items-center justify-between border-b border-line py-5 text-[17px] font-medium text-ink">
                    Kiosk <ArrowRight size={16} className="text-muted" />
                  </Link>
                  <Link to="/portal" onClick={() => setMobileOpen(false)} className="flex items-center justify-between border-b border-line py-5 text-[17px] font-medium text-ink">
                    Patient Portal <ArrowRight size={16} className="text-muted" />
                  </Link>

                  {/* Get a Recommendation — starts the free 2-minute questionnaire */}
                  <Link
                    to="/start"
                    onClick={() => setMobileOpen(false)}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-[15px] font-semibold text-on-primary nv-shadow transition-all hover:-translate-y-0.5 hover:bg-primary-deep"
                  >
                    <ClipboardList size={17} /> Get a Recommendation
                  </Link>

                  {/* bottom actions — Contact lives here as a button under Get started */}
                  <div className="mt-auto flex flex-col gap-2.5 pb-4 pt-8">
                    <Link to="/treatments" onClick={() => setMobileOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-full border border-line-strong bg-surface py-3.5 text-[15px] font-semibold text-ink transition-colors hover:bg-surface-2">
                      Get started <ArrowRight size={16} />
                    </Link>
                    <Link to="/contact" onClick={() => setMobileOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-surface py-3.5 text-[15px] font-semibold text-muted transition-colors hover:text-ink">
                      Contact
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
