"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card, Input } from "@/components/ui";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const adminMode = searchParams.get("next") === "/admin";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not send the reset link.");
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not send the reset link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:py-20">
      <Card className="glass-arrive relative overflow-hidden p-6 sm:p-9">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#F1D97A]/70 to-transparent" />
        <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">{adminMode ? "Artist account recovery" : "Account recovery"}</div>
        <h1 className="mt-3 font-display text-4xl">Forgot your password?</h1>
        <p className="mt-3 text-sm leading-6 text-white/50">Enter the email on your account. We will send a secure reset link if it matches.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <div>
            <label htmlFor="email" className="text-xs font-medium text-white/55">Email address</label>
            <Input id="email" autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-1.5" />
          </div>
          <Button type="submit" disabled={loading} className="w-full !rounded-xl">{loading ? "Sending link..." : "Send reset link"}</Button>
        </form>
        {message && <p role="status" className="mt-4 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.07] p-3 text-sm leading-5 text-[#F1D97A]">{message}</p>}
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3 text-sm leading-5 text-red-200">{error}</p>}
        <p className="mt-6 text-center text-xs text-white/40"><Link href={adminMode ? "/login?next=%2Fadmin" : "/login"} className="text-[#D4AF37] transition hover:text-[#F1D97A] hover:underline">Back to sign in</Link></p>
      </Card>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-white/45">Loading recovery...</div>}><ForgotPasswordForm /></Suspense>;
}