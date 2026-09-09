"use client";
import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { FILM_FIRST, FILM_FRAMES, FILM_POSTER, FILM_SCROLL, filmFrame, type FilmSize } from "@/data/thali-film";
import { getGsap, reducedMotion, motionScale } from "@/lib/gsap";
import { FrameScrub, type ScrubHandle } from "@/components/motion/FrameScrub";
import { AnimatedHeading } from "@/components/motion/AnimatedHeading";

/** Phones never fetch the wide frames. */
const sizeForViewport = (): FilmSize => (typeof window !== "undefined" && window.innerWidth < 760 ? 460 : 800);

/**
 * Section 06: the thali served by scroll, from the restaurant's own footage.
 *
 * The section pins and the scroll position is the playhead. The canvas is
 * given a fractional frame and dissolves between neighbours, so there is no
 * step to see; on top of that the playhead eases toward the scroll's target
 * every tick, which takes the jitter out of a wheel or a trackpad without
 * ever running on its own. Stop scrolling and it settles exactly where you
 * left it; scroll back and the serving reverses.
 *
 * Under prefers-reduced-motion there is no pin and no canvas: the finished
 * plate, and both lines of copy.
 */
export function ThaliAssembly() {
  const section = useRef<HTMLElement>(null);
  const first = useRef<HTMLDivElement>(null);
  const last = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLParagraphElement>(null);
  const scrub = useRef<ScrubHandle | null>(null);
  const onReady = useCallback((h: ScrubHandle) => { scrub.current = h; }, []);

  useEffect(() => {
    const sec = section.current;
    if (!sec || reducedMotion()) return;
    const { gsap } = getGsap();
    const k = motionScale();
    const playhead = { at: 0 };
    let target = 0;
    let lastTick = performance.now();
    let lastDrawn = -1;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sec,
          start: "top top",
          end: `+=${FILM_SCROLL * 100}%`,
          pin: true,
          anticipatePin: 1,
          scrub: 0.4,
          invalidateOnRefresh: true,
          onUpdate: (self) => { target = self.progress * (FILM_FRAMES - 1); },
        },
      });
      // the words: the cue leaves early, the closing line arrives once the plate is whole
      tl.to(cue.current, { opacity: 0, duration: 0.08, ease: "none" }, 0.08);
      tl.to(first.current, { opacity: 0, y: -16 * k, duration: 0.06, ease: "power1.inOut" }, 0.88);
      tl.fromTo(last.current, { opacity: 0, y: 18 * k }, { opacity: 1, y: 0, duration: 0.07, ease: "power2.out" }, 0.91);
    });

    // the playhead: eased toward the scroll's target at the display's rate,
    // frame-rate independent, so 60Hz and 120Hz settle over the same time
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTick) / 1000);
      lastTick = now;
      const gap = target - playhead.at;
      if (Math.abs(gap) > 0.0004) playhead.at += gap * (1 - Math.exp(-dt * 14));
      else playhead.at = target;
      if (Math.abs(playhead.at - lastDrawn) > 0.0008) {
        lastDrawn = playhead.at;
        scrub.current?.draw(playhead.at);
      }
    };
    gsap.ticker.add(tick);
    return () => { gsap.ticker.remove(tick); ctx.revert(); };
  }, []);

  const framePath = useCallback((i: number) => filmFrame(i, sizeForViewport()), []);

  return (
    <section ref={section} id="experience" data-scene data-number="06" data-title="THE EXPERIENCE" data-bg="#eff4fa" className="relative border-y border-navy/[0.08]" aria-label="The experience: the Thakali plate, served step by step">
      <div className="wrap-wide flex min-h-[100vh] flex-col justify-center gap-8 py-[clamp(40px,6vw,80px)] md:grid md:grid-cols-12 md:items-center md:gap-[clamp(20px,3vw,40px)]">
        <div className="relative md:col-span-5">
          <p data-step={1} className="eyebrow mb-4 text-gold-ink">06 — The Experience</p>
          <div ref={first}>
            <AnimatedHeading as="h2" lines={["A PLATE", "OF STORIES."]} className="display text-[clamp(30px,5vw,62px)] leading-[1.04] text-navy" />
            <p data-step={3} className="mt-5 max-w-[42ch] text-[16px] leading-[1.75] text-slate">Rice, dal, curry, seasonal greens, achar and dahi — served on steel, the traditional way.</p>
          </div>
          <div ref={last} className="absolute left-0 top-[calc(1.6rem+10px)] opacity-0 motion-reduce:static motion-reduce:mt-6 motion-reduce:opacity-100" aria-hidden>
            <p className="accent-italic text-[clamp(28px,4.4vw,54px)] font-semibold leading-[1.08] text-gold-ink">Tradition,<br />served step by step.</p>
          </div>
          <p ref={cue} data-step={4} className="mt-8 inline-flex items-center gap-3 font-mono text-[9.5px] tracking-[0.3em] text-gold-ink motion-reduce:hidden">
            <span aria-hidden className="block h-px w-8 bg-gold" />SCROLL TO SERVE
          </p>
        </div>
        <div className="md:col-span-7">
          <div
            className="relative mx-auto aspect-square w-[min(88vw,52vh)] overflow-hidden rounded-2xl bg-navy-deep shadow-[0_30px_70px_-30px_rgba(11,31,54,0.55)] md:w-[min(46vw,80vh)]"
            role="img"
            aria-label="A Thakali thali being served: rice, dal, curry, greens, cauliflower and potato, pickles, papad, dahi and the sweet, placed one by one on a steel plate"
          >
            {/* the empty plate stands under the canvas until the frames arrive, so
                the scrub begins where the footage begins and nothing flips */}
            <Image src={FILM_FIRST} alt="" fill priority sizes="(min-width: 760px) 46vw, 88vw" className="object-cover motion-reduce:hidden" />
            <div className="absolute inset-0">
              <FrameScrub count={FILM_FRAMES} path={framePath} onReady={onReady} className="motion-reduce:hidden" loadingLabel="Serving" />
            </div>
            {/* no motion: the plate as it ends */}
            <Image src={FILM_POSTER} alt="" fill sizes="(min-width: 760px) 46vw, 88vw" className="hidden object-cover motion-reduce:block" />
            <span aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-gold/25" />
          </div>
        </div>
      </div>
    </section>
  );
}
