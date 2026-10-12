"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "./providers";
import { timeAgo } from "@/lib/format";

export function RatingWidget({ songId, initialAvg, initialCount, userId }: { songId: string; initialAvg: number; initialCount: number; userId?: string }) {
  const { push } = useToast();
  const router = useRouter();
  const [avg, setAvg] = useState(initialAvg);
  const [count, setCount] = useState(initialCount);
  const [mine, setMine] = useState<number | null>(null);
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/ratings?songId=${songId}`).then((r) => r.json()).then((j) => {
      if (j.mine) setMine(j.mine);
      if (typeof j.avg === "number") setAvg(j.avg);
      if (typeof j.count === "number") setCount(j.count);
    }).catch(() => {});
  }, [songId, userId]);

  async function rate(stars: number) {
    if (!userId) {
      push("Log in to rate this song", "error");
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId, stars }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      setMine(stars);
      setAvg(j.avg);
      setCount(j.count);
      push("Thanks for rating!", "success");
    } catch (e: unknown) {
      push(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => rate(i)}
            disabled={loading}
            className={`text-2xl transition ${(hover || mine || Math.round(avg)) >= i ? "text-[#D4AF37]" : "text-white/20"} hover:scale-110`}
            aria-label={`Rate ${i} stars`}
          >
            ★
          </button>
        ))}
      </div>
      <div className="text-sm text-white/60">
        <span className="font-bold text-white">{avg.toFixed(1)}</span> • {count} {count === 1 ? "rating" : "ratings"}
        {mine ? <span className="ml-2 text-[#D4AF37]">You: {mine}★</span> : null}
      </div>
    </div>
  );
}

type Comment = {
  id: string;
  body: string;
  authorName: string;
  authorAvatar?: string | null;
  isArtistReply: boolean;
  parentId?: string | null;
  createdAt: string;
  userId?: string | null;
  replies?: Comment[];
};

export function CommentsSection({ songId, user, isAdmin }: { songId: string; user: { id: string; displayName: string } | null; isAdmin: boolean }) {
  const { push } = useToast();
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const r = await fetch(`/api/comments?songId=${songId}`);
      const j = await r.json();
      setComments(j.comments || []);
    } catch {}
    finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    fetch(`/api/comments?songId=${songId}`)
      .then((r) => r.json())
      .then((j) => {
        if (active) setComments(j.comments || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [songId]);

  async function submit(parentId: string | null = null) {
    const text = body.trim();
    if (!text) return;
    if (!user) {
      push("Log in to comment", "error");
      router.push("/login");
      return;
    }
    try {
      const r = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId, body: text, parentId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      setBody("");
      setReplyTo(null);
      push(j.pending ? "Comment submitted for review" : "Comment posted!", "success");
      load();
    } catch (e: unknown) {
      push(e instanceof Error ? e.message : "Failed", "error");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this comment?")) return;
    const r = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (r.ok) {
      push("Deleted", "success");
      load();
    } else push("Could not delete", "error");
  }

  function renderComment(c: Comment, depth = 0) {
    return (
      <div key={c.id} className={`${depth > 0 ? "ml-6 sm:ml-10 border-l border-white/10 pl-4" : ""} py-4 ${depth === 0 ? "border-b border-white/[0.07]" : ""}`}>
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold overflow-hidden">
            {c.authorAvatar ? <img src={c.authorAvatar} alt="" className="h-full w-full object-cover" /> : (c.authorName || "F")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{c.authorName}</span>
              {c.isArtistReply && (
                <span className="rounded-full bg-[#D4AF37] px-2 py-0.5 text-[10px] font-black text-black uppercase tracking-wide">✓ Artist</span>
              )}
              <span className="text-[11px] text-white/40">{timeAgo(c.createdAt)}</span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-white/80 whitespace-pre-wrap">{c.body}</p>
            <div className="mt-2 flex items-center gap-3 text-xs">
              {user && depth === 0 && <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)} className="text-white/50 hover:text-[#D4AF37]">Reply</button>}
              {(user?.id === c.userId || isAdmin) && <button onClick={() => remove(c.id)} className="text-white/40 hover:text-red-300">Delete</button>}
            </div>
            {replyTo === c.id && (
              <div className="mt-3 flex gap-2">
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={`Reply to ${c.authorName}…`}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-[#D4AF37]/60"
                />
                <button onClick={() => submit(c.id)} className="rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-bold text-black">Send</button>
              </div>
            )}
          </div>
        </div>
        {c.replies?.map((r) => renderComment(r, depth + 1))}
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-display text-2xl">Comments ({comments.length})</h3>
      {user ? (
        <div className="mt-4 flex gap-2">
          <input
            value={replyTo ? body : body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit(null);
            }}
            placeholder={user ? `Share your thoughts as ${user.displayName}…` : "Log in to comment"}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-[#D4AF37]/60"
          />
          <button onClick={() => submit(null)} className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-black hover:bg-[#F1D97A]">
            Post
          </button>
        </div>
      ) : (
        <Link href="/login" className="mt-4 block rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-4 text-sm text-white/60 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]">
          Log in to join the conversation →
        </Link>
      )}
      <div className="mt-4">
        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.05]" />)}</div>
        ) : comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center text-sm text-white/40">No comments yet — be the first to show love.</div>
        ) : (
          comments.map((c) => renderComment(c))
        )}
      </div>
    </div>
  );
}
