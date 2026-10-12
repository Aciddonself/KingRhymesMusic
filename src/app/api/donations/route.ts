import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { donations } from "@/db/schema";
import { desc } from "drizzle-orm";
import { rateLimit } from "@/lib/auth";
import { convertUsd, CURRENCIES } from "@/lib/currency";
import { createFlutterwaveCheckout } from "@/lib/flutterwave";

export async function GET() {
  try {
    const rows = await db.select().from(donations).orderBy(desc(donations.createdAt));
    const completed = rows.filter((r) => r.status === "completed");
    const wall = completed.filter((r) => !r.isAnonymous).slice(0, 50).map((row) => ({
      donorName: row.donorName,
      amount: row.amount,
      currency: row.currency,
      message: row.message,
      createdAt: row.createdAt,
    }));
    const total = completed.reduce((sum, row) => sum + Number(row.amount) / (CURRENCIES[row.currency]?.rate || 1), 0);
    return NextResponse.json({ wall, total: Number(total.toFixed(2)), count: completed.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anon";
    if (!rateLimit(`donate:${ip}`, 15)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    const { amount, donorName, donorEmail, message, isAnonymous, provider = "flutterwave", currency = "USD", phone } = await req.json();
    const usdAmount = Number(amount);
    if (!Number.isFinite(usdAmount) || usdAmount < 1) return NextResponse.json({ error: "Minimum donation is $1" }, { status: 400 });
    if (usdAmount > 10000) return NextResponse.json({ error: "Maximum donation is $10,000" }, { status: 400 });
    if (provider !== "flutterwave") return NextResponse.json({ error: "Flutterwave is the configured payment provider" }, { status: 400 });
    if (!CURRENCIES[currency]) return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
    if (!donorEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(donorEmail))) return NextResponse.json({ error: "A valid email is required for payment" }, { status: 400 });
    const chargedAmount = convertUsd(usdAmount, currency);
    const providerRef = `kr_donation_${randomUUID()}`;
    const inserted = await db
      .insert(donations)
      .values({
        donorName: String(donorName || "Anonymous").slice(0, 80),
        donorEmail: donorEmail ? String(donorEmail).toLowerCase() : null,
        amount: String(chargedAmount),
        currency,
        provider,
        providerRef,
        message: message ? String(message).slice(0, 500) : null,
        isAnonymous: !!isAnonymous,
        status: "pending",
      })
      .returning();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const redirectUrl = new URL("/checkout/return", siteUrl);
    redirectUrl.searchParams.set("donationId", inserted[0].id);
    const checkoutUrl = await createFlutterwaveCheckout({
      reference: providerRef,
      amount: chargedAmount,
      currency,
      email: String(donorEmail).toLowerCase(),
      phone: phone ? String(phone) : undefined,
      redirectUrl: redirectUrl.toString(),
      description: "Support King Rhymes Music",
    });
    return NextResponse.json({ donationId: inserted[0].id, providerRef, checkoutUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
