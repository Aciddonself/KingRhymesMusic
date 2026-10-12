import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 pt-24 text-center">
      <div className="font-display text-8xl text-[#D4AF37]/30">404</div>
      <h1 className="font-display text-3xl mt-2">Lost in the mix?</h1>
      <p className="mt-2 text-sm text-white/50">That page doesn&apos;t exist — but the music does.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-bold text-black">Home</Link>
        <Link href="/music" className="rounded-full border border-white/15 px-6 py-3 text-sm">Music →</Link>
      </div>
    </div>
  );
}
