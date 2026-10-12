import { NextResponse } from "next/server";
import { db } from "@/db";
import { comments, siteSettings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession, rateLimit, containsProfanity } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const songId = searchParams.get("songId");
  const adminView = searchParams.get("admin") === "1";
  try {
    const session = adminView ? await getSession() : null;
    if (adminView && (!session || session.role !== "admin")) return NextResponse.json({ error: "Admin only" }, { status: 403 });
    let rows = await db.select().from(comments).orderBy(desc(comments.createdAt));
    if (songId) rows = rows.filter((r) => r.songId === songId);
    if (!adminView) rows = rows.filter((r) => r.isApproved);
    // nest replies
    const top = rows.filter((r) => !r.parentId);
    const byParent: Record<string, typeof rows> = {};
    rows.filter((r) => r.parentId).forEach((r) => {
      const k = r.parentId!;
      if (!byParent[k]) byParent[k] = [];
      byParent[k].push(r);
    });
    const nested = top.map((c) => ({ ...c, replies: (byParent[c.id] || []).reverse() }));
    return NextResponse.json({ comments: nested, total: rows.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Log in to comment" }, { status: 401 });
    if (!rateLimit(`comment:${session.id}`, 10)) return NextResponse.json({ error: "Slow down — too many comments" }, { status: 429 });
    const { songId, body, parentId } = await req.json();
    if (!songId || !body) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const text = String(body).trim().slice(0, 1000);
    if (text.length < 2) return NextResponse.json({ error: "Comment too short" }, { status: 400 });
    if (containsProfanity(text)) return NextResponse.json({ error: "Comment blocked by spam filter" }, { status: 400 });
    const settings = await db.select().from(siteSettings);
    const approvalRequired = settings[0]?.approvalRequired ?? false;
    const isAdmin = session.role === "admin";
    const inserted = await db
      .insert(comments)
      .values({
        songId,
        userId: session.id,
        authorName: session.displayName,
        authorAvatar: session.avatarUrl || null,
        isArtistReply: isAdmin,
        body: text,
        isApproved: approvalRequired ? isAdmin : true,
        parentId: parentId || null,
      })
      .returning();
    return NextResponse.json({ comment: inserted[0], pending: approvalRequired && !isAdmin });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
