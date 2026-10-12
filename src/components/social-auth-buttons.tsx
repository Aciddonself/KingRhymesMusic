"use client";

import { useState } from "react";

export function SocialAuthButtons({ nextPath }: { nextPath: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setLoading(true);
    setError("");

    try {
      const url = `/api/auth/google?next=${encodeURIComponent(nextPath)}`;
      window.location.href = url;
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Could not start sign-in.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => void signIn()} disabled={loading} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm font-semibold transition hover:border-[#D4AF37]/45 hover:bg-white/[0.08] disabled:opacity-50 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? "Connecting..." : "Continue with Google"}
        </button>
        <button type="button" disabled className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm font-semibold opacity-50 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.32 1.44-3.75 1.44-3.24 0-5.78-2.33-5.78-5.44 0-2.96 2.23-5.17 5.34-5.49-.08-.3-.12-.72-.12-1.15 0-1.74 1.27-3.18 3.1-3.45v-.92h-2.8v-2.63h2.8v-1.94c0-2.76 1.67-4.26 4.1-4.26 1.16 0 2.15.22 3.06.62v2.82h-2.15c-1.64 0-1.95.94-1.95 1.9v2.3h3.03l-.46 2.63h-2.57v6.96c-.99.36-2.18.56-3.58.56z"/></svg>
          Apple sign-in coming soon
        </button>
      </div>
      {error && <p role="alert" className="text-center text-xs text-red-200">{error}</p>}
    </div>
  );
}