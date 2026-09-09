"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

export type TurnDir = 1 | -1;

export interface Turning {
  dir: TurnDir;
  /** True while the pointer is driving progress */
  manual: boolean;
  /** A scroll-driven turn: shorter, so the book keeps up with the hand */
  quick?: boolean;
}
/** Duration of a scroll-driven turn, in ms. */
const QUICK_TURN_MS = 320;

interface Options {
  pageCount: number;
  /** 2 = desktop spread, 1 = mobile single page */
  perView: 1 | 2;
  reduced: boolean;
  /** Called after each completed turn (for aria-live) */
  labelFor: (view: number) => string;
}

const TURN_MS = 900;
const COMPLETE_THRESHOLD = 0.4;
const CLICK_SLOP = 6;

let easeRegistered = false;
const scrubEase = () => {
  if (!easeRegistered) {
    gsap.registerPlugin(CustomEase);
    CustomEase.create("scrub", "0.65,0,0.35,1");
    easeRegistered = true;
  }
  return "scrub";
};

/**
 * Owns all page-turn state for <MenuBook />: which view is open, the leaf
 * currently in flight, pointer/keyboard input, a turn queue so rapid input
 * never runs two turns at once, and the GSAP-driven progress that writes
 * rotation, skew, specular highlight, cast shadow and z-order.
 */
