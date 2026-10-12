"use client";
import { useState } from "react";
import Link from "next/link";
import { Button, Badge, Stars } from "@/components/ui";
import { SongCard, SongCardData } from "@/components/song-card";
import { RatingWidget, CommentsSection } from "@/components/engagement";
import { CheckoutModal } from "@/components/checkout";
import { usePlayer } from "@/components/player";
import { useCurrency } from "@/components/providers";
import { formatMoney } from "@/lib/currency";
import { formatDuration } from "@/lib/format";

type Song = {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string | null;
  audioPreviewPath?: string | null;
  fullAudioUrl?: string | null;
  description?: string | null;
  lyrics?: string | null;
  genre: string;
  priceUsd: number;
  isFree: boolean;
  playCount: number;
  avgRating: number;
  ratingCount: number;
};

export default function SongView({
  song,
  user,
  isAdmin,
  owned,
  related,
}: {
  song: Song;
  user: { id: string; email: string; displayName: string } | null;
  isAdmin: boolean;
  owned: boolean;
  related: SongCardData[];
}) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const { playTrack, current, isPlaying, toggle } = usePlayer();
  const { currency } = useCurrency();

  const previewUrl = song.audioPreviewPath;
  const fullUrl = song.fullAudioUrl;
  const isCurrentPreview = current?.id === song.id;

  function playPreview() {
    if (!previewUrl) return;
    if (isCurrentPreview) toggle();
    else
      playTrack({
        id: song.id,
        title: song.title,
        slug: song.slug,
        coverUrl: song.coverUrl,
        audioUrl: previewUrl,
        isPreview: true,
      });
  }

  function playFull() {
    if (!fullUrl) return;
    playTrack({
      id: song.id,
      title: song.title,
      slug: song.slug,
      coverUrl: song.coverUrl,
      audioUrl: fullUrl,
      isPreview: false,
    });
  }

  async function share(kind: string) {
    const url = window.location.href;
    if (kind === "copy") {
      await navigator.clipboard.writeText(url).catch(() => {});
      alert("Link copied!");
    } else if (kind === "x") window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(song.title + " — KING RHYMES")}&url=${encodeURIComponent(url)}`, "_blank");
    else if (kind === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(song.title + " " + url)}`, "_blank");
    else if (kind === "facebook") window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-10">
      <Link href="/music" className="text-xs text-white/50 hover:text-[#D4AF37]">← Back to music</Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* cover */}
        <div>
          <div className="overflow-hidden rounded-[1.8rem] border border-white/10 aspect-square bg-white/5 shadow-2xl">
            {song.coverUrl ? <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center font-display text-8xl text-[#D4AF37]/30">♪</div>}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button onClick={playPreview} variant="ghost" disabled={!previewUrl}>
              {isCurrentPreview && isPlaying ? "❚❚ Pause" : "▶ Preview"}
            </Button>
            {owned ? (
              <Button onClick={playFull} disabled={!fullUrl}>▶ Play full</Button>
            ) : (
              <Button onClick={() => setCheckoutOpen(true)}>{song.isFree ? "Get free" : `Buy • ${formatMoney(song.priceUsd, currency)}`}</Button>
            )}
          </div>
          {!owned && !song.isFree && <p className="mt-2 text-center text-[11px] text-white/40">Preview is 30s • Full track after purchase</p>}
          {owned && <p className="mt-2 text-center text-[11px] text-emerald-300">✓ You own this track — full audio unlocked</p>}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs">
            <span className="text-white/40 mr-1">Share:</span>
            {["copy", "x", "whatsapp", "facebook"].map((k) => (
              <button key={k} onClick={() => share(k)} className="rounded-full border border-white/10 px-3 py-1.5 text-white/60 hover:border-[#D4AF37]/50 hover:text-[#D4AF37] capitalize">{k === "copy" ? "⧉ Link" : k}</button>
            ))}
          </div>
        </div>

        {/* info */}
        <div>
          <Badge>{song.genre}</Badge>
          <h1 className="font-display text-4xl sm:text-6xl mt-3 leading-[1.02]">{song.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/50">
            <Stars value={song.avgRating} />
            <span>{song.playCount.toLocaleString()} plays</span>
            <span>{song.isFree ? "Free download" : formatMoney(song.priceUsd, currency)}</span>
          </div>
          <div className="mt-4">
            <RatingWidget songId={song.id} initialAvg={song.avgRating} initialCount={song.ratingCount} userId={user?.id} />
          </div>
          {song.description && <p className="mt-5 leading-relaxed text-white/75 whitespace-pre-wrap">{song.description}</p>}

          <div className="mt-6 flex flex-wrap gap-2">
            {owned ? (
              <Button onClick={playFull}>▶ Play full track</Button>
            ) : (
              <Button onClick={() => setCheckoutOpen(true)}>{song.isFree ? "⬇ Get free download" : `Buy now — ${formatMoney(song.priceUsd, currency)}`}</Button>
            )}
            <Button variant="ghost" onClick={() => setShowLyrics(!showLyrics)}>{showLyrics ? "Hide lyrics" : "View lyrics"}</Button>
          </div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-[11px] text-white/45">🔒 Full audio served via expiring signed URLs only after verified payment. Previews are public 30s clips.</div>

          {showLyrics && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4AF37] mb-3">Lyrics</div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">{song.lyrics || "Lyrics coming soon."}</p>
            </div>
          )}

          <div className="mt-10">
            <CommentsSection songId={song.id} user={user} isAdmin={isAdmin} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-3xl mb-5">You may also like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((r) => <SongCard key={r.id} song={r} />)}
          </div>
        </div>
      )}

      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} song={{ id: song.id, title: song.title, slug: song.slug, priceUsd: song.priceUsd, isFree: song.isFree, coverUrl: song.coverUrl }} userEmail={user?.email} />
    </div>
  );
}
