"use client";
import { useState } from "react";
import { SectionHeading, Card, Input, Textarea, Button } from "@/components/ui";
import { useToast } from "@/components/providers";

export default function ContactPage() {
  const { push } = useToast();
  const [form, setForm] = useState({ name: "", email: "", type: "Booking", message: "", eventDate: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!form.name || !form.email.includes("@") || !form.message) return push("Fill name, valid email and message", "error");
    setLoading(true);
    try {
      const r = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      setSent(true);
      push("Message sent! Expect a reply within 48h.", "success");
    } catch (e: unknown) {
      push(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-10">
      <SectionHeading kicker="Bookings & collabs" title="Let's work" sub="Shows, features, sync, press and collaborations. Replies within 48 hours." />
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <Card>
          {sent ? (
            <div className="py-10 text-center">
              <div className="text-5xl">✉️</div>
              <div className="font-display text-2xl mt-3">Received!</div>
              <p className="text-sm text-white/55 mt-2">Thanks {form.name.split(" ")[0]} — I&apos;ll get back to you shortly.</p>
              <div className="mt-5"><Button variant="ghost" onClick={() => { setSent(false); setForm({ name: "", email: "", type: "Booking", message: "", eventDate: "" }); }}>Send another</Button></div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className="text-xs text-white/50">Name</label><div className="mt-1"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" /></div></div>
                <div><label className="text-xs text-white/50">Email</label><div className="mt-1"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" type="email" /></div></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className="text-xs text-white/50">Enquiry type</label><div className="mt-1"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#161411] px-4 py-3 text-sm"><option>Booking</option><option>Feature</option><option>Collaboration</option><option>Press / Interview</option><option>Sync / Licensing</option><option>Other</option></select></div></div>
                <div><label className="text-xs text-white/50">Event date (optional)</label><div className="mt-1"><Input value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} placeholder="e.g. Dec 20, 2026 — Kampala" /></div></div>
              </div>
              <div><label className="text-xs text-white/50">Message</label><div className="mt-1"><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell me about your show, song idea or project — budget, venue, dates…" /></div></div>
              <Button onClick={submit} disabled={loading} className="w-full">{loading ? "Sending…" : "Send message →"}</Button>
            </div>
          )}
        </Card>
        <div className="space-y-3">
          <Card><div className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Direct</div><div className="mt-2 text-sm text-white/70">bookings@kingrhymesmusic.com<br />Kampala, Uganda</div><a href="https://wa.me/256751649142" target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-full border border-emerald-400/25 px-4 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/10">+256 751 649 142 · WhatsApp ↗</a></Card>
          <Card><div className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Press kit</div><p className="mt-2 text-sm text-white/60">Bio, hi-res photos, logos & stage plot.</p><a href="/api/presskit" target="_blank" className="mt-3 inline-flex rounded-full border border-white/15 px-4 py-2 text-xs hover:border-[#D4AF37]/60 hover:text-[#D4AF37]">⬇ Download PDF</a></Card>
          <Card><div className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Response time</div><div className="mt-2 font-display text-3xl">48h</div><div className="text-xs text-white/50">Usually much faster</div></Card>
        </div>
      </div>
    </div>
  );
}
