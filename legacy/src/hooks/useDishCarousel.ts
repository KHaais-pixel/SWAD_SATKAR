"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { DISH_SCROLL, dishes } from "@/data/dishes";
import { getGsap } from "@/lib/gsap";

/**
 * Pins the dish row and ties its position to scroll.
 *
 * One number drives everything: the fractional index of whichever dish sits
 * at the centre of the viewport. Scroll moves that number; the row slides so
 * the matching dish is centred, and each card's scale, brightness, opacity,
 * softness and elevation follow from its distance to that centre. Nothing
 * snaps between states: emphasis is a continuous function of position, so
 * focus visibly hands over from one plate to the next as they pass.
 *
 * Horizontal wheel or trackpad movement inside the pinned section is folded
 * into the same scroll, so sideways swipes drive the row too.
 *
 * Elements are found by data attribute inside `sectionRef`:
 *   [data-track]      the flex row that slides
 *   [data-card=i]     one dish, [data-img] its image, [data-shadow] its floor
 *   [data-caption=i]  the caption block for dish i
 *   [data-glow]       the light behind whichever dish is centred
 */
export function useDishCarousel() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const goToRef = useRef<(i: number) => void>(() => {});

  const goTo = useCallback((i: number) => goToRef.current(i), []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const { gsap, ScrollTrigger } = getGsap();
    const n = dishes.length;
    const last = n - 1;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(section);
      const track = q("[data-track]")[0] as HTMLElement | undefined;
      const cards = Array.from({ length: n }, (_, i) => q(`[data-card="${i}"]`)[0] as HTMLElement | undefined);
      const imgs = cards.map((c) => c?.querySelector<HTMLElement>("[data-img]") ?? null);
      const shadows = cards.map((c) => c?.querySelector<HTMLElement>("[data-shadow]") ?? null);
      const captions = Array.from({ length: n }, (_, i) => q(`[data-caption="${i}"]`)[0] as HTMLElement | undefined);
      const glow = q("[data-glow]")[0] as HTMLElement | undefined;
      if (!track || cards.some((c) => !c)) return;

      // Geometry, re-measured on every refresh so resizes keep the centre.
      let step = 0;
      let centre = 0;
      const measure = () => {
        const a = cards[0]!, b = cards[1];
        step = b ? b.offsetLeft - a.offsetLeft : a.offsetWidth;
        centre = section.clientWidth / 2 - a.offsetLeft - a.offsetWidth / 2;
      };

      const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
      const setX = gsap.quickSetter(track, "x", "px");

      /** Lays out the row and every card for a fractional centre index. */
      const apply = (p: number) => {
        setX(centre - step * p);
        for (let i = 0; i < n; i++) {
          const d = Math.abs(i - p);
          const t1 = clamp01(d); // 0 at centre, 1 one slot away
          const t2 = clamp01(d - 1); // 0 within one slot, 1 two slots away
          const scale = 1 - 0.2 * t1 - 0.08 * t2;
          const opacity = 1 - 0.26 * t1 - 0.34 * t2;
          const brightness = 1 - 0.38 * t1 - 0.2 * t2;
          const blur = 1.4 * t1 + 1.6 * t2;
          gsap.set(cards[i]!, {
            scale,
            y: 16 * t1 + 10 * t2,
            opacity,
            filter: `brightness(${brightness.toFixed(3)}) blur(${blur.toFixed(2)}px)`,
            zIndex: 10 - Math.round(d),
          });
          // The image drifts a touch against its card: depth without distortion.
          if (imgs[i]) gsap.set(imgs[i]!, { xPercent: (i - p) * 2.5 });
          if (shadows[i]) gsap.set(shadows[i]!, { opacity: 0.55 - 0.35 * t1, scaleX: 1 - 0.18 * t1 });
          if (captions[i]) gsap.set(captions[i]!, { opacity: 1 - clamp01(d * 1.6), y: (i - p) * 14 });
        }
        // The light behind the centre swells as a plate settles into place.
        if (glow) gsap.set(glow, { opacity: 1 - 0.45 * clamp01(Math.abs(p - Math.round(p)) * 2) });
        const idx = Math.round(p);
        if (idx !== activeRef.current) {
          activeRef.current = idx;
          setActive(idx);
        }
      };

      const playhead = { p: 0 };
      const tween = gsap.to(playhead, {
        p: last,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${DISH_SCROLL * 100}%`,
          pin: true,
          pinSpacing: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap: {
            snapTo: 1 / last,
            duration: { min: 0.25, max: 0.7 },
            delay: 0.08,
            ease: "power2.inOut",
            // Settle on the nearest plate. Projecting velocity would carry a
            // quick flick past its neighbour, which reads as a jump.
            inertia: false,
            directional: false,
          },
          onRefresh: () => {
            measure();
            apply(playhead.p);
          },
        },
        onUpdate: () => apply(playhead.p),
      });
      const st = tween.scrollTrigger!;

      measure();
      apply(0);

      // Jump to a dish: used by the arrows and the keyboard.
      goToRef.current = (i: number) => {
        const target = Math.min(last, Math.max(0, i));
        const y = st.start + (st.end - st.start) * (target / last);
        if (window.__lenis) window.__lenis.scrollTo(y, { duration: 0.9 });
        else window.scrollTo({ top: y, behavior: "smooth" });
      };

      // Sideways wheel or trackpad movement drives the same scroll.
      const onWheel = (e: WheelEvent) => {
        if (!st.isActive || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        e.preventDefault();
        const y = window.scrollY + e.deltaX * 1.4;
        if (window.__lenis) window.__lenis.scrollTo(y, { lerp: 0.18 });
        else window.scrollBy(0, e.deltaX * 1.4);
      };
      section.addEventListener("wheel", onWheel, { passive: false });

      const onKey = (e: KeyboardEvent) => {
        if (e.key === "ArrowRight") { e.preventDefault(); goToRef.current(activeRef.current + 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); goToRef.current(activeRef.current - 1); }
      };
      section.addEventListener("keydown", onKey);

      return () => {
        section.removeEventListener("wheel", onWheel);
        section.removeEventListener("keydown", onKey);
      };
    }, section);

    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts?.ready) document.fonts.ready.then(refresh);
    window.addEventListener("load", refresh);

    return () => {
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, []);

  return { sectionRef, active, goTo };
}
