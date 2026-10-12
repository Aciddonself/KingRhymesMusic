"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card, Input } from "@/components/ui";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const hasAuthError = searchParams.get("error") === "authentication";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not reset your password.");
      setMessage(result.message);
      setPassword("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not reset your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:py-20">
      <Card className="glass-arrive relative overflow-hidden p-6 sm:p-9">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-gold-soft/70 to-transparent" />
        <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold">Secure account recovery</div>
        <h1 className="mt-3 font-display text-4xl">Choose a new password</h1>
        <p className="mt-3 text-sm leading-6 text-white/50">Use at least 12 characters. Your secure Supabase reset link expires automatically.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <div>
            <label htmlFor="password" className="text-xs font-medium text-white/55">New password</label>
            <Input id="password" autoComplete="new-password" required minLength={12} maxLength={128} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="12 characters or more" className="mt-1.5" />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-xl!">{loading ? "Updating password..." : "Update password"}</Button>
        </form>
        {hasAuthError && <p role="alert" className="mt-4 text-sm text-red-200">This reset link is invalid or has expired. Request a new one.</p>}
        {message && <p role="status" className="mt-4 rounded-xl border border-gold/20 bg-gold/[0.07] p-3 text-sm leading-5 text-gold-soft">{message}</p>}
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-400/6 p-3 text-sm leading-5 text-red-200">{error}</p>}
        <p className="mt-6 text-center text-xs text-white/40"><Link href="/login" className="text-gold transition hover:text-gold-soft hover:underline">Back to sign in</Link></p>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-white/45">Loading password reset...</div>}><ResetPasswordForm /></Suspense>;
}