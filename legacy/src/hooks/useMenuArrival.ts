"use client";
import { useEffect, useRef } from "react";
import { getGsap } from "@/lib/gsap";

export const MENU_TURN_EVENT = "swadsatkar:menu-turn";
/** Scroll, as a fraction of the viewport, spent on settling the book before the first turn. */
const SETTLE = 0.6;
/** Scroll, as a fraction of the viewport, per page turn. */
const PER_TURN = 0.55;

/**
 * Pins the menu and scrubs the whole book with scroll.
 *
 * The book comes in tilted back and dim, settles flat over the first stretch,
 * then turns a page for every further stretch of scroll until the last
 * spread; scrolling back up turns them back. The book itself does the
 * turning, through its own queue, so a fast scroll plays the turns in order
 * rather than tearing. After the pin the book is the book: arrows, drag and
 * keyboard, exactly as before.
 *
 *   [data-book-stage]   the wrapper around the book that is tilted
 *   [data-views]        on the book, how many spreads it has right now
 */
export function useMenuArrival() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const { gsap, ScrollTrigger } = getGsap();
    const stage = section.querySelector<HTMLElement>("[data-book-stage]");
    if (!stage) return;
    const views = () => Math.max(1, Number(section.querySelector<HTMLElement>("[data-views]")?.dataset.views ?? 1));
    let shown = 0;
    const turnTo = (target: number) => {
      if (target === shown) return;
      shown = target;
      window.dispatchEvent(new CustomEvent(MENU_TURN_EVENT, { detail: target }));
    };

    const ctx = gsap.context(() => {
      gsap.set(stage, { transformPerspective: 1800, transformOrigin: "50% 100%" });
      const settle = gsap.fromTo(
        stage,
        { rotateX: 18, y: 48, filter: "brightness(0.72)" },
        { rotateX: 0, y: 0, filter: "brightness(1)", ease: "none", paused: true },
      );
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${(SETTLE + PER_TURN * (views() - 1)) * 100}%`,
        pin: true,
        pinSpacing: true,
        scrub: 0.5,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const n = views();
          const total = SETTLE + PER_TURN * (n - 1);
          const at = self.progress * total;
          settle.progress(Math.min(1, at / SETTLE));
          // a page turns each time the hand passes the middle of its stretch
          const target = Math.max(0, Math.min(n - 1, Math.floor((at - SETTLE) / PER_TURN + 0.5)));
          turnTo(target);
        },
        onLeaveBack: () => turnTo(0),
      });
    }, section);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, []);

  return { sectionRef };
}
