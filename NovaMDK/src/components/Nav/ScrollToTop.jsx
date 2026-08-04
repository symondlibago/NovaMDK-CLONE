import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getLenis } from "../../lib/smoothScroll";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    const lenis = getLenis();

    // Anchor navigation (e.g. "/#how", "/#faq") — smooth-scroll to the target.
    if (hash) {
      const id = hash.slice(1);
      let tries = 0;
      const tryScroll = () => {
        const el = document.getElementById(id);
        if (el) {
          if (lenis) lenis.scrollTo(el, { offset: -84 });
          else el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (tries++ < 12) {
          // Section may be lazy-loaded; retry a few frames.
          setTimeout(tryScroll, 80);
        }
      };
      requestAnimationFrame(tryScroll);
      prevPathname.current = pathname;
      return;
    }

    // Normal route change — jump to top instantly.
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      if (lenis) lenis.scrollTo(0, { immediate: true });
      else requestAnimationFrame(() => window.scrollTo(0, 0));
    }
  }, [pathname, hash]);

  return null;
}
