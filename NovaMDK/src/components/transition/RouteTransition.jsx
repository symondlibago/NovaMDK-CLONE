import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];

/** Branded loading veil shown briefly on every route change. */
export default function RouteTransition() {
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setShow(true);
    const t = setTimeout(() => setShow(false), 720);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] grid place-items-center bg-bg"
        >
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <img src="/logo.png" alt="NovaMDK" className="h-[58px] w-auto" />
            </motion.div>
            <div className="h-[3px] w-44 overflow-hidden rounded-full bg-line">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "120%" }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                className="h-full w-2/3 rounded-full bg-primary"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
