export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10">
      <div className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37] font-bold">Legal</div>
      <h1 className="font-display text-4xl mt-2">Privacy Policy</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/70">
        <p>We collect only what we need: your email for logins and payment processing, your name for comments/donations, and purchase records. Payment details go directly to Flutterwave — we never store card numbers or MOMO PINs.</p>
        <p><strong className="text-white">Use.</strong> Emails are used for receipts, download links, replies to bookings, and (if you subscribe) occasional music updates. Unsubscribe anytime.</p>
        <p><strong className="text-white">Cookies.</strong> A single session cookie keeps you logged in. Anonymous play counts help us see which songs fans love.</p>
        <p><strong className="text-white">Sharing.</strong> We never sell your data. Payment providers process transactions under their own policies.</p>
        <p><strong className="text-white">Your rights.</strong> Email bookings@kingrhymesmusic.com to access, correct or delete your data.</p>
      </div>
    </div>
  );
}
