"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button, Badge, SectionHeading, Skeleton } from "@/components/ui";
import { SongCard, SongCardData } from "@/components/song-card";
import { usePlayer } from "@/components/player";
import { useToast, useCurrency } from "@/components/providers";
import { formatMoney } from "@/lib/currency";
import { DEFAULT_GALLERY_PHOTOS, DEFAULT_HERO_IMAGE } from "@/lib/site-content";

type Settings = {
  artistName: string;
  tagline: string;
  heroText: string;
  bio: string;
  heroImageUrl?: string;
  featuredSongId?: string | null;
  streamingLinks?: Record<string, string>;
};

export default function HomePage() {
  const [songs, setSongs] = useState<SongCardData[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [donors, setDonors] = useState<{ donorName: string; amount: string; message?: string | null }[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const { playTrack } = usePlayer();
  const { push } = useToast();
  const { currency } = useCurrency();
  const heroSlides = useMemo(() => {
    const slides = [
      ...(settings?.heroImageUrl ? [{ imageUrl: settings.heroImageUrl, caption: "Artist-selected portrait" }] : []),
      ...DEFAULT_GALLERY_PHOTOS,
    ];
    return slides.filter((slide, index) => slides.findIndex((item) => item.imageUrl === slide.imageUrl) === index);
  }, [settings]);
  const activeHeroSlide = heroSlides[heroSlideIndex % heroSlides.length] || {
    imageUrl: DEFAULT_HERO_IMAGE,
    caption: "King Rhymes",
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/songs").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/donations").then((r) => r.json()),
    ])
      .then(([s, st, d]) => {
        setSongs(s.songs || []);
        setSettings(st.settings);
        setDonors((d.wall || []).slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => {
      setHeroSlideIndex((index) => (index + 1) % heroSlides.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [heroSlides.length]);

  const featured = songs.find((s) => s.id === settings?.featuredSongId) || songs[0];
  const featuredPreviewUrl = featured?.audioPreviewPath;
  const latest = [...songs].slice(0, 4);
  const topRated = [...songs].sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0)).slice(0, 4);

  async function subscribe() {
    if (!email.includes("@")) return push("Enter a valid email", "error");
    const r = await fetch("/api/subscribers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    if (r.ok) {
      push("You're on the list! Watch your inbox.", "success");
      setEmail("");
    } else push("Could not subscribe", "error");
  }

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.14),transparent_60%)]" />
        <div className="absolute inset-0 grain" />
        <div className="relative mx-auto max-w-7xl min-w-0 px-4 sm:px-6 pt-14 pb-16 grid gap-10 lg:grid-cols-2 items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="min-w-0">
            <div className="max-w-full overflow-hidden rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 py-1 text-[#D4AF37]" role="img" aria-label="Phone symbol: Holla If You Hear Me">
              <div className="flex w-max animate-marquee motion-reduce:animate-none" aria-hidden="true">
                {[0, 1].map((copy) => (
                  <span key={copy} className="flex shrink-0 items-center gap-8 pr-8 text-[11px] font-semibold uppercase tracking-[0.14em]">
                    <span>☎ Holla If You Hear Me</span>
                    <span>☎ Holla If You Hear Me</span>
                  </span>
                ))}
              </div>
            </div>
            <h1 className="font-display text-5xl sm:text-7xl leading-[0.95] tracking-tight mt-5 uppercase">
              {settings?.artistName || "KING RHYMES"}
              <span className="block text-gold-gradient text-4xl sm:text-6xl mt-2">{settings?.tagline || "Where Rhymes Reign"}</span>
            </h1>
            <p className="mt-5 max-w-lg text-[#A8A29A] leading-relaxed">{settings?.heroText}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {featured && featuredPreviewUrl && (
                <Button
                  onClick={() =>
                    playTrack({
                      id: featured.id,
                      title: featured.title,
                      slug: featured.slug,
                      coverUrl: featured.coverUrl,
                      audioUrl: featuredPreviewUrl,
                      isPreview: true,
                    })
                  }
                >
                  ▶ Play Featured Song
                </Button>
              )}
              <Link href="/music">
                <Button variant="ghost">Browse music →</Button>
              </Link>
              <Link href="/support">
                <Button variant="dark">👑 Support the King</Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-white/50">
              <span><strong className="text-white text-base">{songs.length}</strong> tracks</span>
              <span><strong className="text-white text-base">{songs.reduce((a, s) => a + (s.playCount || 0), 0).toLocaleString()}</strong> plays</span>
              <span><strong className="text-[#D4AF37] text-base">{donors.length}</strong> supporters</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative order-first flex w-full min-w-0 justify-center lg:order-last">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-xs sm:max-w-sm md:max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#0A0A0A] shadow-2xl animate-floaty">
              <motion.img
                key={activeHeroSlide.imageUrl}
                src={activeHeroSlide.imageUrl}
                alt={activeHeroSlide.caption}
                className="h-full w-full object-contain"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7 }}
                loading="eager"
                decoding="async"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
              {heroSlides.length > 1 && (
                <div className="absolute right-4 top-4 flex gap-1.5" aria-label={`Photo ${heroSlideIndex + 1} of ${heroSlides.length}`}>
                  {heroSlides.map((slide, index) => (
                    <span
                      key={slide.imageUrl}
                      className={`h-1.5 rounded-full transition-all ${index === heroSlideIndex ? "w-5 bg-[#F1D97A]" : "w-1.5 bg-white/50"}`}
                    />
                  ))}
                </div>
              )}
              {featured && (
                <div className="absolute bottom-0 inset-x-0 p-5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4AF37]">Featured single</div>
                    <div className="font-display text-2xl truncate">{featured.title}</div>
                    <div className="text-xs text-white/60">{featured.isFree ? "Free" : formatMoney(parseFloat(String(featured.priceUsd)), currency)} • {featured.genre}</div>
                  </div>
                  <Link href={`/music/${featured.slug}`} className="shrink-0 rounded-full bg-[#D4AF37] px-5 py-2.5 text-xs font-bold text-black hover:bg-[#F1D97A]">
                    Open →
                  </Link>
                </div>
              )}
            </div>
            <div className="absolute -z-10 inset-0 blur-3xl opacity-30 bg-[#D4AF37]/20 rounded-full scale-90" />
          </motion.div>
        </div>
        {/* supporters ticker */}
        {donors.length > 0 && (
          <div className="relative border-y border-white/[0.07] bg-white/[0.02] py-3 overflow-hidden">
            <div className="flex whitespace-nowrap animate-marquee gap-8 w-max">
              {[...donors, ...donors].map((d, i) => (
                <span key={i} className="text-xs text-white/60">
                  ♥ <strong className="text-[#D4AF37]">{d.donorName}</strong> donated ${parseFloat(d.amount).toFixed(0)}{d.message ? ` — “${d.message.slice(0, 60)}”` : ""}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-10">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">Listen everywhere</div>
              <h2 className="mt-1 font-display text-xl">Stream The Prodigal Son</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(settings?.streamingLinks || {}).filter(([, url]) => !!url).map(([platform, url]) => (
                <a key={platform} href={url} target="_blank" rel="noreferrer" className="rounded-full border border-[#D4AF37]/30 px-3 py-2 text-xs font-semibold capitalize text-[#F1D97A] hover:bg-[#D4AF37]/10">{platform === "apple" ? "Apple Music" : platform === "itunes" ? "iTunes" : platform === "spotifyApp" ? "Spotify app" : platform} ↗</a>
              ))}
            </div>
          </div>
          <iframe
            src="https://open.spotify.com/embed/album/0hdZkHH4UXTqR4haSm0mEn?theme=0"
            title="Listen to The Prodigal Son by King Rhymes on Spotify"
            className="h-[152px] w-full rounded-xl border-0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      </section>

      {/* LATEST */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
        <div className="flex items-end justify-between mb-8">
          <SectionHeading kicker="Fresh off the console" title="Latest releases" sub="Own the masters directly. Previews are free, full tracks are high quality." />
          <Link href="/music" className="hidden sm:inline-flex text-sm text-[#D4AF37] hover:underline shrink-0">View all →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="aspect-[3/4]" />)}</div>
        ) : latest.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/50">Music dropping soon. Join the mailing list below.</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {latest.map((s) => <SongCard key={s.id} song={s} />)}
          </div>
        )}
      </section>

      {/* TOP RATED */}
      {topRated.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
          <SectionHeading kicker="Fan favourites" title="Top rated" sub="Rated by real listeners. Log in to add your stars." />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {topRated.map((s) => <SongCard key={s.id} song={s} />)}
          </div>
        </section>
      )}

      {/* SUPPORT CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-16">
        <div className="relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/20 bg-gradient-to-br from-[#1d1607] via-[#12121a] to-black p-8 sm:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(212,175,55,0.18),transparent_55%)]" />
          <div className="relative grid gap-8 lg:grid-cols-2 items-center">
            <div>
              <Badge>♥ 100% independent</Badge>
              <h2 className="font-display text-3xl sm:text-5xl mt-4 leading-tight">Every shilling goes straight into the next record.</h2>
              <p className="mt-4 text-[#A8A29A] leading-relaxed">No label. No middlemen. Your purchase or donation pays for studio time, visuals and the next tour. MTN & Airtel Mobile Money accepted.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/support"><Button>Donate now ♥</Button></Link>
                <Link href="/music"><Button variant="ghost">Buy a track</Button></Link>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[{ v: "UGX", l: "Mobile Money" }, { v: "Cards", l: "Debit and credit" }, { v: "Hosted", l: "Flutterwave checkout" }].map((x) => (
                <div key={x.v} className="rounded-2xl border border-white/10 bg-black/40 p-5">
                  <div className="font-display text-xl text-[#D4AF37]">{x.v}</div>
                  <div className="mt-1 text-[11px] text-white/50">{x.l}</div>
                </div>
              ))}
              <div className="col-span-3 rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/50">🔒 Flutterwave checkout • Server-verified payment • Instant delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* MAILING LIST */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 mt-16 text-center">
        <SectionHeading kicker="Mailing list" title="First to hear, first to own" sub="New singles, secret acoustic versions and Kampala show dates. No spam, ever." />
        <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto -mt-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm outline-none focus:border-[#D4AF37]/60" />
          <Button onClick={subscribe}>Subscribe</Button>
        </div>
      </section>
    </div>
  );
}
