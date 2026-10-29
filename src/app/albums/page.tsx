import { Card, Button, Badge } from "@/components/ui";
import Link from "next/link";

export default function AlbumsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-10">
      <div className="text-center mb-8">
        <div className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37] font-bold">Discography</div>
        <h1 className="font-display text-4xl sm:text-5xl mt-2">Albums</h1>
        <p className="mt-2 text-sm text-white/50">Full albums — buy and download all tracks.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="h-48 rounded-xl bg-white/5 grid place-items-center text-6xl">💿</div>
          <div className="mt-3 font-bold">King Rhymes — Debut Album</div>
          <div className="text-xs text-white/50 mt-1">12 tracks • Hip-Hop / Dancehall Fusion</div>
          <div className="mt-2 text-[#D4AF37] font-bold">$9.99</div>
          <Button className="w-full mt-3">Buy Album</Button>
        </Card>
      </div>
    </div>
  );
}