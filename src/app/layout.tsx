import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { PlayerProvider } from "@/components/player";
import { CurrencyProvider, ToastProvider } from "@/components/providers";
import { Navbar, Footer } from "@/components/chrome";
import { VisitorTracker } from "@/components/visitor-tracker";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { DEFAULT_HERO_IMAGE, DEFAULT_SOCIAL_LINKS, DEFAULT_STREAMING_LINKS } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "King Rhymes Music — Where Rhymes Reign",
  description: "Official website & music store for King Rhymes, independent Ugandan hip-hop / dancehall fusion artist. Stream previews, own the masters, support directly.",
  openGraph: {
    title: "King Rhymes Music — Where Rhymes Reign 👑",
    description: "Hip-hop / dancehall fusion from Kampala to the world. Stream previews, own the masters.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "King Rhymes — Where Rhymes Reign", description: "Stream previews, own the masters, support the King." },
  icons: { icon: "/pics/king-rhymes-logo.webp" },
};

async function getSettings() {
  try {
    const rows = await db.select().from(siteSettings);
    if (rows.length) {
      return {
        ...rows[0],
        heroImageUrl: rows[0].heroImageUrl || DEFAULT_HERO_IMAGE,
        socialLinks: { ...DEFAULT_SOCIAL_LINKS, ...rows[0].socialLinks },
        streamingLinks: { ...DEFAULT_STREAMING_LINKS, ...rows[0].streamingLinks },
      };
    }
  } catch (error) {
    console.error("Failed to load site settings for the layout", error);
  }
  return {
    artistName: "KING RHYMES",
    heroImageUrl: DEFAULT_HERO_IMAGE,
    socialLinks: DEFAULT_SOCIAL_LINKS,
    streamingLinks: DEFAULT_STREAMING_LINKS,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [session, settings] = await Promise.all([
    getSession().catch(() => null),
    getSettings().catch(() => ({
      artistName: "KING RHYMES",
      socialLinks: DEFAULT_SOCIAL_LINKS,
      streamingLinks: DEFAULT_STREAMING_LINKS,
    })),
  ]);
  const user = session ? { email: session.email, role: session.role, displayName: session.displayName } : null;
  return (
    <html lang="en">
      <body className="bg-[#0A0A0A] text-[#F5F1E6] antialiased min-h-screen">
        <ToastProvider>
          <CurrencyProvider>
              <PlayerProvider>
                <Navbar artistName={(settings as { artistName: string }).artistName || "KING RHYMES"} user={user} />
                <main className="pt-16 pb-24 min-h-screen">{children}</main>
                <Footer artistName={(settings as { artistName: string }).artistName || "KING RHYMES"} socials={(settings as { socialLinks: Record<string, string> }).socialLinks || {}} />
                <VisitorTracker />
              </PlayerProvider>
          </CurrencyProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
