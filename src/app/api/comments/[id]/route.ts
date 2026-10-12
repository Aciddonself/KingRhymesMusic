import { NextResponse } from "next/server";
import { db } from "@/db";
import { comments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const rows = await db.select().from(comments).where(eq(comments.id, id));
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const c = rows[0];
  if (session.role !== "admin" && c.userId !== session.id) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  await db.delete(comments).where(eq(comments.id, id));
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const body = await req.json();
  // approve / hide / reply-as-artist handled via body
  if (body.action === "reply" && body.body) {
    const parent = (await db.select().from(comments).where(eq(comments.id, id)))[0];
    if (!parent) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const inserted = await db
      .insert(comments)
      .values({
        songId: parent.songId,
        userId: session.id,
        authorName: session.displayName,
        isArtistReply: true,
        body: String(body.body).slice(0, 1000),
        isApproved: true,
        parentId: id,
      })
      .returning();
    return NextResponse.json({ comment: inserted[0] });
  }
  const update: Record<string, unknown> = {};
  if (typeof body.isApproved === "boolean") update.isApproved = body.isApproved;
  if (body.body) update.body = String(body.body).slice(0, 1000);
  const updated = await db.update(comments).set(update).where(eq(comments.id, id)).returning();
  return NextResponse.json({ comment: updated[0] });
}
