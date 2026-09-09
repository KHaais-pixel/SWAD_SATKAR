"use client";
import { useEffect } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Lenis smooth scroll, wired into GSAP's ticker so ScrollTrigger scrubs stay in
 * sync. Both libraries are imported dynamically so they stay out of the
 * first-load bundle. Disabled entirely under prefers-reduced-motion, and torn
 * down on unmount.
 */
export function SmoothScroll() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ default: Lenis }, { getGsap }] = await Promise.all([import("lenis"), import("@/lib/gsap")]);
      if (cancelled) return;
      const { gsap, ScrollTrigger } = getGsap();

      const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      window.__lenis = lenis;

      cleanup = () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
        window.__lenis = undefined;
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [reduced]);

  return null;
}

declare global {
  interface Window {
    __lenis?: { stop: () => void; start: () => void; destroy: () => void; scrollTo: (t: number | string | HTMLElement, o?: object) => void };
  }
}
