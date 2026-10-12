import { NextResponse } from "next/server";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { rateLimit } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anon";
    if (!rateLimit(`sub:${ip}`, 10)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    const { email } = await req.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    try {
      await db.insert(subscribers).values({ email: String(email).toLowerCase().trim() });
    } catch {
      // already subscribed — still success
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
