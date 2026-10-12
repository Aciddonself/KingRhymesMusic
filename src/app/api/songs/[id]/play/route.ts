import { NextResponse } from "next/server";
import { db } from "@/db";
import { songs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.update(songs).set({ playCount: sql`${songs.playCount} + 1` }).where(eq(songs.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
