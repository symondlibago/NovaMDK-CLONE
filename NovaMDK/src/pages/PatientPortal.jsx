import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import Seo from "../components/Seo";

export default function PatientPortalPage() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-bg text-ink">
      <Seo title="Patient Portal" noindex />
      <header className="flex h-15 shrink-0 items-center justify-between border-b border-line bg-surface px-4 md:px-6">
        <Link to="/" aria-label="NovaMDK home">
          <img src="/logo.png" alt="NovaMDK" className="h-9 w-auto" />
        </Link>
        <span className="hidden items-center gap-2 text-[0.85rem] font-medium text-muted sm:flex">
          <Lock size={13} className="text-primary" />
          Patient portal
        </span>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-[0.85rem] font-semibold text-muted transition-colors hover:border-primary hover:text-ink"
        >
          <ArrowLeft size={14} /> Exit
        </button>
      </header>

      <div className="relative flex-1">
        {!loaded && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-bg">
            <div className="flex flex-col items-center gap-3 text-muted">
              <Loader2 size={28} className="animate-spin text-primary" />
              <span className="text-[0.9rem] font-medium">Opening your patient portal…</span>
            </div>
          </div>
        )}
        <iframe
          src="https://patient.mdintegrations.com/messages"
          title="Patient portal"
          onLoad={() => setLoaded(true)}
          allow="camera; microphone; payment; geolocation; clipboard-write"
          className="h-full w-full border-0"
        />
      </div>
    </main>
  );
}
