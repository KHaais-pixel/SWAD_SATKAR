"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { PAGE_H, PAGE_RATIO, PAGE_W, SPREADS, TURN_SCROLL, bookPage } from "@/data/menu-book";
import { getGsap, reducedMotion } from "@/lib/gsap";
import { AnimatedHeading } from "@/components/motion/AnimatedHeading";

const TURNS = SPREADS.length - 1;

/**
 * The printed menu as a book, turned by scroll.
 *
 * Each photograph is already an open spread, so the book is built the way a
 * real one is: the right-hand page of a spread is a leaf whose front is that
 * page and whose back is the left-hand page of the next spread. Turning it
 * lays the next left page down and uncovers the next right page underneath,
 * so the four spreads read in order and nothing is composited.
 *
 * The scroll position is the playhead, eased toward its target every display
 * refresh, and the leaf's angle is a continuous rotation, so the turn is
 * smooth at any scroll speed and reverses exactly. Under
 * prefers-reduced-motion the spreads are simply stacked.
 */
export function MenuFlip() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const sec = section.current, st = stage.current;
    if (!sec || !st || reducedMotion()) return;
    const { gsap } = getGsap();
    const leaves = Array.from(st.querySelectorAll<HTMLElement>("[data-leaf]"));
    const shades = leaves.map((l) => l.querySelector<HTMLElement>("[data-shade]"));
    const edgeR = st.querySelector<HTMLElement>("[data-edge=right]");
    const edgeL = st.querySelector<HTMLElement>("[data-edge=left]");
    const setters = leaves.map((l) => ({ rot: gsap.quickSetter(l, "rotationY", "deg"), z: gsap.quickSetter(l, "z", "px") }));

    let target = 0;
    const head = { at: 0 };
    let lastTick = performance.now();
    let drawn = -1;

    const apply = (t: number) => {
      for (let k = 0; k < leaves.length; k++) {
        const u = Math.max(0, Math.min(1, t - k));
        setters[k].rot(-180 * u);
        // a shallow arc, so the page lifts off the spine rather than shearing
        setters[k].z(Math.sin(u * Math.PI) * 26);
        leaves[k].style.zIndex = String(u < 0.5 ? leaves.length - k : leaves.length + k);
        const sh = shades[k];
        if (sh) sh.style.opacity = (Math.sin(u * Math.PI) * 0.5).toFixed(3);
      }
      // the stack of pages still to come, and the ones already read
      const f = TURNS ? Math.max(0, Math.min(1, t / TURNS)) : 0;
      if (edgeR) edgeR.style.transform = `scaleX(${(1 - f * 0.85).toFixed(3)})`;
      if (edgeL) edgeL.style.transform = `scaleX(${(0.15 + f * 0.85).toFixed(3)})`;
    };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sec,
          start: "top top",
          end: `+=${TURNS * TURN_SCROLL * 100}%`,
          pin: true,
          anticipatePin: 1,
          scrub: 0.4,
          invalidateOnRefresh: true,
          onUpdate: (self) => { target = self.progress * TURNS; },
        },
      });
      tl.to(cue.current, { opacity: 0, duration: 0.1, ease: "none" }, 0.06);
    });

    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTick) / 1000);
      lastTick = now;
      const gap = target - head.at;
      if (Math.abs(gap) > 0.0002) head.at += gap * (1 - Math.exp(-dt * 14));
      else head.at = target;
      if (Math.abs(head.at - drawn) > 0.0004) { drawn = head.at; apply(head.at); }
    };
    apply(0);
    gsap.ticker.add(tick);
    return () => { gsap.ticker.remove(tick); ctx.revert(); };
  }, []);

  const label = `The printed menu, four spreads: ${SPREADS.map((s) => `${s.left}, ${s.right}`).join("; ")}`;

  return (
    <section ref={section} id="menu-book" data-scene data-number="07" data-title="THE MENU" data-bg="#fbf7ee" className="relative" aria-label="The printed menu">
      <div className="wrap-wide flex min-h-[100vh] flex-col justify-center gap-8 py-[clamp(40px,6vw,80px)] md:grid md:grid-cols-12 md:items-center md:gap-[clamp(20px,3vw,44px)]">
        <div className="md:col-span-4">
          <p data-step={1} className="eyebrow mb-4 text-gold-ink">07 — The Menu</p>
          <AnimatedHeading as="h2" lines={["THE PRINTED", "MENU."]} className="display text-[clamp(28px,4.4vw,52px)] leading-[1.06] text-navy" />
          <p data-step={3} className="mt-5 max-w-[38ch] text-[16px] leading-[1.75] text-slate">
            Four spreads, exactly as they are printed: starters and soups, the Thakali and dhido sets, snacks and seafood, Thai food and the bar.
          </p>
          <p data-step={4} className="mt-6">
            <Link href="/thakali" data-cursor="EXPLORE" className="link-arrow text-navy hover:text-gold-ink">
              <span className="link-text">Read the full menu</span> <span className="arrow" aria-hidden>→</span>
            </Link>
          </p>
          <p ref={cue} data-step={5} className="mt-8 inline-flex items-center gap-3 font-mono text-[9.5px] tracking-[0.3em] text-gold-ink motion-reduce:hidden">
            <span aria-hidden className="block h-px w-8 bg-gold" />SCROLL TO TURN
          </p>
        </div>

        <div className="md:col-span-8">
          {/* the book */}
          <div className="book-view mx-auto w-full motion-reduce:hidden">
            <div
              ref={stage}
              className="book relative mx-auto w-full md:h-[min(68vh,38vw)] md:w-auto"
              style={{ aspectRatio: `${2} / ${PAGE_RATIO}` }}
              role="img"
              aria-label={label}
            >
              {/* the first left page, under everything */}
              <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden rounded-l-[6px]">
                <Image src={bookPage(0, "l")} alt="" width={PAGE_W} height={PAGE_H} sizes="(min-width: 760px) 34vw, 50vw" quality={88} className="block h-full w-full object-cover" />
              </span>
              {/* the leaves: front is this spread's right page, back is the next spread's left page */}
              {SPREADS.map((s, k) => (
                <div key={k} data-leaf={k} className="leaf">
                  <span className="face">
                    <Image src={bookPage(k, "r")} alt="" width={PAGE_W} height={PAGE_H} sizes="(min-width: 760px) 34vw, 50vw" quality={88} className="block h-full w-full object-cover" />
                    <span data-shade aria-hidden className="pointer-events-none absolute inset-0 opacity-0" style={{ background: "linear-gradient(90deg, rgba(11,31,54,.55), rgba(11,31,54,0) 55%)" }} />
                  </span>
                  {k < TURNS && (
                    <span className="face back">
                      <Image src={bookPage(k + 1, "l")} alt="" width={PAGE_W} height={PAGE_H} sizes="(min-width: 760px) 34vw, 50vw" quality={88} className="block h-full w-full object-cover" />
                      <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(270deg, rgba(11,31,54,.28), rgba(11,31,54,0) 60%)" }} />
                    </span>
                  )}
                </div>
              ))}
              {/* the spine, and the block of pages on either side */}
              <span aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 z-[99] w-[3.5%] -translate-x-1/2" style={{ background: "linear-gradient(90deg, rgba(11,31,54,0), rgba(11,31,54,.34) 45%, rgba(11,31,54,.34) 55%, rgba(11,31,54,0))" }} />
              <span data-edge="right" aria-hidden className="pointer-events-none absolute inset-y-[1.5%] right-[-6px] w-[6px] origin-left rounded-r-[3px] bg-[linear-gradient(90deg,#e6ddc8,#fbf7ee)] shadow-[2px_0_6px_rgba(11,31,54,.18)]" />
              <span data-edge="left" aria-hidden className="pointer-events-none absolute inset-y-[1.5%] left-[-6px] w-[6px] origin-right scale-x-[0.15] rounded-l-[3px] bg-[linear-gradient(270deg,#e6ddc8,#fbf7ee)] shadow-[-2px_0_6px_rgba(11,31,54,.18)]" />
            </div>
          </div>
          {/* no motion: the spreads as they are */}
          <div className="hidden flex-col gap-4 motion-reduce:flex">
            {SPREADS.map((s, k) => (
              <Image key={k} src={`/photos/menu-board-${k + 1}.jpg`} alt={`Printed menu: ${s.left}, and ${s.right}`} width={1800} height={1230} sizes="(min-width: 760px) 60vw, 92vw" className="block h-auto w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
