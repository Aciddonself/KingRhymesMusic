import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/auth";

export async function POST(request: Request) {
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`reset-password:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const password = String(body.password || "");
    if (password.length < 12 || password.length > 128) {
      return NextResponse.json({ error: "Use a password between 12 and 128 characters." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      console.error("Supabase password update failed", error);
      return NextResponse.json({ error: "Could not update the password." }, { status: 400 });
    }

    return NextResponse.json({ message: "Your password has been updated. Sign in with your new password." });
  } catch (error) {
    console.error("Supabase password reset failed", error);
    return NextResponse.json({ error: "Unable to reset your password." }, { status: 500 });
  }
}
