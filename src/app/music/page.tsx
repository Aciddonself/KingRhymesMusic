"use client";
import { useEffect, useMemo, useState } from "react";
import { SongCard, SongCardData } from "@/components/song-card";
import { SectionHeading, Skeleton, Empty } from "@/components/ui";

export default function MusicPage() {
  const [songs, setSongs] = useState<SongCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState("new");

  useEffect(() => {
    fetch("/api/songs").then((r) => r.json()).then((j) => setSongs(j.songs || [])).finally(() => setLoading(false));
  }, []);

  const genres = useMemo(() => Array.from(new Set(songs.map((s) => s.genre))).filter(Boolean), [songs]);

  const filtered = useMemo(() => {
    let list = [...songs];
    if (q) list = list.filter((s) => (s.title + " " + (s.genre || "")).toLowerCase().includes(q.toLowerCase()));
    if (genre) list = list.filter((s) => s.genre === genre);
    if (sort === "rated") list.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    else if (sort === "plays") list.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    else if (sort === "price-low") list.sort((a, b) => parseFloat(String(a.priceUsd)) - parseFloat(String(b.priceUsd)));
    return list;
  }, [songs, q, genre, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10">
      <SectionHeading kicker="The catalogue" title="Music" sub="Stream 30-second previews free. Buy to unlock full high-quality downloads." />
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search songs…" className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm outline-none focus:border-[#D4AF37]/60" />
        <div className="flex gap-2">
          <select value={genre} onChange={(e) => setGenre(e.target.value)} className="rounded-full border border-white/10 bg-[#161411] px-4 py-3 text-sm">
            <option value="">All genres</option>
            {genres.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-full border border-white/10 bg-[#161411] px-4 py-3 text-sm">
            <option value="new">Newest</option>
            <option value="rated">Top rated</option>
            <option value="plays">Most played</option>
            <option value="price-low">Price: low → high</option>
          </select>
        </div>
      </div>
      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="aspect-[3/4]" />)}</div>
        ) : filtered.length === 0 ? (
          <Empty title="No songs found" hint="Try a different search or genre. New music drops every month — join the mailing list." />
        ) : (
          <>
            <div className="mb-4 text-xs text-white/40">{filtered.length} track{filtered.length === 1 ? "" : "s"}</div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {filtered.map((s) => <SongCard key={s.id} song={s} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
