import { Card, Button, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/currency";
import { useCurrency } from "@/components/providers";

export default function StorePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-10">
      <div className="text-center mb-8">
        <div className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37] font-bold">Merch Store</div>
        <h1 className="font-display text-4xl sm:text-5xl mt-2">Store</h1>
        <p className="mt-2 text-sm text-white/50">Official King Rhymes merchandise — caps, t-shirts, hoodies and more.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="text-center">
          <div className="h-48 rounded-xl bg-white/5 grid place-items-center text-6xl">🧢</div>
          <div className="mt-3 font-bold">King Rhymes Cap</div>
          <div className="text-xs text-white/50 mt-1">Adjustable snapback</div>
          <div className="mt-2 text-[#D4AF37] font-bold">$25.00</div>
          <Button className="w-full mt-3">Buy Now</Button>
        </Card>
        <Card className="text-center">
          <div className="h-48 rounded-xl bg-white/5 grid place-items-center text-6xl">👕</div>
          <div className="mt-3 font-bold">King Rhymes T-Shirt</div>
          <div className="text-xs text-white/50 mt-1">Premium cotton</div>
          <div className="mt-2 text-[#D4AF37] font-bold">$30.00</div>
          <Button className="w-full mt-3">Buy Now</Button>
        </Card>
        <Card className="text-center">
          <div className="h-48 rounded-xl bg-white/5 grid place-items-center text-6xl">🧥</div>
          <div className="mt-3 font-bold">King Rhymes Hoodie</div>
          <div className="text-xs text-white/50 mt-1">Heavyweight fleece</div>
          <div className="mt-2 text-[#D4AF37] font-bold">$55.00</div>
          <Button className="w-full mt-3">Buy Now</Button>
        </Card>
      </div>
      <div className="mt-8 text-center">
        <a href="/music" className="inline-flex items-center gap-2 rounded-full border border-[#F1D97A]/50 bg-[linear-gradient(145deg,#F1D97A,#D4AF37_58%,#B58D25)] px-6 py-3 text-sm font-black uppercase tracking-wider text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_6px_0_rgba(85,62,16,0.2),0_10px_24px_rgba(0,0,0,0.25)] transition hover:brightness-110">
          ▶ Buy An Album
        </a>
      </div>
    </div>
  );
}