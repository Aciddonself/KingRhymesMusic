import { randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { hashResetToken, rateLimit } from "@/lib/auth";
import { isSmtpConfigured, sendPasswordResetEmail } from "@/lib/email";

const genericMessage = "If an account exists for that email, a reset link will arrive shortly.";

export async function POST(request: Request) {
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`forgot-password:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many reset requests. Try again later." }, { status: 429 });
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!isSmtpConfigured() || !siteUrl || (process.env.NODE_ENV === "production" && !siteUrl.startsWith("https://"))) {
    return NextResponse.json({ error: "Password reset email is not configured on this server." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const email = String(body.email || "").toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (user) {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = hashResetToken(rawToken);
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });

      const resetUrl = new URL("/reset-password", siteUrl);
      resetUrl.searchParams.set("token", rawToken);
      try {
        await sendPasswordResetEmail(email, resetUrl.toString());
      } catch (error) {
        await db.delete(passwordResetTokens).where(and(eq(passwordResetTokens.userId, user.id), eq(passwordResetTokens.tokenHash, tokenHash)));
        console.error("Password reset email delivery failed", error);
      }
    }

    return NextResponse.json({ message: genericMessage });
  } catch (error) {
    console.error("Password reset request failed", error);
    return NextResponse.json({ error: "Unable to process the reset request." }, { status: 500 });
  }
}