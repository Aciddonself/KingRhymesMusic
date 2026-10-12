import jwt from "jsonwebtoken";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-secret-change-me-please-32chars");
if (!JWT_SECRET) throw new Error("JWT_SECRET is required in production");
if (process.env.NODE_ENV === "production" && !process.env.ADMIN_EMAIL) throw new Error("ADMIN_EMAIL is required in production");
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "kingrhmestherapper@gmail.com").toLowerCase();

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  role: string;
};

export async function getSession(): Promise<SessionUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user || error || !user.email) return null;
    const rows = await db.select().from(users).where(eq(users.email, user.email.toLowerCase()));
    if (!rows.length) {
      return await syncSupabaseUser(user);
    }
    const u = rows[0];
    return { id: u.id, email: u.email, displayName: u.displayName, avatarUrl: u.avatarUrl, role: u.role };
  } catch {
    return null;
  }
}

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};

export async function syncSupabaseUser(user: SupabaseUser): Promise<SessionUser | null> {
  if (!user.email) return null;
  const email = user.email.toLowerCase();
  const displayName = String(user.user_metadata?.full_name || user.user_metadata?.name || "Fan").slice(0, 120);
  const avatarUrl = user.user_metadata?.avatar_url ? String(user.user_metadata.avatar_url) : null;
  const provider = String(user.app_metadata?.provider || "email").slice(0, 20);
  const role = email === ADMIN_EMAIL ? "admin" : "fan";
  try {
    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length) {
      const updated = await db
        .update(users)
        .set({ displayName, avatarUrl: avatarUrl ?? undefined, provider, role })
        .where(eq(users.email, email))
        .returning();
      const u = updated[0] ?? existing[0];
      return { id: u.id, email: u.email, displayName: u.displayName, avatarUrl: u.avatarUrl, role: u.role };
    }
    const inserted = await db
      .insert(users)
      .values({ email, displayName, avatarUrl: avatarUrl ?? null, provider, role })
      .returning();
    const u = inserted[0];
    return { id: u.id, email: u.email, displayName: u.displayName, avatarUrl: u.avatarUrl, role: u.role };
  } catch {
    return { id: user.id, email, displayName, avatarUrl, role };
  }
}

export function isAdminEmail(email?: string | null) {
  return !!email && email.toLowerCase() === ADMIN_EMAIL;
}

export function signDownload(payload: { purchaseId?: string; songId: string; email?: string }, expiresIn = "10m") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}
export function verifyDownload(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { purchaseId?: string; songId: string; email?: string };
  } catch {
    return null;
  }
}

const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

const BAD_WORDS = ["fuck", "shit", "bitch", "asshole", "dick", "porn", "xxx", "viagra", "casino", "crypto giveaway"];
export function containsProfanity(text: string) {
  const low = text.toLowerCase();
  return BAD_WORDS.some((w) => low.includes(w));
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
