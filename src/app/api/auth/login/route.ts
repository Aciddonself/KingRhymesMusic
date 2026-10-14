import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, signSession, SESSION_COOKIE, ADMIN_EMAIL, rateLimit } from "@/lib/auth";

export async function POST(req: Request) {
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
  }
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    const cleanEmail = String(email).toLowerCase().trim();
    const rows = await db.select().from(users).where(eq(users.email, cleanEmail));
    if (!rows.length) return NextResponse.json({ error: "No account found. Please sign up." }, { status: 401 });
    const u = rows[0];
    if (!u.passwordHash) return NextResponse.json({ error: "This account uses Google login" }, { status: 401 });
    const ok = await verifyPassword(password, u.passwordHash);
    if (!ok) return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    const role = cleanEmail === ADMIN_EMAIL ? "admin" : u.role;
    if (role !== u.role) await db.update(users).set({ role }).where(eq(users.id, u.id));
    const token = signSession({ id: u.id, email: u.email, displayName: u.displayName, avatarUrl: u.avatarUrl, role });
    const res = NextResponse.json({ ok: true, user: { id: u.id, email: u.email, displayName: u.displayName, role } });
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
