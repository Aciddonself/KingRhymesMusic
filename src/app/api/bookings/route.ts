import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getSession, rateLimit } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const rows = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  return NextResponse.json({ bookings: rows });
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anon";
    if (!rateLimit(`booking:${ip}`, 10)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    const { name, email, type, message, eventDate } = await req.json();
    if (!name || !email || !message) return NextResponse.json({ error: "Name, email and message required" }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    const inserted = await db
      .insert(bookings)
      .values({
        name: String(name).slice(0, 120),
        email: String(email).toLowerCase(),
        type: String(type || "Booking").slice(0, 60),
        message: String(message).slice(0, 2000),
        eventDate: eventDate ? String(eventDate).slice(0, 60) : null,
      })
      .returning();
    return NextResponse.json({ ok: true, booking: inserted[0] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
