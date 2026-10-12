import { getSession } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminClient from "./admin-client";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 pt-20 text-center">
        <div className="text-5xl">🔒</div>
        <h1 className="font-display text-3xl mt-4">Admin only</h1>
        <p className="mt-2 text-sm text-white/55">Logged in as {session.email}. This area is reserved for the artist ({process.env.ADMIN_EMAIL || "admin"}). <Link href="/" className="text-[#D4AF37] underline">Go home</Link></p>
      </div>
    );
  }
  return <AdminClient user={session} />;
}
