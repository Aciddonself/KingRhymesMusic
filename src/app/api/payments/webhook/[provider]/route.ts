import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { settleFlutterwaveTransaction } from "@/lib/flutterwave-settlement";

export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (provider !== "flutterwave") return NextResponse.json({ error: "Unknown provider" }, { status: 404 });

  const secretHash = process.env.FLW_SECRET_HASH;
  if (!secretHash) return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  const signature = req.headers.get("verif-hash") || "";
  const expected = Buffer.from(secretHash);
  const received = Buffer.from(signature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const payload = (await req.json()) as {
      event?: string;
      data?: { id?: number | string; tx_ref?: string; status?: string };
    };
    if (payload.event && payload.event !== "charge.completed") return NextResponse.json({ ok: true });
    const data = payload.data;
    if (!data?.id || !data.tx_ref) return NextResponse.json({ error: "Webhook payment details are incomplete" }, { status: 400 });
    if (data.status && data.status.toLowerCase() !== "successful") return NextResponse.json({ ok: true });
    await settleFlutterwaveTransaction(String(data.id), data.tx_ref);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Webhook payment could not be verified" }, { status: 400 });
  }
}
