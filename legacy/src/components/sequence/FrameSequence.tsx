"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * A frame sequence drawn to a canvas and indexed by scroll, not played.
 *
 * The first frame paints as soon as it decodes so the box is never empty;
 * the rest arrive in small batches, and the drawn frame never runs ahead of
 * what has loaded in order, so a slow connection shows a pour that lags
 * rather than one that flickers. Frames are drawn to cover the canvas, so
 * a 16:9 sequence fills a tall phone screen the way a background would.
 */
export interface SequenceHandle {
  /** Paint a frame. Called from the scroll timeline. */
  draw: (index: number) => void;
  ready: boolean;
}

export function FrameSequence({
  count,
  path,
  onReady,
  className,
  loadingLabel = "Loading",
  eager = false,
  cuts,
}: {
  /** Number of frames, numbered from 0. */
  count: number;
  /** Where frame i lives. Called on the client, so it may look at the viewport. */
  path: (i: number) => string;
  onReady?: (handle: SequenceHandle) => void;
  className?: string;
  /** Read by assistive tech while frames load. */
  loadingLabel?: string;
  /** Load at mount rather than when the box comes near. For the landing page. */
  eager?: boolean;
  /** Frame numbers where the footage cuts to a new scene. */
  cuts?: number[];
}) {
  const FRAME_COUNT = count;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<(HTMLImageElement | null)[]>([]);
  const lastRef = useRef(-1);
  /** Highest frame loaded with no gap before it. */
  const readyToRef = useRef(-1);
  /** The frame the scroll last asked for, which may not be loaded yet. */
  const pendingRef = useRef(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const frames: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
    const cutList = cuts ?? [];
    framesRef.current = frames;
    let alive = true;
    let decoded = 0;

    /** Sizes the backing store to the box, capped so phones stay cheap. */
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      // Retina screens get at most the footage's own resolution: pixels
      // beyond that add fill cost on every scroll tick and no detail.
      const first = frames.find(Boolean);
      const cap = first ? Math.max(1, first.naturalWidth / Math.max(1, rect.width)) : 2;
      const dpr = Math.min(window.devicePixelRatio || 1, 2, cap);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      lastRef.current = -1;
    };

    const paint = (index: number) => {
      const wanted = Math.max(0, Math.min(FRAME_COUNT - 1, index));
      // While frames are still arriving, hold at the last one loaded in order.
      // Jumping to whatever happens to be decoded makes the picture flicker.
      const pos = Math.min(wanted, readyToRef.current);
      if (pos < 0) return;
      // A scroll position lands between two frames; draw both, the second at
      // the fractional weight, so the scrub reads as a dissolve, not steps.
      const lo = Math.floor(pos);
      let hi = Math.min(FRAME_COUNT - 1, lo + 1, readyToRef.current);
      // Never dissolve across a cut: two different scenes on top of each
      // other reads as a double exposure. Show whichever side is nearer.
      const cutHere = cutList.find((c) => c > lo && c <= hi);
      let t = hi > lo ? pos - lo : 0;
      if (cutHere !== undefined) {
        if (t >= 0.5) { hi = Math.min(hi, readyToRef.current); }
        t = t >= 0.5 ? 1 : 0;
      }
      const key = Math.round(pos * 64);
      if (key === lastRef.current) return;
      const a = frames[lo], b = frames[hi];
      if (!a) return;
      lastRef.current = key;
      const cw = canvas.width, ch = canvas.height;
      const cover = (img: HTMLImageElement) => {
        const k = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
        const dw = img.naturalWidth * k, dh = img.naturalHeight * k;
        ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      };
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, cw, ch);
      cover(a);
      if (b && b !== a && t > 0.01) {
        ctx.globalAlpha = t;
        cover(b);
        ctx.globalAlpha = 1;
      }
      // A short dip to navy over each cut, so the edit feels intentional.
      if (cutList.length) {
        let near = Infinity;
        for (const c of cutList) {
          const d = Math.abs(pos - (c - 0.5));
          // a cut at the very end is the loop point: measure it both ways round
          near = Math.min(near, c >= FRAME_COUNT ? Math.min(d, FRAME_COUNT - d) : d);
        }
        if (near < 1.25) {
          ctx.globalAlpha = 0.6 * (1 - near / 1.25);
          ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--night").trim() || "#04141f";
          ctx.fillRect(0, 0, cw, ch);
          ctx.globalAlpha = 1;
        }
      }
      canvas.dataset.frame = pos.toFixed(2);
    };

    const handle: SequenceHandle = {
      draw: (index: number) => {
        pendingRef.current = index;
        paint(index);
      },
      ready: false,
    };

    const load = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.src = path(i);
        img.onload = async () => {
          // Decode off the main thread now, so the first draw of this frame
          // never stalls a scroll tick.
          try { await img.decode(); } catch {}
          if (!alive) return resolve();
          frames[i] = img;
          if (i === 0) resize();
          decoded += 1;
          // Advance the contiguous watermark and repaint at the new limit.
          while (frames[readyToRef.current + 1]) readyToRef.current += 1;
          setProgress(decoded / FRAME_COUNT);
          if (lastRef.current < 0 || pendingRef.current > lastRef.current / 64) {
            const target = lastRef.current < 0 ? 0 : Math.min(pendingRef.current, readyToRef.current);
            lastRef.current = -1;
            paint(target);
          }
          resolve();
        };
        img.onerror = () => resolve();
      });

    resize();
    window.addEventListener("resize", resize);

    // The sequence is 80 files; fetching them on page load would cost a
    // phone on a slow connection several seconds before the hero. Load the
    // first frame at once so the plate is never blank, and the rest only when
    // the section is within a viewport of arriving.
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      (async () => {
        await load(0);
        const rest = Array.from({ length: FRAME_COUNT - 1 }, (_, k) => k + 1);
        for (let b = 0; b < rest.length; b += 8) {
          if (!alive) return;
          await Promise.all(rest.slice(b, b + 8).map(load));
        }
        if (!alive) return;
        handle.ready = true;
        onReady?.(handle);
      })();
    };
    let observer: IntersectionObserver | null = null;
    if (eager || !("IntersectionObserver" in window)) {
      start();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            start();
            observer?.disconnect();
          }
        },
        { rootMargin: "100% 0px" },
      );
      observer.observe(canvas);
    }

    // Hand the drawer over straight away so early scrolling still paints.
    onReady?.(handle);

    return () => {
      alive = false;
      observer?.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [onReady, count, path, eager, cuts]);

  return (
    <div className={cn("relative w-full", className)}>
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
      {/* While the courses are still arriving, say so. Without this the plate
          simply holds an early frame and reads as a broken animation. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-[var(--dur-expr)]",
          progress >= 1 ? "opacity-0" : "opacity-100",
        )}
        aria-hidden={progress >= 1}
      >
        <div className="flex flex-col items-center gap-3 rounded-card bg-ink/70 px-5 py-4 backdrop-blur-sm">
          <span className="text-[0.625rem] uppercase tracking-[0.2em] text-fg-muted">{loadingLabel}</span>
          <span className="block h-px w-28 overflow-hidden bg-hairline">
            <span
              className="block h-full bg-azure transition-[width] duration-200"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
