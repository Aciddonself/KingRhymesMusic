import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { safeInternalPath } from "@/lib/redirect";

const STATE_COOKIE = "kingrhymes_google_oauth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const nextPath = safeInternalPath(requestUrl.searchParams.get("next"), "/music");
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const loginUrl = new URL("/login", requestUrl);
    loginUrl.searchParams.set("error", "oauth_unavailable");
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    new URL("/api/auth/google/callback", siteUrl).toString()
  );
  const state = randomBytes(32).toString("hex");
  const url = client.generateAuthUrl({
    scope: ["openid", "email", "profile"],
    state,
  });
  const response = NextResponse.redirect(url);
  response.cookies.set(STATE_COOKIE, `${state}:${Buffer.from(nextPath).toString("base64url")}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}