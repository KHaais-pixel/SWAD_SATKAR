"use client";
import { useEffect, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";
import { LoungeRenderer, type LoungeTextures } from "@/components/lounge/gl";
import { stateAt, COPY } from "@/components/lounge/timeline";
import { announceHeroReady } from "@/lib/loading";

/** Viewports of scroll the lounge takes: the timeline is long and slow. */
export const LOUNGE_SCROLL = 6;
/** Backing store never exceeds this many device pixels per CSS pixel. */
const MAX_DPR = 1.5;
/** The copy layers, matched by data attribute, and the curve that fades each. */
const COPY_LAYERS = ["name", "night", "linger", "cue", "scrim"] as const;

/**
 * Pins the section and turns scroll into the virtual camera. ScrollTrigger's
 * scrub gives the first smoothing; a second, time-based ease on top keeps a
 * flick of the wheel from ever stepping. Draws only while the section is on
 * screen, and only when something changed: the dust drifts, so that is most
 * frames while pinned, and none once scrolled past.
 */
export function useLoungeScroll(textures: LoungeTextures | null) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas || !textures) return;
    const { gsap, ScrollTrigger } = getGsap();

    let renderer: LoungeRenderer;
    try {
      renderer = new LoungeRenderer(canvas);
    } catch (err) {
      console.warn("lounge: no WebGL2, showing the still", err);
      setStill(true);
      announceHeroReady(1);
      return;
    }

    let target = 0;
    let progress = 0;
    let lastTick = performance.now();
    let active = true;
    let dirty = true;
    const copyEls = new Map<string, HTMLElement>();
    copyRef.current?.querySelectorAll<HTMLElement>("[data-copy]").forEach((el) => copyEls.set(el.dataset.copy!, el));

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      renderer.resize(Math.round(canvas.clientWidth * dpr), Math.round(canvas.clientHeight * dpr));
      dirty = true;
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: `+=${LOUNGE_SCROLL * 100}%`,
      pin: true,
      anticipatePin: 1,
      scrub: 0.5,
      invalidateOnRefresh: true,
      onUpdate: (self) => { target = self.progress; },
      onToggle: (self) => { active = self.isActive; dirty = true; },
    });
    target = st.progress;
    progress = target;

    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTick) / 1000);
      lastTick = now;
      if (!active && !dirty) return;
      if (document.visibilityState === "hidden") return;
      // ease the remaining distance away: about 90% in a fifth of a second
      const gap = target - progress;
      if (Math.abs(gap) > 0.00005) progress += gap * (1 - Math.exp(-dt * 11));
      else progress = target;
      const state = stateAt(progress, { width: canvas.clientWidth, height: canvas.clientHeight });
      renderer.render(state, now / 1000);
      for (const key of COPY_LAYERS) {
        const el = copyEls.get(key);
        if (!el) continue;
        const o = COPY[key](progress);
        el.style.opacity = o.toFixed(3);
        el.style.visibility = o < 0.02 ? "hidden" : "visible";
        if (key !== "cue" && key !== "scrim") el.style.transform = `translate3d(0, ${((1 - o) * (key === "linger" ? 14 : -10)).toFixed(1)}px, 0)`;
      }
      // rest once the scene is still and out of view
      dirty = active || Math.abs(gap) > 0.00005;
    };
    gsap.ticker.add(tick);

    // pictures: the hookah first (the loading screen waits for it), the bar after
    let cancelled = false;
    announceHeroReady(0.3);
    (async () => {
      try {
        await Promise.all([renderer.load(0, textures.hookah, true), renderer.load(1, textures.hookahDepth, false)]);
        if (cancelled) return;
        dirty = true;
        announceHeroReady(0.7);
        await Promise.all([renderer.load(2, textures.bar, true), renderer.load(3, textures.barDepth, false), renderer.load(4, textures.barGlow, true)]);
        if (cancelled) return;
        dirty = true;
        announceHeroReady(1);
      } catch {
        announceHeroReady(1);
      }
    })();

    return () => {
      cancelled = true;
      gsap.ticker.remove(tick);
      ro.disconnect();
      st.kill();
      renderer.dispose();
    };
  }, [textures]);

  return { sectionRef, canvasRef, copyRef, still };
}
