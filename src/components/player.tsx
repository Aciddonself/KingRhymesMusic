"use client";
import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";
import { formatDuration } from "@/lib/format";

export type QueueTrack = {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string | null;
  audioUrl: string;
  isPreview: boolean;
  artist?: string;
};

type PlayerCtx = {
  current: QueueTrack | null;
  queue: QueueTrack[];
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  playTrack: (t: QueueTrack, queue?: QueueTrack[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (v: number) => void;
  setVolume: (v: number) => void;
  addToQueue: (t: QueueTrack) => void;
};

const Ctx = createContext<PlayerCtx | null>(null);
export function usePlayer() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlayer outside provider");
  return v;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<QueueTrack | null>(null);
  const [queue, setQueue] = useState<QueueTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);

  useEffect(() => {
    const a = new Audio();
    a.preload = "metadata";
    a.volume = 0.85;
    audioRef.current = a;
    const onTime = () => {
      setProgress(a.currentTime);
      // enforce 30s preview limit handled in UI copy; allow full file but if preview flag, soft-stop at 30s? keep playing preview file fully (file itself is preview)
    };
    const onMeta = () => setDuration(a.duration || 0);
    const onEnd = () => {
      setQueue((q) => {
        if (!q.length) {
          setIsPlaying(false);
          return q;
        }
        const [nxt, ...rest] = q;
        setCurrent(nxt);
        if (audioRef.current) {
          audioRef.current.src = nxt.audioUrl;
          audioRef.current.play().catch(() => {});
        }
        return rest;
      });
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.pause();
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  const playTrack = useCallback((t: QueueTrack, q?: QueueTrack[]) => {
    setCurrent(t);
    if (q) setQueue(q);
    setProgress(0);
    const a = audioRef.current;
    if (a) {
      a.src = t.audioUrl;
      a.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
      // play count bump (fire & forget)
      fetch(`/api/songs/${t.id}/play`, { method: "POST" }).catch(() => {});
    }
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (a.paused) {
      a.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      a.pause();
      setIsPlaying(false);
    }
  }, [current]);

  // keep isPlaying in sync
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, []);

  const next = useCallback(() => {
    setQueue((q) => {
      if (!q.length) return q;
      const [nxt, ...rest] = q;
      setCurrent(nxt);
      const a = audioRef.current;
      if (a) {
        a.src = nxt.audioUrl;
        a.play().catch(() => {});
      }
      return rest;
    });
  }, []);

  const prev = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) {
      a.currentTime = 0;
      return;
    }
  }, []);

  const seek = useCallback((v: number) => {
    const a = audioRef.current;
    if (a) {
      a.currentTime = v;
      setProgress(v);
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const addToQueue = useCallback((t: QueueTrack) => {
    setQueue((q) => [...q, t]);
  }, []);

  return (
    <Ctx.Provider value={{ current, queue, isPlaying, progress, duration, volume, playTrack, toggle, next, prev, seek, setVolume, addToQueue }}>
      {children}
      <PersistentBar />
    </Ctx.Provider>
  );
}

function Waveform({ progress, duration }: { progress: number; duration: number }) {
  const bars = 48;
  const pct = duration ? progress / duration : 0;
  return (
    <div className="flex items-center gap-[2px] h-8 flex-1 min-w-[80px]">
      {Array.from({ length: bars }).map((_, i) => {
        const active = i / bars < pct;
        const h = 8 + Math.abs(Math.sin(i * 0.7)) * 22 + (i % 5 === 0 ? 6 : 0);
        return (
          <div
            key={i}
            className={`w-[3px] rounded-full ${active ? "bg-[#D4AF37]" : "bg-white/15"}`}
            style={{ height: h }}
          />
        );
      })}
    </div>
  );
}

function PersistentBar() {
  const { current, isPlaying, toggle, next, progress, duration, seek, volume, setVolume, queue, addToQueue } =
    usePlayer() as PlayerCtx;
  if (!current) return null;
  return (
    <div className="fixed bottom-0 inset-x-0 z-[90] border-t border-white/10 bg-[#0c0c12]/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3 sm:gap-4">
        {/* cover */}
        <div className="h-11 w-11 rounded-lg overflow-hidden bg-white/10 shrink-0 border border-white/10">
          {current.coverUrl ? <img src={current.coverUrl} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-[#D4AF37]">♪</div>}
        </div>
        <div className="min-w-0 w-36 sm:w-48 shrink-0">
          <div className="truncate text-sm font-semibold">{current.title}</div>
          <div className="text-[11px] text-[#A8A29A] truncate">
            {current.isPreview ? "30s preview" : "Full track"} {queue.length ? `• ${queue.length} in queue` : ""}
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button onClick={next} className="h-9 w-9 grid place-items-center rounded-full border border-white/10 text-white/70 hover:text-white" title="Next">
            ⏭
          </button>
          <button
            onClick={toggle}
            className="h-11 w-11 grid place-items-center rounded-full bg-[#D4AF37] text-black font-bold hover:bg-[#F1D97A] text-lg"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>
        </div>
        <div className="hidden md:flex flex-1 items-center gap-3">
          <span className="text-[11px] tabular-nums text-white/50 w-10 text-right">{formatDuration(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={progress}
            onChange={(e) => seek(Number(e.target.value))}
            className="flex-1 accent-[#D4AF37]"
          />
          <span className="text-[11px] tabular-nums text-white/50 w-10">{formatDuration(duration)}</span>
          <Waveform progress={progress} duration={duration} />
        </div>
        {/* mobile seek */}
        <div className="flex md:hidden flex-1 items-center gap-2">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={progress}
            onChange={(e) => seek(Number(e.target.value))}
            className="flex-1 accent-[#D4AF37]"
          />
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className="text-white/50 text-sm">🔊</span>
          <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-20 accent-[#D4AF37]" />
        </div>
        <a href={`/music/${current.slug}`} className="hidden lg:inline-flex text-[11px] uppercase tracking-[0.18em] text-[#D4AF37] hover:underline shrink-0">
          Open →
        </a>
      </div>
      {/* mobile progress line */}
      <div className="md:hidden h-[2px] bg-white/10">
        <div className="h-full bg-[#D4AF37]" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
      </div>
    </div>
  );
}
