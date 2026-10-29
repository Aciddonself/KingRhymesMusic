"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

type CurrencyCtx = { currency: string; setCurrency: (c: string) => void };
const Ctx = createContext<CurrencyCtx>({ currency: "USD", setCurrency: () => {} });

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState("USD");
  return <Ctx.Provider value={{ currency, setCurrency }}>{children}</Ctx.Provider>;
}
export function useCurrency() {
  return useContext(Ctx);
}

type Toast = { id: number; message: string; kind: "success" | "error" | "info" };
const ToastCtx = createContext<{ push: (message: string, kind?: Toast["kind"]) => void }>({ push: () => {} });
export function useToast() {
  return useContext(ToastCtx);
}
let toastId = 1;
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, kind: Toast["kind"] = "info") => {
    const id = toastId++;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-[120] flex w-fit max-w-[calc(100vw-2rem)] flex-col items-end gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={`flex max-w-full items-center gap-2 rounded-full border px-3 py-2 text-xs shadow-lg backdrop-blur ${
              t.kind === "success"
                ? "border-emerald-400/30 bg-emerald-950/90 text-emerald-100"
                : t.kind === "error"
                  ? "border-red-400/30 bg-red-950/90 text-red-100"
                  : "border-white/10 bg-[#161411]/95 text-[#F5F1E6]"
            }`}
          >
            {t.message === "Refreshing..." ? (
              <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
            ) : t.kind === "success" ? (
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-400/20 text-[10px]" aria-hidden="true">✓</span>
            ) : t.kind === "error" ? (
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-red-400/20 text-[10px]" aria-hidden="true">!</span>
            ) : null}
            <span className="min-w-0">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
