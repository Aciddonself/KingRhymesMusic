"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Input, Button } from "@/components/ui";
import { useToast } from "@/components/providers";
import { SocialAuthButtons } from "@/components/social-auth-buttons";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { push } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminMode = searchParams.get("next") === "/admin";
  const errorCode = searchParams.get("error");
  const authError = errorCode === "authentication"
    ? "Authentication failed or expired. Please try signing in again."
    : errorCode === "oauth_unavailable"
      ? "Google sign-in is not configured yet. Please use your email and password or contact the site administrator."
    : errorCode
      ? "Google sign-in could not be completed. Please try again or use email and password."
      : "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Login failed");
      push(`Welcome back, ${result.user.displayName}!`, "success");
      router.push(result.user.role === "admin" ? "/admin" : "/music");
      router.refresh();
    } catch (error: unknown) {
      push(error instanceof Error ? error.message : "Login failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative mx-auto grid min-h-[70vh] max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
      <div className="glass-arrive relative py-4 lg:py-10">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#F1D97A]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.8)]" />
          {adminMode ? "Artist control room" : "King Rhymes account"}
        </div>
        <h1 className="max-w-xl font-display text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
          {adminMode ? <>BACK TO<br /><span className="text-gold-gradient">THE BOOTH.</span></> : <>YOUR MUSIC.<br /><span className="text-gold-gradient">YOUR SPACE.</span></>}
        </h1>
        <p className="mt-5 max-w-md text-sm leading-6 text-white/55">
          {adminMode ? "Sign in with your artist account to manage releases, bookings, and the studio." : "Sign in to rate tracks, join the conversation, and keep your music close."}
        </p>
        <div className="mt-8 hidden items-center gap-3 text-xs text-white/40 sm:flex">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-gold">KR</span>
          <span>Where Rhymes Reign</span>
          <span className="h-px w-12 bg-white/15" />
          <span>Secure account access</span>
        </div>
      </div>

      <Card className="glass-arrive relative overflow-hidden p-6 transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37]/30 hover:shadow-[0_30px_90px_rgba(212,175,55,0.14)] sm:p-8">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#F1D97A]/70 to-transparent" />
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold">{adminMode ? "Administrator" : "Member access"}</div>
            <h2 className="mt-2 font-display text-3xl">{adminMode ? "Admin sign in" : "Welcome back"}</h2>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.045] text-lg text-[#F1D97A] transition duration-300 group-hover:scale-105" aria-hidden="true">✦</span>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {authError && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3 text-xs text-red-200">{authError}</p>}
          <div>
            <label htmlFor="email" className="text-xs font-medium text-white/55">Email address</label>
            <Input id="email" autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-1.5" />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="password" className="text-xs font-medium text-white/55">Password</label>
              <Link href={adminMode ? "/forgot-password?next=%2Fadmin" : "/forgot-password"} className="text-xs text-gold transition hover:text-gold-soft hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <Input id="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" type={showPassword ? "text" : "password"} />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-3 my-auto rounded-md px-2 text-[11px] font-semibold text-white/45 transition hover:bg-white/10 hover:text-gold-soft focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#D4AF37]">
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="group w-full !rounded-xl !py-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(212,175,55,0.3)]">
            <span>{loading ? "Signing in..." : adminMode ? "Enter control room" : "Sign in"}</span>
            {!loading && <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-white/25"><span className="h-px flex-1 bg-white/10" />Or continue with<span className="h-px flex-1 bg-white/10" /></div>
        <SocialAuthButtons nextPath={adminMode ? "/admin" : "/music"} />
        <p className="mt-5 text-center text-xs text-white/45">New to the site? <Link href="/signup" className="font-semibold text-gold transition hover:text-gold-soft hover:underline">Create an account</Link></p>
        {adminMode && <p className="mt-4 text-center text-[11px] text-white/35">Artist accounts are provisioned with the configured admin email.</p>}
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="mx-auto max-w-md px-4 py-20 text-center text-sm text-white/45">Loading sign in...</div>}><LoginForm /></Suspense>;
}