import { NextResponse } from "next/server";
import { db } from "@/db";
import { songs, purchases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signDownload } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { songId, email } = await req.json();
    const rows = await db.select().from(songs).where(eq(songs.id, songId));
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const song = rows[0];
    if (!song.isFree) return NextResponse.json({ error: "Not free" }, { status: 400 });
    const inserted = await db
      .insert(purchases)
      .values({
        songId,
        buyerEmail: String(email || "fan@example.com").toLowerCase(),
        amount: "0",
        currency: "USD",
        provider: "free",
        providerRef: `free_${Date.now()}`,
        status: "completed",
      })
      .returning();
    const token = signDownload({ purchaseId: inserted[0].id, songId, email: String(email) }, "24h");
    return NextResponse.json({ purchaseId: inserted[0].id, downloadUrl: `/api/download?token=${token}` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
