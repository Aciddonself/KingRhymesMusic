import { NextResponse } from "next/server";
import { db } from "@/db";
import { songs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, slugify } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  try {
    const body = await req.json();
    const patch: Record<string, unknown> = {};
    if (body.title) {
      patch.title = String(body.title);
      if (body.slug || body.title) patch.slug = slugify(String(body.slug || body.title));
    }
    for (const k of ["coverUrl", "audioFullPath", "audioPreviewPath", "description", "lyrics", "genre"]) {
      const map: Record<string, string> = { coverUrl: "coverUrl", audioFullPath: "audioFullPath", audioPreviewPath: "audioPreviewPath", description: "description", lyrics: "lyrics", genre: "genre" };
      if (body[k] !== undefined) patch[map[k]] = body[k] || null;
    }
    // drizzle keys are camelCase-mapped? use direct column names
    const update: Record<string, unknown> = {};
    if (patch.title) update.title = patch.title;
    if (patch.slug) update.slug = patch.slug;
    if (body.coverUrl !== undefined) update.coverUrl = body.coverUrl || null;
    if (body.audioFullPath !== undefined) update.audioFullPath = body.audioFullPath || null;
    if (body.audioPreviewPath !== undefined) update.audioPreviewPath = body.audioPreviewPath || null;
    if (body.description !== undefined) update.description = body.description || null;
    if (body.lyrics !== undefined) update.lyrics = body.lyrics || null;
    if (body.genre !== undefined) update.genre = body.genre || "Hip-Hop / Dancehall Fusion";
    if (body.priceUsd !== undefined) update.priceUsd = String(body.priceUsd);
    if (body.isFree !== undefined) update.isFree = !!body.isFree;
    if (body.isPublished !== undefined) update.isPublished = !!body.isPublished;
    const updated = await db.update(songs).set(update).where(eq(songs.id, id)).returning();
    if (!updated.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ song: updated[0] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  await db.delete(songs).where(eq(songs.id, id));
  return NextResponse.json({ ok: true });
}
