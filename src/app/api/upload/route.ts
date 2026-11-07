import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { storeMedia } from "@/lib/media-storage";

export const runtime = "nodejs";

function hasValidFileSignature(kind: string, bytes: Uint8Array) {
  const ascii = (start: number, value: string) =>
    value.split("").every((character, index) => bytes[start + index] === character.charCodeAt(0));

  if (kind === "audio" || kind === "preview") {
    return (
      ascii(0, "ID3") || // MP3 metadata header
      (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) || // MP3 frame sync
      (ascii(0, "RIFF") && ascii(8, "WAVE")) || // WAV
      ascii(0, "OggS") || // OGG
      ascii(0, "fLaC") || // FLAC
      (bytes.length >= 8 && ascii(4, "ftyp")) // M4A/MP4 audio
    );
  }

  return (
    (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) || // JPEG
    ascii(0, "\x89PNG\r\n\x1a\n") ||
    ascii(0, "GIF87a") ||
    ascii(0, "GIF89a") ||
    (ascii(0, "RIFF") && ascii(8, "WEBP"))
  );
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  try {
    const contentLength = Number(req.headers.get("content-length"));
    // Include form-data framing in the ceiling; per-file checks below give the exact UX limit.
    if (Number.isFinite(contentLength) && contentLength > 62 * 1024 * 1024) {
      return NextResponse.json({ error: "Upload request is too large" }, { status: 413 });
    }
    const form = await req.formData();
    const fileEntry = form.get("file");
    const kind = String(form.get("kind") || "audio");
    if (!(fileEntry instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
    const file = fileEntry;
    if (kind !== "audio" && kind !== "preview" && kind !== "cover" && kind !== "image" && kind !== "hero") return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    const isAudio = kind === "audio" || kind === "preview";
    const maxBytes = isAudio ? 60 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxBytes) return NextResponse.json({ error: `File too large (max ${isAudio ? "60MB" : "15MB"})` }, { status: 413 });
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

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasValidFileSignature(kind, bytes)) {
      return NextResponse.json({ error: "File contents do not match a supported audio or image format" }, { status: 400 });
    }

    const url = await storeMedia(kind, file.name, file.type || allowedTypes[0], bytes);
    return NextResponse.json({ url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 500 });
  }
}
