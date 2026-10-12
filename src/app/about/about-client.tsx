"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Badge, SectionHeading } from "@/components/ui";
import { Button } from "@/components/ui";

export default function AboutClient({ settings, milestones }: { settings: Record<string, unknown>; milestones: { year: string; title: string; description?: string | null }[] }) {
  const artist = (settings.artistName as string) || "KING RHYMES";
  const bio = (settings.bio as string) || "";
  const heroImg = settings.heroImageUrl as string | undefined;
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.12),transparent_65%)]" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-14 pb-10 text-center">
          <Badge>✦ The story</Badge>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-5xl sm:text-7xl mt-4">
            {artist}
          </motion.h1>
          <p className="mt-3 text-[#D4AF37] tracking-[0.2em] text-xs uppercase">{(settings.tagline as string) || ""}</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 sm:px-6 grid gap-10 lg:grid-cols-2 items-start">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 aspect-[3/4] bg-white/5">
          <img src={heroImg || "/pics/king-rhymes-blue-portrait.webp"} alt={artist} className="h-full w-full object-cover" />
        </div>
        <div>
          <SectionHeading kicker="Bio" title="My story" />
          <p className="whitespace-pre-wrap leading-relaxed text-white/75 -mt-4">{bio}</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="font-display text-3xl text-[#D4AF37]">100%</div><div className="text-xs text-white/50 mt-1">Independent — no label</div></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="font-display text-3xl text-[#D4AF37]">UG → 🌍</div><div className="text-xs text-white/50 mt-1">Kampala to the world</div></div>
          </div>
          <div className="mt-6 flex gap-3">
            <Link href="/music"><Button>Listen →</Button></Link>
            <Link href="/contact"><Button variant="ghost">Book me</Button></Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 sm:px-6 mt-16">
        <SectionHeading kicker="Journey" title="Milestones" />
        {milestones.length ? (
          <div className="relative border-l border-[#D4AF37]/30 ml-2 space-y-6">
            {milestones.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="pl-6 relative">
                <span className="absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full bg-[#D4AF37]" />
                <div className="text-xs font-bold text-[#D4AF37] tracking-[0.2em]">{m.year}</div>
                <div className="font-display text-xl mt-1">{m.title}</div>
                {m.description && <p className="text-sm text-white/55 mt-1 leading-relaxed">{m.description}</p>}
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-white/40">Artist milestones will appear here.</p>
        )}
      </section>
    </div>
  );
}
