"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { FRAME_COUNT, SERVE_SCROLL, stageAtFrame, thaliStages } from "@/data/thali";
import type { SequenceHandle } from "@/components/sequence/FrameSequence";
import { getGsap } from "@/lib/gsap";

/**
 * Pins the serving section and ties the frame sequence directly to scroll.
 *
 * Scroll position is the only clock: moving down advances the pour, moving up
 * runs it backwards. The plate is never unmounted and never cross-faded; the
 * canvas simply paints the frame that belongs to the current scroll offset.
 *
 * Elements are found by data attribute inside `sectionRef`:
 *   [data-stage=i]      the caption block for stage i
 *   [data-tick=i]       the progress tick, [data-tick-fill=i] its fill
 *   [data-parallax]     props that drift behind the plate
 *   [data-plate-shift]  the plate's own slow counter-drift
 */
export function useThaliService() {
  const sectionRef = useRef<HTMLElement>(null);
  const sequenceRef = useRef<SequenceHandle | null>(null);
  const [stage, setStage] = useState(0);
  const stageRef = useRef(0);

  const onSequenceReady = useCallback((handle: SequenceHandle) => {
    sequenceRef.current = handle;
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const { gsap, ScrollTrigger } = getGsap();

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(section);
      const common = { trigger: section, start: "top top", end: `+=${SERVE_SCROLL * 100}%` } as const;

      // The frame counter. Scrubbing this is the whole animation.
      const playhead = { frame: 0 };

      gsap.to(playhead, {
        frame: FRAME_COUNT - 1,
        ease: "none",
        scrollTrigger: {
          ...common,
          pin: true,
          pinSpacing: true,
          scrub: 0.55,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          sequenceRef.current?.draw(playhead.frame);
          const i = stageAtFrame(playhead.frame);
          if (i !== stageRef.current) {
            stageRef.current = i;
            setStage(i);
          }
        },
      });

      // Captions: one in, one out, driven off the same scroll range.
      const tl = gsap.timeline({ scrollTrigger: { ...common, scrub: 0.35 } });
      const span = FRAME_COUNT - 1;
      thaliStages.forEach((s, i) => {
        const el = q(`[data-stage="${i}"]`)[0];
        const at = s.frame / span;
        const nextAt = i < thaliStages.length - 1 ? thaliStages[i + 1].frame / span : 1;
        if (!el) return;
        gsap.set(el, { opacity: i === 0 ? 1 : 0, yPercent: i === 0 ? 0 : 24 });
        if (i > 0) tl.to(el, { opacity: 1, yPercent: 0, duration: 0.045, ease: "power3.out" }, at);
        if (i < thaliStages.length - 1)
          tl.to(el, { opacity: 0, yPercent: -20, duration: 0.04, ease: "power3.in" }, nextAt - 0.045);
      });

      // Progress ticks fill across their own stretch of the scroll.
      thaliStages.forEach((s, i) => {
        const fill = q(`[data-tick-fill="${i}"]`)[0];
        const tick = q(`[data-tick="${i}"]`)[0];
        if (!fill) return;
        const at = s.frame / span;
        const nextAt = i < thaliStages.length - 1 ? thaliStages[i + 1].frame / span : 1;
        gsap.set(fill, { scaleX: 0, transformOrigin: "0% 50%" });
        gsap.set(tick, { opacity: i === 0 ? 1 : 0.4 });
        tl.to(fill, { scaleX: 1, duration: nextAt - at, ease: "none" }, at);
        tl.to(tick, { opacity: 1, duration: 0.03 }, at);
        if (i < thaliStages.length - 1) tl.to(tick, { opacity: 0.45, duration: 0.03 }, nextAt);
      });

      // Parallax: the plate drifts slowly against the props behind it, and
      // grows a little as it fills, so the finished thali sits closest.
      const plate = q("[data-plate-shift]")[0];
      if (plate) gsap.fromTo(plate, { yPercent: 3, scale: 0.94 }, { yPercent: -5, scale: 1, ease: "none", scrollTrigger: { ...common, scrub: 1.6 } });
      // The light behind the plate swells at each course and settles between.
      const glow = q("[data-plate-glow]")[0];
      if (glow) {
        gsap.set(glow, { opacity: 0.55, scale: 0.9 });
        thaliStages.forEach((s, i) => {
          if (i === 0) return;
          const at = s.frame / span;
          tl.to(glow, { opacity: 1, scale: 1.04, duration: 0.03, ease: "power2.out" }, at);
          tl.to(glow, { opacity: 0.7, scale: 0.98, duration: 0.06, ease: "power2.inOut" }, at + 0.03);
        });
      }
      const props = q("[data-parallax]");
      if (props.length) gsap.to(props, { yPercent: 10, ease: "none", scrollTrigger: { ...common, scrub: 2.2 } });
    }, section);

    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts?.ready) document.fonts.ready.then(refresh);
    window.addEventListener("load", refresh);

    return () => {
      window.removeEventListener("load", refresh);
      ctx.revert(); // kills the pin, the triggers and every tween
    };
  }, []);

  return { sectionRef, stage, onSequenceReady };
}
