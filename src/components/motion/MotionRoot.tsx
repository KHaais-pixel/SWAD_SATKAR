"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getGsap, EASE, reducedMotion, motionScale } from "@/lib/gsap";
import { CustomCursor } from "./CustomCursor";

/**
 * The page's motion, in one place, re-armed on every route:
 *
 *   smooth scroll     Lenis on GSAP's ticker; its velocity feeds a CSS
 *                     variable so pictures carry a little momentum
 *   scenes            a [data-scene] reveals its [data-step] children in
 *                     order: number, headline, paragraph, picture, buttons
 *   drifts            [data-drift="y:-40"] (or x, opacity) scrubs with scroll
 *                     across the element's own section
 *   backgrounds       [data-bg="#hex"] on a section eases <main>'s colour
 *                     toward it as the section approaches
 *   navigation        [data-theme="dark"] and [data-nav="/path"] tell the
 *                     header what it is over
 *   lines             [data-line] rules draw themselves in
 *
 * Under prefers-reduced-motion nothing here runs and the stylesheet shows
 * everything at once.
 */
export function MotionRoot() {
  const pathname = usePathname();

  // smooth scroll, once
  useEffect(() => {
    if (reducedMotion()) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;
      const { gsap, ScrollTrigger } = getGsap();
      const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      const root = document.documentElement;
      let vy = 0;
      const tick = (time: number) => {
        lenis.raf(time * 1000);
        // momentum: a few pixels at most, easing back to rest
        const target = Math.max(-14, Math.min(14, lenis.velocity * 0.12));
        vy += (target - vy) * 0.12;
        root.style.setProperty("--vy", `${vy.toFixed(2)}px`);
      };
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      window.__lenis = lenis as unknown as Window["__lenis"];
      cleanup = () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
        window.__lenis = undefined;
        root.style.removeProperty("--vy");
      };
    })();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  // everything that reads the page, per route
  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion()) {
      root.classList.remove("motion");
      return;
    }
    root.classList.add("motion");
    const { gsap, ScrollTrigger } = getGsap();
    const k = motionScale();
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      /* scenes */
      const seen = new Set<Element>();
      document.querySelectorAll<HTMLElement>("[data-scene]").forEach((scene) => {
        const steps = Array.from(scene.querySelectorAll<HTMLElement>("[data-step]")).sort((a, b) => Number(a.dataset.step || 0) - Number(b.dataset.step || 0));
        steps.forEach((s) => seen.add(s));
        if (!steps.length) return;
        gsap.fromTo(
          steps,
          { opacity: 0, y: 28 * k },
          { opacity: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.12, clearProps: "transform", scrollTrigger: { trigger: scene, start: "top 78%", once: true } },
        );
      });
      // steps outside any scene reveal on their own
      document.querySelectorAll<HTMLElement>("[data-step]").forEach((el) => {
        if (seen.has(el)) return;
        gsap.fromTo(el, { opacity: 0, y: 24 * k }, { opacity: 1, y: 0, duration: 1, ease: EASE, clearProps: "transform", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      });

      /* lines that draw themselves */
      document.querySelectorAll<HTMLElement>("[data-line]").forEach((el) => {
        gsap.fromTo(el, { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 1.4, ease: "power2.inOut", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      });

      /* drifts: scrubbed across the element's section */
      document.querySelectorAll<HTMLElement>("[data-drift]").forEach((el) => {
        const spec = el.dataset.drift || "";
        const to: Record<string, number> = {};
        const from: Record<string, number> = {};
        spec.split(/\s+/).forEach((pair) => {
          const [prop, v] = pair.split(":");
          const n = parseFloat(v);
          if (Number.isNaN(n)) return;
          if (prop === "x" || prop === "y") { from[prop] = -n * k; to[prop] = n * k; }
          if (prop === "opacity") { from.opacity = n; to.opacity = 1; }
          if (prop === "scale") { from.scale = 1; to.scale = n; }
        });
        const section = el.closest("section") || el;
        gsap.fromTo(el, from, { ...to, ease: "none", scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.8 } });
      });

      /* backgrounds: <main> eases toward each section's colour */
      const main = document.getElementById("main");
      const bgs = Array.from(document.querySelectorAll<HTMLElement>("[data-bg]"));
      if (main && bgs.length) {
        let prev = getComputedStyle(main).backgroundColor;
        bgs.forEach((sec) => {
          const next = sec.dataset.bg!;
          gsap.fromTo(main, { backgroundColor: prev }, { backgroundColor: next, ease: "none", immediateRender: false, scrollTrigger: { trigger: sec, start: "top 85%", end: "top 25%", scrub: 0.6 } });
          prev = next;
        });
      }

      /* what the header is over */
      const darkCount = { n: 0 };
      document.querySelectorAll<HTMLElement>('[data-theme="dark"]').forEach((sec) => {
        ScrollTrigger.create({
          trigger: sec, start: "top 44px", end: "bottom 44px",
          onToggle: (self) => { darkCount.n += self.isActive ? 1 : -1; root.dataset.navTheme = darkCount.n > 0 ? "dark" : "light"; },
        });
      });
      document.querySelectorAll<HTMLElement>("[data-nav]").forEach((sec) => {
        ScrollTrigger.create({
          trigger: sec, start: "top 50%", end: "bottom 50%",
          onToggle: (self) => { if (self.isActive) root.dataset.navActive = sec.dataset.nav; else if (root.dataset.navActive === sec.dataset.nav) root.dataset.navActive = ""; },
        });
      });
    });
    root.dataset.navTheme = "light";
    root.dataset.navActive = "";
    // nothing stays hidden if a trigger never fires
    const late = window.setTimeout(() => document.querySelectorAll<HTMLElement>("[data-step]").forEach((el) => { el.style.opacity = "1"; }), 3500);
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 600);
    return () => {
      window.clearTimeout(late);
      window.clearTimeout(refresh);
      ctx.revert();
    };
  }, [pathname]);

  return <CustomCursor />;
}
