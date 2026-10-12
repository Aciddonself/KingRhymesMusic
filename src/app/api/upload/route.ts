import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { storeMedia } from "@/lib/media-storage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const kind = String(form.get("kind") || "audio");
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (kind !== "audio" && kind !== "preview" && kind !== "cover" && kind !== "image" && kind !== "hero") return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    const bytes = await file.arrayBuffer();
    const isAudio = kind === "audio" || kind === "preview";
    const maxBytes = isAudio ? 60 * 1024 * 1024 : 15 * 1024 * 1024;
    if (bytes.byteLength > maxBytes) return NextResponse.json({ error: `File too large (max ${isAudio ? "60MB" : "15MB"})` }, { status: 400 });
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const allowedAudio: Record<string, string[]> = {
      mp3: ["audio/mpeg"], wav: ["audio/wav", "audio/x-wav"], m4a: ["audio/mp4", "audio/x-m4a"],
      ogg: ["audio/ogg", "application/ogg"], flac: ["audio/flac", "audio/x-flac"],
    };
    const allowedImages: Record<string, string[]> = {
      jpg: ["image/jpeg"], jpeg: ["image/jpeg"], png: ["image/png"], webp: ["image/webp"], gif: ["image/gif"],
    };
    const allowedTypes = isAudio ? allowedAudio[extension] : allowedImages[extension];
    if (!allowedTypes || (file.type && !allowedTypes.includes(file.type))) {
      return NextResponse.json({ error: isAudio ? "Audio must be MP3, WAV, M4A, OGG or FLAC" : "Image must be JPG, PNG, WEBP or GIF" }, { status: 400 });
    }

    const url = await storeMedia(kind, file.name, file.type || allowedTypes[0], new Uint8Array(bytes));
    return NextResponse.json({ url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 500 });
  }
}
