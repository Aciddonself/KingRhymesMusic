import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { hashPassword, hashResetToken, rateLimit } from "@/lib/auth";

export async function POST(request: Request) {
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`reset-password:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const token = String(body.token || "");
    const password = String(body.password || "");
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
    }
    if (password.length < 12 || password.length > 128) {
      return NextResponse.json({ error: "Use a password between 12 and 128 characters." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const tokenHash = hashResetToken(token);
    const changed = await db.transaction(async (transaction) => {
      const [reset] = await transaction
        .delete(passwordResetTokens)
        .where(and(eq(passwordResetTokens.tokenHash, tokenHash), gt(passwordResetTokens.expiresAt, new Date())))
        .returning({ userId: passwordResetTokens.userId });
      if (!reset) return false;
      await transaction.update(users).set({ passwordHash }).where(eq(users.id, reset.userId));
      return true;
    });

    if (!changed) return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
    return NextResponse.json({ message: "Your password has been updated. Sign in with your new password." });
  } catch (error) {
    console.error("Password reset failed", error);
    return NextResponse.json({ error: "Unable to reset your password." }, { status: 500 });
  }
}