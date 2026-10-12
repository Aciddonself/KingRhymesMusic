import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ADMIN_EMAIL, signSession, SESSION_COOKIE } from "@/lib/auth";
import { safeInternalPath } from "@/lib/redirect";

const STATE_COOKIE = "kingrhymes_google_oauth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state") || "";
  const [expectedState, encodedNextPath] = (request.cookies.get(STATE_COOKIE)?.value || "").split(":");
  const expectedBytes = Buffer.from(expectedState || "");
  const returnedBytes = Buffer.from(returnedState);
  if (!expectedState || expectedBytes.length !== returnedBytes.length || !timingSafeEqual(expectedBytes, returnedBytes)) {
    const response = NextResponse.redirect(new URL("/login?error=oauth_state", request.url));
    response.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  }
  let nextPath = "/music";
  try {
    nextPath = safeInternalPath(Buffer.from(encodedNextPath || "", "base64url").toString(), "/music");
  } catch {
    nextPath = "/music";
  }
  const loginRedirect = (error: string) => {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", error);
    const response = NextResponse.redirect(url);
    response.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  };
  if (searchParams.has("error")) return loginRedirect("oauth_cancelled");
  if (!code) {
    return loginRedirect("no_code");
  }

  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return loginRedirect("oauth_unavailable");
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      new URL("/api/auth/google/callback", siteUrl).toString()
    );
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) return loginRedirect("no_id_token");
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.email || payload.email_verified !== true) {
      return loginRedirect("unverified_email");
    }

    const email = payload.email.toLowerCase();
    const displayName = payload.name || "Fan";
    const avatarUrl = payload.picture || null;

    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    let sessionUser: typeof users.$inferSelect;
    if (existingUser) {
      const role = email === ADMIN_EMAIL ? "admin" : existingUser.role;
      await db.update(users).set({ provider: "google", avatarUrl, role }).where(eq(users.id, existingUser.id));
      sessionUser = { ...existingUser, avatarUrl, role };
    } else {
      const [insertedUser] = await db
        .insert(users)
        .values({
          email,
          displayName: displayName.slice(0, 120),
          avatarUrl,
          role: email === ADMIN_EMAIL ? "admin" : "fan",
          provider: "google",
        })
        .returning();
      sessionUser = insertedUser;
    }

    const token = signSession({
      id: sessionUser.id,
      email: sessionUser.email,
      displayName: sessionUser.displayName,
      avatarUrl: sessionUser.avatarUrl,
      role: sessionUser.role,
    });

    const res = NextResponse.redirect(new URL(nextPath, request.url));
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    res.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    console.error("Google OAuth error:", e);
    return loginRedirect("oauth_failed");
  }
}