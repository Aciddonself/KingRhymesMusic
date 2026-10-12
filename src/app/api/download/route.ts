import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/db";
import { songs, purchases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyDownload } from "@/lib/auth";
import { getPrivateMediaUrl } from "@/lib/media-storage";

// GET /api/download?token=...  — short-lived signed URL, verifies purchase/free before serving full audio
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });
  const payload = verifyDownload(token);
  if (!payload) return NextResponse.json({ error: "Link expired or invalid" }, { status: 401 });

  const songRows = await db.select().from(songs).where(eq(songs.id, payload.songId));
  if (!songRows.length) return NextResponse.json({ error: "Song not found" }, { status: 404 });
  const song = songRows[0];

  if (!song.isFree) {
    if (!payload.purchaseId) return NextResponse.json({ error: "Purchase required" }, { status: 402 });
    const pRows = await db.select().from(purchases).where(eq(purchases.id, payload.purchaseId));
    if (!pRows.length || pRows[0].status !== "completed" || pRows[0].songId !== song.id) {
      return NextResponse.json({ error: "Full audio locked — complete purchase first" }, { status: 402 });
    }
  }

  const filePath = song.audioFullPath || song.audioPreviewPath;
  if (!filePath) return NextResponse.json({ error: "No audio file" }, { status: 404 });

  // If it's a remote URL, redirect
  if (filePath.startsWith("http")) {
    return NextResponse.redirect(filePath);
  }
  try {
    const inline = searchParams.get("inline") === "1";
    const privateMedia = await getPrivateMediaUrl(filePath, 300, inline ? "inline" : "attachment");
    if (privateMedia?.url) return NextResponse.redirect(privateMedia.url);
    const buf = privateMedia?.localBytes ?? await readFile(path.join(process.cwd(), "public", filePath.replace(/^\//, "")));
    const ext = filePath.split(".").pop()?.toLowerCase() || "mp3";
    const mime = ext === "wav" ? "audio/wav" : ext === "ogg" ? "audio/ogg" : ext === "m4a" ? "audio/mp4" : ext === "flac" ? "audio/flac" : "audio/mpeg";
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${song.slug}.${ext}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (e) {
    console.error("Audio download failed", e);
    return NextResponse.json({ error: "File missing on server" }, { status: 404 });
  }
}