"use client";
import React from "react";

export function Button({
  children,
  variant = "gold",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "gold" | "ghost" | "dark" | "danger" }) {
  const styles =
    variant === "gold"
      ? "border border-[#F1D97A]/50 bg-[linear-gradient(145deg,#F1D97A,#D4AF37_58%,#B58D25)] text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-2px_0_rgba(110,77,6,0.28),0_7px_0_rgba(85,62,16,0.25),0_12px_26px_rgba(0,0,0,0.28)] hover:brightness-110"
      : variant === "ghost"
        ? "glass-surface text-[#F5F1E6] hover:border-[#D4AF37]/60 hover:text-[#D4AF37]"
        : variant === "danger"
          ? "clay-inset text-red-300 hover:border-red-400/30 hover:text-red-200"
          : "clay-surface text-white hover:border-[#D4AF37]/25 hover:text-[#F1D97A]";
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-200 active:translate-y-1 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`clay-inset w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-[#F5F1E6] placeholder:text-[#A8A29A]/70 outline-none transition duration-300 hover:border-white/20 focus:border-[#D4AF37]/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-[#D4AF37]/20 ${props.className || ""}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`clay-inset w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#F5F1E6] placeholder:text-[#A8A29A]/70 outline-none focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 transition min-h-[110px] ${props.className || ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`clay-inset w-full rounded-xl border border-white/10 bg-[#161411] px-4 py-3 text-sm text-[#F5F1E6] outline-none focus:border-[#D4AF37]/60 ${props.className || ""}`}
    />
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-surface relative rounded-2xl p-5 ${className}`}>{children}</div>
  );
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
      {children}
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`} />;
}

export function Modal({
  open,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`glass-surface relative w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[92vh] overflow-y-auto rounded-t-3xl p-6 shadow-2xl sm:rounded-3xl`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/30"
          aria-label="Close"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
      <div className="text-4xl mb-3">◍</div>
      <div className="font-display text-xl">{title}</div>
      {hint && <div className="mt-2 text-sm text-[#A8A29A] max-w-sm">{hint}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ fontSize: size }} className={i <= Math.round(value) ? "text-[#D4AF37]" : "text-white/20"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function SectionHeading({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mb-8">
      <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37] mb-3">{kicker}</div>
      <h2 className="font-display text-3xl sm:text-5xl leading-[1.05] tracking-tight">{title}</h2>
      {sub && <p className="mt-3 max-w-2xl text-[#A8A29A] leading-relaxed">{sub}</p>}
    </div>
  );
}
