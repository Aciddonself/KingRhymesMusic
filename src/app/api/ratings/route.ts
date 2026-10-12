import { NextResponse } from "next/server";
import { db } from "@/db";
import { ratings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, rateLimit } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const songId = searchParams.get("songId");
  if (!songId) return NextResponse.json({ error: "songId required" }, { status: 400 });
  const rows = await db.select().from(ratings);
  const filtered = rows.filter((r) => r.songId === songId);
  const avg = filtered.length ? filtered.reduce((a, b) => a + b.stars, 0) / filtered.length : 0;
  const session = await getSession();
  let mine: number | null = null;
  if (session) {
    const m = filtered.find((r) => r.userId === session.id);
    if (m) mine = m.stars;
  }
  return NextResponse.json({ avg, count: filtered.length, mine });
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Log in to rate" }, { status: 401 });
    if (!rateLimit(`rate:${session.id}`, 30)) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    const { songId, stars } = await req.json();
    const s = parseInt(stars);
    if (!songId || !s || s < 1 || s > 5) return NextResponse.json({ error: "Stars must be 1-5" }, { status: 400 });
    const existing = await db.select().from(ratings).where(and(eq(ratings.songId, songId), eq(ratings.userId, session.id)));
    if (existing.length) {
      await db.update(ratings).set({ stars: s }).where(eq(ratings.id, existing[0].id));
    } else {
      await db.insert(ratings).values({ songId, userId: session.id, stars: s });
    }
    const rows = await db.select().from(ratings);
    const filtered = rows.filter((r) => r.songId === songId);
    const avg = filtered.reduce((a, b) => a + b.stars, 0) / filtered.length;
    return NextResponse.json({ ok: true, avg, count: filtered.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
