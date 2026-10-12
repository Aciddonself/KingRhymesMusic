import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { syncSupabaseUser, ADMIN_EMAIL } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password, displayName, adminSetupToken } = await req.json();
    if (!email || !password || !displayName) return NextResponse.json({ error: "Email, password and display name required" }, { status: 400 });
    if (typeof password !== "string" || password.length < 12 || password.length > 128) return NextResponse.json({ error: "Use a password between 12 and 128 characters" }, { status: 400 });
    const cleanEmail = String(email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

    if (cleanEmail === ADMIN_EMAIL) {
      const expectedToken = process.env.ADMIN_SETUP_TOKEN;
      const provided = Buffer.from(String(adminSetupToken || ""));
      const expected = Buffer.from(expectedToken || "");
      if (!expected.length || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
        return NextResponse.json({ error: "A valid admin setup token is required for this account" }, { status: 403 });
      }
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: String(displayName).slice(0, 120),
        },
      },
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || "Signup failed" }, { status: 400 });
    }

    const user = await syncSupabaseUser(data.user);
    if (!user) return NextResponse.json({ error: "Account profile could not be created" }, { status: 500 });

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
      emailConfirmationRequired: !data.session,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
