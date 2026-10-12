"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button, Badge, SectionHeading, Card, Input, Textarea } from "@/components/ui";
import { useToast, useCurrency } from "@/components/providers";
import { formatMoney, convertUsd } from "@/lib/currency";
import { timeAgo } from "@/lib/format";

export default function SupportPage() {
  const { push } = useToast();
  const { currency, setCurrency } = useCurrency();
  const [amount, setAmount] = useState(10);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [anon, setAnon] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [wall, setWall] = useState<{ donorName: string; amount: string; currency: string; message?: string | null; createdAt: string }[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch("/api/donations").then((r) => r.json()).then((j) => {
      setWall(j.wall || []);
      setTotal(j.total || 0);
    }).catch(() => {});
  }, []);

  const finalUsd = custom ? parseFloat(custom) || 0 : amount;

  async function donate() {
    if (!finalUsd || finalUsd < 1) return push("Minimum donation is $1", "error");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return push("Enter a valid email for payment", "error");
    setLoading(true);
    try {
      const r = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalUsd, donorName: anon ? "Anonymous" : name || "Anonymous", donorEmail: email, message, isAnonymous: anon, provider: "flutterwave", currency, phone }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      if (!j.checkoutUrl) throw new Error("Flutterwave did not return a checkout link");
      window.location.assign(j.checkoutUrl);
    } catch (e: unknown) {
      push(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-10">
      <SectionHeading kicker="Support my music" title="Fuel the next record" sub={`Raised $${total.toFixed(0)} from fans worldwide. 100% goes to studio, visuals and touring.`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Choose amount (USD base, pay in {currency})</div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[5, 10, 25, 50].map((a) => (
              <button key={a} onClick={() => { setAmount(a); setCustom(""); }} className={`rounded-2xl border p-4 text-center transition ${!custom && amount === a ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-white/10 hover:border-white/25"}`}>
                <div className="font-display text-2xl">${a}</div>
                <div className="text-[11px] text-white/40">{formatMoney(a, currency)}</div>
              </button>
            ))}
          </div>
          <div className="mt-3">
            <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Custom amount in USD (e.g. 15)" type="number" min={1} />
          </div>
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <div><label className="text-xs text-white/50">Your name</label><div className="mt-1"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah K." /></div></div>
            <div><label className="text-xs text-white/50">Email for Flutterwave checkout</label><div className="mt-1"><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" /></div></div>
          </div>
          <div className="mt-3"><label className="text-xs text-white/50">Message (shown on wall)</label><div className="mt-1"><Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Keep making magic! 🔥" /></div></div>
          <label className="mt-3 flex items-center gap-2 text-sm text-white/60 cursor-pointer">
            <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} className="accent-[#D4AF37] h-4 w-4" /> Donate anonymously
          </label>
          <div className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-white/50">Pay securely with Flutterwave</div>
          <div className="mt-3"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="MTN/Airtel number (optional)" /></div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-white/40">Currency:</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded-full border border-white/10 bg-[#161411] px-3 py-1.5 text-xs">
              {["USD", "UGX", "KES", "NGN", "GHS", "ZAR", "GBP", "EUR"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="text-xs text-white/40">= {convertUsd(finalUsd || 0, currency).toLocaleString()} {currency}</span>
          </div>
          <Button onClick={donate} disabled={loading} className="w-full mt-5">
            {loading ? "Processing securely…" : `Donate ${formatMoney(finalUsd || 0, currency)} ♥`}
          </Button>
          <p className="mt-2 text-center text-[11px] text-white/40">🔒 Payment confirmation is verified by the server.</p>
        </Card>

        <div>
          <Card className="bg-gradient-to-b from-[#1d1607] to-[#161411]">
            <div className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Why support?</div>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>🎙️ $25 = 1 hour studio time</li>
              <li>🎬 $50 = music video scene</li>
              <li>🚌 $100 = upcountry show fuel</li>
              <li>💿 $250 = full mix & master</li>
            </ul>
          </Card>
          <div className="mt-4">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 mb-3">Supporters wall ({wall.length})</div>
            <div className="space-y-2 max-h-[520px] overflow-y-auto scrollbar-thin pr-1">
              {wall.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/40">Be the first to support ♥</div>}
              {wall.map((w, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between text-sm"><span className="font-semibold">{w.donorName}</span><span className="text-[#D4AF37] font-bold">{parseFloat(w.amount).toLocaleString()} {w.currency}</span></div>
                  {w.message && <div className="mt-1 text-xs text-white/55">“{w.message}”</div>}
                  <div className="mt-1 text-[10px] text-white/30">{timeAgo(w.createdAt)}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