export function useBookTurn({ pageCount, perView, reduced, labelFor }: Options) {
  const viewCount = perView === 2 ? Math.ceil(pageCount / 2) : pageCount;
  const [view, setView] = useState(0);
  const [turning, setTurning] = useState<Turning | null>(null);
  const [announcement, setAnnouncement] = useState(labelFor(0));

  const bookRef = useRef<HTMLDivElement>(null);
  const leafRef = useRef<HTMLDivElement>(null);
  const leftShadowRef = useRef<HTMLDivElement>(null);
  const rightShadowRef = useRef<HTMLDivElement>(null);

  const viewRef = useRef(view);
  viewRef.current = view;
  const turningRef = useRef<Turning | null>(null);
  const progress = useRef({ value: 0 });
  const tween = useRef<gsap.core.Tween | null>(null);
  const queue = useRef<{ dir: TurnDir; quick: boolean }[]>([]);
  const drag = useRef<{ startX: number; width: number; moved: boolean; pointerId: number } | null>(null);

  // Clamp view if perView changes (resize across the 768px breakpoint)
  useEffect(() => {
    setView((v) => Math.min(v, viewCount - 1));
  }, [viewCount]);

  const canTurn = useCallback(
    (dir: TurnDir, from = viewRef.current) => (dir === 1 ? from < viewCount - 1 : from > 0),
    [viewCount],
  );

  /** Writes every visual property for a progress value 0..1 */
  const applyProgress = useCallback(
    (p: number) => {
      const t = turningRef.current;
      const leaf = leafRef.current;
      if (!t || !leaf) return;
      const s = Math.sin(p * Math.PI); // 0 → 1 → 0, peaks at 90°
      let rotate: number;
      if (perView === 2) rotate = t.dir === 1 ? -180 * p : 180 * p;
      else rotate = t.dir === 1 ? -180 * p : -180 * (1 - p);

      gsap.set(leaf, {
        rotateY: rotate,
        skewY: (t.dir === 1 ? -1.5 : 1.5) * s,
        "--hl-x": `${t.dir === 1 ? 100 - p * 100 : p * 100}%`,
        "--hl-a": (0.55 * s).toFixed(3),
      });
      leaf.dataset.half = p < 0.5 ? "first" : "second";

      // Cast shadow: sweeps off the page being left and onto the page being landed on
      const leaving = t.dir === 1 ? rightShadowRef.current : leftShadowRef.current;
      const landing = t.dir === 1 ? leftShadowRef.current : rightShadowRef.current;
      if (leaving) gsap.set(leaving, { opacity: s * (1 - p) * 0.9, xPercent: (t.dir === 1 ? 1 : -1) * p * 30 });
      if (landing) gsap.set(landing, { opacity: s * p * 0.9, xPercent: (t.dir === 1 ? 1 : -1) * (1 - p) * -30 });
    },
    [perView],
  );

  const finish = useCallback(
    (completed: boolean) => {
      const t = turningRef.current;
      if (!t) return;
      const nextView = completed ? viewRef.current + t.dir : viewRef.current;
      turningRef.current = null;
      progress.current.value = 0;
      setTurning(null);
      if (completed) {
        setView(nextView);
        setAnnouncement(labelFor(nextView));
      }
      // Drain the queue on the next frame so React has committed the new view
      requestAnimationFrame(() => {
        const q = queue.current.shift();
        if (q !== undefined) begin(q.dir, false, q.quick);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labelFor],
  );

  const animateTo = useCallback(
    (target: 0 | 1, fromManual: boolean) => {
      tween.current?.kill();
      const current = progress.current.value;
      const distance = Math.abs(target - current);
      const ms = turningRef.current?.quick ? QUICK_TURN_MS : TURN_MS;
      tween.current = gsap.to(progress.current, {
        value: target,
        duration: fromManual && target === 0 ? 0.4 : Math.max(0.2, (ms / 1000) * distance),
        ease: fromManual && target === 0 ? "power2.out" : scrubEase(),
        onUpdate: () => applyProgress(progress.current.value),
        onComplete: () => finish(target === 1),
      });
    },
    [applyProgress, finish],
  );

  /** Starts a turn. `manual` = pointer-driven; otherwise animates immediately. */
  const begin = useCallback(
    (dir: TurnDir, manual: boolean, quick = false): boolean => {
      if (turningRef.current) {
        if (!manual) queue.current.push({ dir, quick });
        return false;
      }
      if (!canTurn(dir)) return false;
      if (reduced) {
        const nextView = viewRef.current + dir;
        setView(nextView);
        setAnnouncement(labelFor(nextView));
        return true;
      }
      const t: Turning = { dir, manual, quick };
      turningRef.current = t;
      progress.current.value = 0;
      setTurning(t);
      if (!manual) requestAnimationFrame(() => animateTo(1, false));
      return true;
    },
    [animateTo, canTurn, labelFor, reduced],
  );

  // Once the leaf mounts for a manual turn, paint frame 0
  useEffect(() => {
    if (turning && leafRef.current) applyProgress(progress.current.value);
  }, [turning, applyProgress]);

  const next = useCallback(() => begin(1, false), [begin]);
  const prev = useCallback(() => begin(-1, false), [begin]);

  const goTo = useCallback(
    (target: number) => {
      const diff = target - viewRef.current - queue.current.reduce<number>((a, q) => a + q.dir, 0) - (turningRef.current?.dir ?? 0);
      const dir: TurnDir = diff > 0 ? 1 : -1;
      for (let i = 0; i < Math.abs(diff); i++) begin(dir, false);
    },
    [begin],
  );

  /**
   * For the scroll scrub: drop whatever was queued and head for `target` in
   * quick turns, so the book follows the hand rather than replaying every
   * spread it passed.
   */
  const scrubTo = useCallback(
    (target: number) => {
      queue.current = [];
      const diff = target - viewRef.current - (turningRef.current?.dir ?? 0);
      const dir: TurnDir = diff > 0 ? 1 : -1;
      for (let i = 0; i < Math.abs(diff); i++) begin(dir, false, true);
    },
    [begin],
  );

  // ---- Pointer: drag / swipe / tap on the outer thirds -------------------
  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (reduced) return;
      if ((e.target as HTMLElement).closest("button, a, input, select, textarea")) return;
      const book = bookRef.current;
      if (!book || turningRef.current) return;
      const rect = book.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const dir: TurnDir = perView === 2 ? (x > rect.width / 2 ? 1 : -1) : 1;
      // On mobile the drag direction decides; on desktop the half you grab decides.
      drag.current = { startX: e.clientX, width: perView === 2 ? rect.width / 2 : rect.width, moved: false, pointerId: e.pointerId };
      if (perView === 2) {
        if (!canTurn(dir)) return;
        begin(dir, true);
      }
      book.setPointerCapture(e.pointerId);
    },
    [begin, canTurn, perView, reduced],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      if (!d.moved && Math.abs(dx) < CLICK_SLOP) return;
      d.moved = true;
      // Mobile: decide direction on first real movement
      if (perView === 1 && !turningRef.current) {
        const dir: TurnDir = dx < 0 ? 1 : -1;
        if (!canTurn(dir)) return;
        begin(dir, true);
        return; // leaf mounts next frame; progress applies on subsequent moves
      }
      const t = turningRef.current;
      if (!t) return;
      const raw = (t.dir === 1 ? -dx : dx) / d.width;
      progress.current.value = Math.min(1, Math.max(0, raw));
      applyProgress(progress.current.value);
    },
    [applyProgress, begin, canTurn, perView],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      const book = bookRef.current;
      drag.current = null;
      if (!d || !book) return;
      if (book.hasPointerCapture(e.pointerId)) book.releasePointerCapture(e.pointerId);
      const t = turningRef.current;

      if (!d.moved) {
        // Tap / click: outer third turns, middle third does nothing
        const rect = book.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const third = rect.width / 3;
        const wantDir: TurnDir | 0 = x < third ? -1 : x > 2 * third ? 1 : 0;
        if (t) {
          if (wantDir === t.dir) animateTo(1, false);
          else finish(false); // clicked the middle: put the leaf down
        } else if (wantDir !== 0) {
          begin(wantDir, false);
        }
        return;
      }
      if (!t) return;
      animateTo(progress.current.value > COMPLETE_THRESHOLD ? 1 : 0, true);
    },
    [animateTo, begin, finish],
  );

  const onPointerCancel = useCallback(() => {
    drag.current = null;
    if (turningRef.current) animateTo(0, true);
  }, [animateTo]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(viewCount - 1);
      }
    },
    [next, prev, goTo, viewCount],
  );

  useEffect(
    () => () => {
      tween.current?.kill();
    },
    [],
  );

  return useMemo(
    () => ({
      view,
      viewCount,
      turning,
      announcement,
      canNext: canTurn(1, view),
      canPrev: canTurn(-1, view),
      next,
      prev,
      goTo,
      scrubTo,
      refs: { bookRef, leafRef, leftShadowRef, rightShadowRef },
      handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onKeyDown },
    }),
    [view, viewCount, turning, announcement, canTurn, next, prev, goTo, scrubTo, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onKeyDown],
  );
}
