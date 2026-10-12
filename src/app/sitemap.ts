import type { MetadataRoute } from "next";
import { db } from "@/db";
import { songs } from "@/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://kingrhymesmusic.com";
  const staticPages = ["", "/music", "/about", "/portfolio", "/support", "/contact", "/terms", "/privacy", "/refunds"].map((p) => ({
    url: `${base}${p || "/"}`,
    lastModified: new Date(),
  }));
  try {
    const all = await db.select().from(songs);
    const songPages = all.filter((s) => s.isPublished).map((s) => ({
      url: `${base}/music/${s.slug}`,
      lastModified: s.createdAt || new Date(),
    }));
    return [...staticPages, ...songPages];
  } catch {
    return staticPages;
  }
}
