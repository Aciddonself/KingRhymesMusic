import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/auth";

const genericMessage = "If an account exists for that email, a reset link will arrive shortly.";

export async function POST(request: Request) {
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`forgot-password:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many reset requests. Try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const email = String(body.email || "").toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    if (process.env.NODE_ENV === "production" && !siteUrl.startsWith("https://")) {
      return NextResponse.json({ error: "Password recovery requires an HTTPS site URL." }, { status: 503 });
    }

    const supabase = await createSupabaseServerClient();
    const redirectTo = new URL("/auth/callback?next=%2Freset-password", siteUrl).toString();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;

    return NextResponse.json({ message: genericMessage });
  } catch (error) {
    console.error("Supabase password reset request failed", error);
    return NextResponse.json({ error: "Unable to process the reset request." }, { status: 500 });
  }
}
