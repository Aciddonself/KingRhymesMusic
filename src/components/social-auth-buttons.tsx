"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SocialAuthButtons({ nextPath }: { nextPath: string }) {
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState("");

  async function signIn(provider: "google" | "apple") {
    setLoading(provider);
    setError("");

    try {
      const redirectTo = new URL("/auth/callback", window.location.origin);
      redirectTo.searchParams.set("next", nextPath);
      const { error: authError } = await createSupabaseBrowserClient().auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectTo.toString() },
      });
      if (authError) throw authError;
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Could not start sign-in.");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => void signIn("google")} disabled={!!loading} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm font-semibold transition hover:border-[#D4AF37]/45 hover:bg-white/[0.08] disabled:opacity-50">
          {loading === "google" ? "Connecting..." : "Continue with Google"}
        </button>
        <button type="button" onClick={() => void signIn("apple")} disabled={!!loading} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm font-semibold transition hover:border-[#D4AF37]/45 hover:bg-white/[0.08] disabled:opacity-50">
          {loading === "apple" ? "Connecting..." : "Continue with Apple"}
        </button>
      </div>
      {error && <p role="alert" className="text-center text-xs text-red-200">{error}</p>}
    </div>
  );
}
