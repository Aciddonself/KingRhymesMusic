"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge, SectionHeading, Modal, Button } from "@/components/ui";

export default function PortfolioClient({
  settings,
  discography,
  gallery,
  videos,
  press,
}: {
  settings: Record<string, unknown>;
  discography: Record<string, unknown>[];
  gallery: { imageUrl: string; caption?: string | null }[];
  videos: { youtubeId: string; title: string }[];
  press: { outlet: string; quote: string; author?: string | null }[];
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const artist = (settings.artistName as string) || "KING RHYMES";
  const streaming = (settings.streamingLinks as Record<string, string>) || {};
  const streams = Object.entries(streaming).filter(([, v]) => !!v);

  return (
    <div>
      {/* cinematic hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1c1408] via-[#0a0a10] to-[#0A0A0A]" />
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "repeating-linear-gradient(115deg, transparent 0 22px, rgba(212,175,55,0.05) 22px 23px)" }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-12 text-center">
          <Badge>✦ EPK • Portfolio</Badge>
          <h1 className="font-display text-5xl sm:text-7xl mt-4">{artist}</h1>
          <p className="mt-3 text-white/60 max-w-2xl mx-auto">{(settings.tagline as string) || ""} — available for shows, features & collaborations.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {streams.length === 0 ? (
              ["Spotify", "Apple Music", "YouTube", "Audiomack", "Boomplay"].map((s) => (
                <span key={s} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/50">{s} ↗</span>
              ))
            ) : (
              streams.map(([k, v]) => (
              <a key={k} href={v} target="_blank" rel="noreferrer" className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/20 capitalize">{k === "spotifyApp" ? "Spotify app" : k === "apple" ? "Apple Music" : k} ↗</a>
              ))
            )}
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/contact"><Button>Book {artist} →</Button></Link>
            <a href="/api/presskit" target="_blank"><Button variant="ghost">⬇ Press kit (PDF)</Button></a>
          </div>
        </div>
      </section>

      {/* discography */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 mt-10">
        <SectionHeading kicker="Discography" title="Selected works" sub="Cover art, singles and albums. Full catalogue in Music." />
        {discography.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/40">Releases appear here automatically once published in the admin.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {discography.map((d, i) => (
              <motion.a key={i} href={`/music/${d.slug as string}`} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-surface group overflow-hidden rounded-2xl transition hover:border-[#D4AF37]/40">
                <div className="aspect-square overflow-hidden bg-white/5">
                  {(d.coverUrl as string) ? <img src={d.coverUrl as string} alt={d.title as string} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition duration-700" /> : <div className="h-full w-full grid place-items-center text-5xl text-[#D4AF37]/30">♪</div>}
                </div>
                <div className="p-3"><div className="font-display truncate">{d.title as string}</div><div className="text-[11px] text-white/40">{d.genre as string}</div></div>
              </motion.a>
            ))}
          </div>
        )}
      </section>

      {/* videos */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 mt-14">
        <SectionHeading kicker="Video" title="Watch" />
        <div className="grid gap-4 md:grid-cols-2">
          {videos.length ? videos.map((v, i) => (
            <div key={i} className="glass-surface overflow-hidden rounded-2xl">
              <div className="aspect-video"><iframe src={`https://www.youtube.com/embed/${v.youtubeId}`} title={v.title} className="h-full w-full" allowFullScreen loading="lazy" /></div>
              <div className="p-3 text-sm font-semibold">{v.title}</div>
            </div>
          )) : <p className="text-sm text-white/45">Music videos added in Admin → Portfolio will appear here.</p>}
        </div>
      </section>

      {/* gallery */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 mt-14">
        <SectionHeading kicker="Photos" title="Gallery" sub="Tap any photo to view." />
        {gallery.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/40">Photos added in Admin → Portfolio will appear here.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {gallery.map((g, i) => (
              <button key={i} onClick={() => setLightbox(g.imageUrl)} className="overflow-hidden rounded-2xl border border-white/10 aspect-[4/3] bg-white/5 hover:border-[#D4AF37]/40 transition">
                <img src={g.imageUrl} alt={g.caption || ""} loading="lazy" className="h-full w-full object-cover hover:scale-105 transition duration-700" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* press */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 mt-14">
        <SectionHeading kicker="Press" title="What they say" />
        <div className="grid gap-4 md:grid-cols-2">
          {press.length ? press.map((p, i) => (
            <figure key={i} className="glass-surface rounded-2xl p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">{p.outlet}</div>
              <blockquote className="mt-2 font-display text-xl leading-snug">“{p.quote}”</blockquote>
              {p.author && <figcaption className="mt-3 text-xs text-white/40">— {p.author}</figcaption>}
            </figure>
          )) : <p className="text-sm text-white/45">Press features added in Admin → Portfolio will appear here.</p>}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] text-white/35">
          <span className="mr-2 uppercase tracking-[0.2em]">As seen on:</span>
          {streams.map(([l]) => (
            <span key={l} className="rounded-full border border-white/10 px-3 py-1.5">{l === "apple" ? "Apple Music" : l === "spotifyApp" ? "Spotify" : l}</span>
          ))}
        </div>
      </section>

      <Modal open={!!lightbox} onClose={() => setLightbox(null)} wide>
        {lightbox && <img src={lightbox} alt="" className="w-full rounded-2xl object-contain max-h-[75vh]" />}
      </Modal>
    </div>
  );
}
