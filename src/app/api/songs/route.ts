import { NextResponse } from "next/server";
import { db } from "@/db";
import { songs, ratings } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getSession, slugify, rateLimit } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminRequested = searchParams.get("admin") === "1";
    if (adminRequested) {
      const session = await getSession();
      if (!session || session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    const publishedOnly = !adminRequested;
    const q = (searchParams.get("q") || "").toLowerCase();
    const genre = searchParams.get("genre") || "";
    let rows = await db.select().from(songs).orderBy(desc(songs.createdAt));
    if (publishedOnly) rows = rows.filter((r) => r.isPublished);
    if (q) rows = rows.filter((r) => (r.title + " " + (r.description || "")).toLowerCase().includes(q));
    if (genre) rows = rows.filter((r) => r.genre === genre);

    // attach ratings
    const allRatings = await db.select().from(ratings);
    const bySong: Record<string, number[]> = {};
    allRatings.forEach((r) => {
      if (!bySong[r.songId]) bySong[r.songId] = [];
      bySong[r.songId].push(r.stars);
    });
    const data = rows.map((s) => {
      const arr = bySong[s.id] || [];
      const avg = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      return { ...s, audioFullPath: adminRequested ? s.audioFullPath : null, avgRating: avg, ratingCount: arr.length };
    });
    return NextResponse.json({ songs: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load songs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
    if (!rateLimit(`song-create:${session.id}`, 30)) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    const body = await req.json();
    const title = String(body.title || "").trim();
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
    let slug = body.slug ? slugify(String(body.slug)) : slugify(title);
    // ensure unique
    const existing = await db.select().from(songs).where(eq(songs.slug, slug));
    if (existing.length) slug = `${slug}-${Date.now().toString(36)}`;
    const inserted = await db
      .insert(songs)
      .values({
        title,
        slug,
        coverUrl: body.coverUrl || null,
        audioFullPath: body.audioFullPath || null,
        audioPreviewPath: body.audioPreviewPath || null,
        description: body.description || null,
        lyrics: body.lyrics || null,
        genre: body.genre || "Hip-Hop / Dancehall Fusion",
        priceUsd: String(body.priceUsd ?? "1.99"),
        isFree: !!body.isFree,
        isPublished: body.isPublished !== false,
      })
      .returning();
    return NextResponse.json({ song: inserted[0] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create song" }, { status: 500 });
  }
}
