import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Navigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Lock, CreditCard, CheckCircle2, ShieldCheck } from "lucide-react";
import { productsData } from "../components/data/products";
import Seo from "../components/Seo";

const MDI_ORIGIN = "https://patient.mdintegrations.com";
const PAYMENT_TRIGGER_EVENTS = ["finish"];
const PAYMENT_TRIGGER_STEPS = ["thank-you"];

/* Embedded MDIntegrations patient intake — the questionnaire runs in an iframe */
export default function IntakePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [paid, setPaid] = useState(false);
  const [caseId, setCaseId] = useState(null);

  const token = params.get("token");
  const productName = params.get("product") || "";
  const pid = params.get("pid");
  const payDemo = params.get("paydemo") === "1";

  const product = pid ? productsData.find((p) => String(p.id) === String(pid)) : null;

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== MDI_ORIGIN) return;
      if (import.meta.env.DEV) console.log("[MDI message]", event.data);
      const msg = typeof event.data === "object" && event.data !== null ? event.data : {};
      if (msg.event === "encounter_created" && msg.data) {
        setCaseId(msg.data.encounter_id || null);
        sessionStorage.setItem("mdi_encounter", JSON.stringify(msg.data));
      }
      if (paid) return;
      if (
        PAYMENT_TRIGGER_EVENTS.includes(msg.event) ||
        (msg.event === "step" && PAYMENT_TRIGGER_STEPS.includes(msg.data?.step))
      ) {
        setPayOpen(true);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [paid]);

  useEffect(() => {
    if (!payDemo || !loaded || paid) return;
    const t = setTimeout(() => setPayOpen(true), 3000);
    return () => clearTimeout(t);
  }, [payDemo, loaded, paid]);

  if (!token) return <Navigate to="/treatments" replace />;

  const intakeSrc = `https://patient.mdintegrations.com?token=${encodeURIComponent(token)}`;
  const exitTo = pid ? `/product/${pid}` : "/treatments";

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-bg text-ink">
      <Seo title="Medical Intake" noindex />
      {/* slim header — logo home, context label, exit back to the product */}
      <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-line bg-surface px-4 md:px-6">
        <Link to="/" aria-label="NovaMDK home">
          <img src="/logo.png" alt="NovaMDK" className="h-9 w-auto" />
        </Link>
        <span className="hidden items-center gap-2 text-[0.85rem] font-medium text-muted sm:flex">
          <Lock size={13} className="text-primary" />
          Private medical intake{productName ? ` — ${productName}` : ""}
        </span>
        <button
          onClick={() => navigate(exitTo)}
          className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-[0.85rem] font-semibold text-muted transition-colors hover:border-primary hover:text-ink"
        >
          <ArrowLeft size={14} /> Exit
        </button>
      </header>

      {/* intake iframe fills the rest of the viewport */}
      <div className="relative flex-1">
        {!loaded && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-bg">
            <div className="flex flex-col items-center gap-3 text-muted">
              <Loader2 size={28} className="animate-spin text-primary" />
              <span className="text-[0.9rem] font-medium">Connecting you to your provider…</span>
            </div>
          </div>
        )}
        <iframe
          src={intakeSrc}
          title="Medical intake questionnaire"
          onLoad={() => setLoaded(true)}
          allow="camera; microphone; payment; geolocation; clipboard-write"
          className="h-full w-full border-0"
        />
      </div>

      {payOpen && !paid && (
        <PaymentGateModal
          productName={productName || product?.name || "Your treatment"}
          price={product?.price || "$0"}
          caseId={caseId}
          onPaid={() => {
            setPaid(true);
            setPayOpen(false);
          }}
        />
      )}
    </main>
  );
}

/* Placeholder checkout — blocks the intake until "payment" completes, then
   releases the held MDI case so it enters the clinician flow. Swap the fake
   charge delay for the real processor (Stripe/Square) when it's chosen. */
function PaymentGateModal({ productName, price, caseId, onPaid }) {
  const [status, setStatus] = useState("idle"); // idle | processing | error | done

  const pay = async () => {
    setStatus("processing");
    await new Promise((r) => setTimeout(r, 1600)); // fake card charge
    if (caseId) {
      try {
        let releaseToken = null;
        try { releaseToken = sessionStorage.getItem("mdi_release_token"); } catch { /* private mode */ }
        const res = await fetch("/api/mdi-release", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ case_id: caseId, release_token: releaseToken }),
        });
        if (!res.ok) throw new Error("release failed");
      } catch {
        setStatus("error");
        return;
      }
    }
    setStatus("done");
    setTimeout(onPaid, 1400);
  };

  return (
    <div className="fixed inset-0 z-120 grid place-items-center bg-ink/65 p-6 backdrop-blur-sm">
      <div className="w-full max-w-110 rounded-3xl border border-line bg-surface p-6 text-center nv-shadow-lg md:p-8">
        {status === "done" ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 size={44} className="text-primary" />
            <h2 className="text-[1.25rem] font-bold">Payment received</h2>
            <p className="text-[0.9rem] text-muted">Your visit is on its way to a provider…</p>
          </div>
        ) : (
          <>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <CreditCard size={22} />
            </span>
            <h2 className="mt-4 text-[1.25rem] font-bold">One last step — payment</h2>
            <p className="mt-1.5 text-[0.9rem] text-muted">
              Complete your payment to finish your intake and send your visit to a provider.
            </p>

            <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-line bg-bg px-4 py-3.5 text-left">
              <span className="text-[0.88rem] font-medium leading-snug">{productName}</span>
              <span className="shrink-0 text-[1.05rem] font-bold">{price}</span>
            </div>

            {status === "error" && (
              <p className="mt-3 text-[0.8rem] font-medium text-red-600">
                We couldn't confirm your visit just now — please try again.
              </p>
            )}

            <button
              onClick={pay}
              disabled={status === "processing"}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-4 text-[1rem] font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-deep nv-shadow disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {status === "processing" ? (
                <>
                  <Loader2 size={17} className="animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <Lock size={16} /> {status === "error" ? "Try again" : `Pay ${price}`}
                </>
              )}
            </button>

            <p className="mt-3 text-[0.75rem] text-muted">
              Placeholder checkout — no card is charged yet.
            </p>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.78rem] font-medium text-muted">
              <ShieldCheck size={14} className="text-primary" /> Encrypted &amp; HIPAA-secure checkout
            </p>
          </>
        )}
      </div>
    </div>
  );
}
