"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface ScrubHandle {
  /** Paint a fractional position along the sequence. Called every tick. */
  draw: (pos: number) => void;
  /** True once every frame has decoded. */
  ready: boolean;
}

/**
 * A sequence of frames drawn to a canvas and indexed by scroll rather than
 * played. Three things make it feel continuous instead of stepped:
 *
 *   - the position is fractional, and the canvas dissolves between the two
 *     frames it falls between, so there is no frame boundary to see;
 *   - frames arrive coarse first (every eighth, then every fourth, and so
 *     on), and the draw always blends the nearest loaded frame on each side,
 *     so an early or slow load reads as a softer scrub, never a stuck one;
 *   - the backing store is capped at the frames' own resolution, so a retina
 *     screen pays for detail that exists rather than pixels that do not.
 */
export function FrameScrub({
  count,
  path,
  onReady,
  className,
  loadingLabel = "Serving",
  rootMargin = "150% 0px",
}: {
  count: number;
  path: (i: number) => string;
  onReady?: (handle: ScrubHandle) => void;
  className?: string;
  loadingLabel?: string;
  rootMargin?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // transparent until the first frame lands, so the still underneath shows through
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const frames: (HTMLImageElement | null)[] = new Array(count).fill(null);
    let alive = true;
    let decoded = 0;
    let lastKey = -1;
    let wanted = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      const first = frames.find(Boolean);
      const cap = first ? Math.max(1, first.naturalWidth / rect.width) : 2;
      const dpr = Math.min(window.devicePixelRatio || 1, 2, cap);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      lastKey = -1;
    };

    /** The nearest loaded frame at or before i, and at or after i. */
    const near = (i: number, dir: -1 | 1) => {
      for (let k = i; k >= 0 && k < count; k += dir) if (frames[k]) return k;
      return -1;
    };

    const paint = (pos: number) => {
      const p = Math.max(0, Math.min(count - 1, pos));
      const lo = near(Math.floor(p), -1);
      if (lo < 0) return;
      const hiRaw = near(Math.ceil(p), 1);
      const hi = hiRaw < 0 ? lo : hiRaw;
      const t = hi > lo ? Math.max(0, Math.min(1, (p - lo) / (hi - lo))) : 0;
      // a fine quantum: far below what an eye can see, far above per-pixel churn
      const key = Math.round(lo * 4096 + t * 4095);
      if (key === lastKey) return;
      lastKey = key;
      const cw = canvas.width, ch = canvas.height;
      const cover = (img: HTMLImageElement) => {
        const k = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
        const dw = img.naturalWidth * k, dh = img.naturalHeight * k;
        ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      };
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.globalAlpha = 1;
      cover(frames[lo]!);
      if (hi !== lo && t > 0.002) {
        ctx.globalAlpha = t;
        cover(frames[hi]!);
        ctx.globalAlpha = 1;
      }
      canvas.dataset.frame = p.toFixed(2);
      canvas.dataset.blend = t.toFixed(3);
    };

    const handle: ScrubHandle = {
      draw: (pos) => { wanted = pos; paint(pos); },
      ready: false,
    };

    const load = (i: number) =>
      new Promise<void>((resolve) => {
        if (frames[i]) return resolve();
        const img = new Image();
        img.decoding = "async";
        img.src = path(i);
        img.onload = async () => {
          try { await img.decode(); } catch {}
          if (!alive) return resolve();
          frames[i] = img;
          if (decoded === 0) resize();
          decoded += 1;
          setProgress(decoded / count);
          // a newly arrived frame may sit between the two being blended
          lastKey = -1;
          paint(wanted);
          resolve();
        };
        img.onerror = () => resolve();
      });

    resize();
    window.addEventListener("resize", resize);

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      (async () => {
        await load(0);
        // coarse first, then refine: the scrub works long before the last frame lands
        for (const stride of [8, 4, 2, 1]) {
          const batch: number[] = [];
          for (let i = 0; i < count; i += stride) if (!frames[i]) batch.push(i);
          for (let b = 0; b < batch.length; b += 10) {
            if (!alive) return;
            await Promise.all(batch.slice(b, b + 10).map(load));
          }
        }
        if (!alive) return;
        handle.ready = true;
        onReady?.(handle);
      })();
    };

    let observer: IntersectionObserver | null = null;
    if (!("IntersectionObserver" in window)) start();
    else {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { start(); observer?.disconnect(); }
      }, { rootMargin });
      observer.observe(canvas);
    }
    onReady?.(handle);

    return () => {
      alive = false;
      observer?.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [count, path, onReady, rootMargin]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden />
      <div
        className={cn("pointer-events-none absolute inset-x-0 bottom-4 flex justify-center transition-opacity duration-700", progress >= 1 ? "opacity-0" : "opacity-100")}
        aria-hidden={progress >= 1}
      >
        <span className="flex items-center gap-3 rounded-full bg-navy-deep/70 px-4 py-2 backdrop-blur-sm">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-gold-light">{loadingLabel}</span>
          <span className="block h-px w-16 overflow-hidden bg-cream-bright/25">
            <span className="block h-full bg-gold transition-[width] duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
          </span>
        </span>
      </div>
    </div>
  );
}
