import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, signSession, SESSION_COOKIE, ADMIN_EMAIL } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password, displayName, adminSetupToken } = await req.json();
    if (!email || !password || !displayName) return NextResponse.json({ error: "Email, password and display name required" }, { status: 400 });
    if (password.length < 12 || password.length > 128) return NextResponse.json({ error: "Password must be between 12 and 128 characters" }, { status: 400 });
    const cleanEmail = String(email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    const existing = await db.select().from(users).where(eq(users.email, cleanEmail));
    if (existing.length) return NextResponse.json({ error: "Email already registered. Log in instead." }, { status: 400 });
    const hash = await hashPassword(password);
    let role = "fan";
    if (cleanEmail === ADMIN_EMAIL) {
      const expectedToken = process.env.ADMIN_SETUP_TOKEN;
      const provided = Buffer.from(String(adminSetupToken || ""));
      const expected = Buffer.from(expectedToken || "");
      if (!expected.length || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
        return NextResponse.json({ error: "A valid admin setup token is required for this account" }, { status: 403 });
      }
      role = "admin";
    }
    const inserted = await db
      .insert(users)
      .values({ email: cleanEmail, passwordHash: hash, displayName: String(displayName).slice(0, 60), role })
      .returning();
    const u = inserted[0];
    const token = signSession({ id: u.id, email: u.email, displayName: u.displayName, avatarUrl: u.avatarUrl, role: u.role });
    const res = NextResponse.json({ ok: true, user: { id: u.id, email: u.email, displayName: u.displayName, role: u.role } });
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
