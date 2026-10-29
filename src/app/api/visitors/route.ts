import { NextResponse } from "next/server";
import { db } from "@/db";
import { visitors } from "@/db/schema";
import { sql, desc, count } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { path, userAgent, ip } = await req.json();
    await db.insert(visitors).values({
      path: path || "/",
      userAgent: userAgent || null,
      ip: ip || null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const total = await db.select({ count: count() }).from(visitors);
    const recent = await db.select().from(visitors).orderBy(desc(visitors.createdAt)).limit(50);
    const byPath = await db.select({ path: visitors.path, count: count() }).from(visitors).groupBy(visitors.path).orderBy(desc(count()));
    return NextResponse.json({
      total: total[0]?.count || 0,
      recent,
      byPath,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ total: 0, recent: [], byPath: [] });
  }
}