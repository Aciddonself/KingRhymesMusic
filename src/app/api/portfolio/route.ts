import { NextResponse } from "next/server";
import { db } from "@/db";
import { milestones, galleryItems, videos, pressItems } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const [m, g, v, p] = await Promise.all([
      db.select().from(milestones),
      db.select().from(galleryItems),
      db.select().from(videos),
      db.select().from(pressItems),
    ]);
    return NextResponse.json({ milestones: m, gallery: g, videos: v, press: p });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ milestones: [], gallery: [], videos: [], press: [] });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  try {
    const { kind, ...data } = await req.json();
    if (kind === "milestone") {
      const r = await db.insert(milestones).values({ year: String(data.year), title: String(data.title), description: data.description || null }).returning();
      return NextResponse.json({ item: r[0] });
    }
    if (kind === "gallery") {
      const r = await db.insert(galleryItems).values({ imageUrl: String(data.imageUrl), caption: data.caption || null }).returning();
      return NextResponse.json({ item: r[0] });
    }
    if (kind === "video") {
      const r = await db.insert(videos).values({ youtubeId: String(data.youtubeId), title: String(data.title) }).returning();
      return NextResponse.json({ item: r[0] });
    }
    if (kind === "press") {
      const r = await db.insert(pressItems).values({ outlet: String(data.outlet), quote: String(data.quote), author: data.author || null }).returning();
      return NextResponse.json({ item: r[0] });
    }
    return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind");
  const id = searchParams.get("id");
  if (!kind || !id) return NextResponse.json({ error: "Missing" }, { status: 400 });
  const { eq } = await import("drizzle-orm");
  if (kind === "milestone") await db.delete(milestones).where(eq(milestones.id, id));
  if (kind === "gallery") await db.delete(galleryItems).where(eq(galleryItems.id, id));
  if (kind === "video") await db.delete(videos).where(eq(videos.id, id));
  if (kind === "press") await db.delete(pressItems).where(eq(pressItems.id, id));
  return NextResponse.json({ ok: true });
}
