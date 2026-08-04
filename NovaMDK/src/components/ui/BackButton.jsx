import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ to = "/", label = "Back", className = "" }) {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(to);
  };
  return (
    <button
      onClick={goBack}
      className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-[0.88rem] font-medium text-muted transition-all hover:-translate-x-0.5 hover:border-line-strong hover:text-ink ${className}`}
    >
      <ArrowLeft size={16} /> {label}
    </button>
  );
}
