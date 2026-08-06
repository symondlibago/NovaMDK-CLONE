import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import useKioskMode from "../../lib/useKioskMode";
export default function GhlPrewarm({ src }) {
  const isKiosk = useKioskMode();
  const { pathname } = useLocation();
  const [warm, setWarm] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || pathname === "/contact") return;

    const go = () => {
      if (fired.current) return;
      fired.current = true;
      setWarm(true);
    };

    if (isKiosk) {
      const idle = window.requestIdleCallback;
      const id = idle ? idle(go, { timeout: 4000 }) : setTimeout(go, 2500);
      return () => (idle ? window.cancelIdleCallback(id) : clearTimeout(id));
    }

    // pointerover (not pointerenter) so it bubbles up from the anchor's children.
    const onIntent = (e) => {
      if (e.target?.closest?.('a[href^="/contact"]')) go();
    };
    const opts = { capture: true, passive: true };
    document.addEventListener("pointerover", onIntent, opts);
    document.addEventListener("touchstart", onIntent, opts);
    document.addEventListener("focusin", onIntent, opts);
    return () => {
      document.removeEventListener("pointerover", onIntent, opts);
      document.removeEventListener("touchstart", onIntent, opts);
      document.removeEventListener("focusin", onIntent, opts);
    };
  }, [isKiosk, pathname]);

  if (!warm || pathname === "/contact") return null;

  return (
    <iframe
      src={src}
      title=""
      aria-hidden="true"
      tabIndex={-1}
      className="pointer-events-none fixed h-px w-px border-0 opacity-0"
      style={{ left: -9999, top: 0, visibility: "hidden" }}
    />
  );
}
