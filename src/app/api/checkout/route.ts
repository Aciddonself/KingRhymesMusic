import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { songs, purchases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit } from "@/lib/auth";
import { convertUsd, CURRENCIES } from "@/lib/currency";
import { createFlutterwaveCheckout } from "@/lib/flutterwave";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anon";
    if (!rateLimit(`checkout:${ip}`, 20)) return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
    const { songId, email, provider = "flutterwave", currency = "USD", phone } = await req.json();
    if (!songId || !email) return NextResponse.json({ error: "Song and email required" }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    if (provider !== "flutterwave") return NextResponse.json({ error: "Flutterwave is the configured payment provider" }, { status: 400 });
    if (!CURRENCIES[currency]) return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });

    const rows = await db.select().from(songs).where(eq(songs.id, songId));
    if (!rows.length) return NextResponse.json({ error: "Song not found" }, { status: 404 });
    const song = rows[0];
    if (!song.isPublished) return NextResponse.json({ error: "Song not available" }, { status: 400 });
    if (song.isFree) return NextResponse.json({ error: "This song is free" }, { status: 400 });

    const amount = convertUsd(Number(song.priceUsd), currency);
    const providerRef = `kr_purchase_${randomUUID()}`;

    const inserted = await db
      .insert(purchases)
      .values({
        songId,
        buyerEmail: String(email).toLowerCase(),
        amount: String(amount),
        currency,
        provider,
        providerRef,
        status: "pending",
      })
      .returning();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const redirectUrl = new URL("/checkout/return", siteUrl);
    redirectUrl.searchParams.set("purchaseId", inserted[0].id);
    const checkoutUrl = await createFlutterwaveCheckout({
      reference: providerRef,
      amount,
      currency,
      email: String(email).toLowerCase(),
      phone: phone ? String(phone) : undefined,
      redirectUrl: redirectUrl.toString(),
      description: `Purchase: ${song.title}`,
    });

    return NextResponse.json({ purchaseId: inserted[0].id, providerRef, checkoutUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
