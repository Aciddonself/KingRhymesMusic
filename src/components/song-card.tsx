"use client";
import Link from "next/link";
import { Stars } from "./ui";
import { usePlayer } from "./player";
import { useCurrency } from "./providers";
import { formatMoney } from "@/lib/currency";

export type SongCardData = {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string | null;
  audioPreviewPath?: string | null;
  audioFullPath?: string | null;
  genre: string;
  priceUsd: string | number;
  isFree: boolean;
  playCount: number;
  avgRating?: number;
  ratingCount?: number;
};

export function SongCard({ song }: { song: SongCardData }) {
  const { playTrack } = usePlayer();
  const { currency } = useCurrency();
  const price = typeof song.priceUsd === "string" ? parseFloat(song.priceUsd) : song.priceUsd;
  const previewUrl = song.audioPreviewPath;
  return (
    <div className="glass-surface group overflow-hidden rounded-2xl transition-all hover:-translate-y-1 hover:border-[#D4AF37]/40 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
      <Link href={`/music/${song.slug}`} className="block relative aspect-square overflow-hidden bg-white/5">
        {song.coverUrl ? (
          <img src={song.coverUrl} alt={song.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full grid place-items-center bg-gradient-to-br from-[#1c1c28] to-[#0c0c12]">
            <span className="font-display text-6xl text-[#D4AF37]/40">♪</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
        {previewUrl && (
          <button
            onClick={(e) => {
              e.preventDefault();
              playTrack({
                id: song.id,
                title: song.title,
                slug: song.slug,
                coverUrl: song.coverUrl,
                audioUrl: previewUrl,
                isPreview: true,
              });
            }}
            className="absolute bottom-3 right-3 grid h-12 w-12 place-items-center rounded-full bg-[#D4AF37] text-black text-lg opacity-0 group-hover:opacity-100 transition hover:bg-[#F1D97A]"
            aria-label={`Play preview of ${song.title}`}
          >
            ▶
          </button>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="rounded-full bg-black/70 backdrop-blur px-3 py-1 text-[11px] font-semibold text-white/90">{song.genre}</span>
          {song.isFree && <span className="rounded-full bg-emerald-500/90 px-3 py-1 text-[11px] font-bold text-white">FREE</span>}
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/music/${song.slug}`} className="font-display text-lg leading-tight hover:text-[#D4AF37] transition line-clamp-1">
          {song.title}
        </Link>
        <div className="mt-1.5 flex items-center justify-between">
          <Stars value={song.avgRating || 0} />
          <span className="text-[11px] text-white/40">
            {(song.ratingCount || 0) > 0 ? `${song.ratingCount} ratings` : ""} • {(song.playCount || 0).toLocaleString()} plays
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-bold text-[#D4AF37]">{song.isFree ? "Free download" : formatMoney(price, currency)}</span>
          <Link href={`/music/${song.slug}`} className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold hover:border-[#D4AF37]/60 hover:text-[#D4AF37] transition">
            {song.isFree ? "Get" : "Buy →"}
          </Link>
        </div>
      </div>
    </div>
  );
}
