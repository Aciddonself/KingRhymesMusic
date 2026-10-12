import { NextResponse } from "next/server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";

// Generates a simple printable press-kit (HTML rendered as PDF by browser print).
export async function GET() {
  let s: Record<string, string> = { artistName: "KING RHYMES", tagline: "Hip-Hop / Dancehall Fusion", bio: "Independent artist from Kampala." };
  try {
    const rows = await db.select().from(siteSettings);
    if (rows[0]) s = rows[0] as unknown as Record<string, string>;
  } catch {}
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${s.artistName} — Press Kit</title>
  <style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:0 24px;color:#111}h1{font-size:48px;margin:0}h2{font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#8a6d1f}p{line-height:1.7}.box{border:1px solid #ddd;border-radius:12px;padding:16px;margin:16px 0}</style></head>
  <body><h2>Press Kit • EPK</h2><h1>${s.artistName}</h1><p><em>${s.tagline || ""}</em></p><p>${(s.bio || "").replace(/</g, "&lt;")}</p>
  <div class="box"><strong>Bookings:</strong> bookings@kingrhymesmusic.com — Kampala, Uganda<br><strong>Music:</strong> Stream previews free, own masters directly on site.<br><strong>Payments:</strong> Flutterwave hosted checkout (methods vary by country).</div>
  <div class="box"><strong>Streaming:</strong> Spotify • Apple Music • YouTube • Audiomack • Boomplay (links on site)</div>
  <p style="color:#666;font-size:12px">Generated ${new Date().toLocaleDateString()} — print to PDF (Ctrl/Cmd+P).</p></body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
