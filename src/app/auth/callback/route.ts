import { NextResponse } from "next/server";
import { syncSupabaseUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/music";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=authentication", url.origin));
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) throw error || new Error("No authenticated Supabase user returned");

    const user = await syncSupabaseUser(data.user);
    if (!user) throw new Error("Could not sync the authenticated user profile");

    const destination = user.role === "admin" && next === "/admin" ? "/admin" : next === "/admin" ? "/music" : next;
    return NextResponse.redirect(new URL(destination, url.origin));
  } catch (error) {
    console.error("Supabase authentication callback failed", error);
    return NextResponse.redirect(new URL("/login?error=authentication", url.origin));
  }
}
