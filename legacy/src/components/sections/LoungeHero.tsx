"use client";
import { useEffect, useMemo } from "react";
import Image from "next/image";
import { restaurant } from "@/data/restaurant";
import { Button } from "@/components/ui/Button";
import { BookButton } from "@/components/booking/BookButton";
import { ArrowIcon } from "@/components/ui/Glyphs";
import { useLoungeScroll, LOUNGE_SCROLL } from "@/hooks/useLoungeScroll";
import type { LoungeTextures } from "@/components/lounge/gl";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useMounted } from "@/hooks/useMounted";
import { announceHeroReady } from "@/lib/loading";
import { cn } from "@/lib/cn";

/**
 * The lounge: a scroll through a dark room, past the hookah, into its metal,
 * out into the bar. Drawn live in WebGL from two renders and their depth
 * maps (see src/components/lounge). No video, no frames.
 *
 * Copy appears where the scene has room for it: the name at the start, one
 * line beside the hookah, one line and the buttons over the finished bar.
 */

/** Phones never fetch desktop textures. */
function texturesFor(): LoungeTextures {
  const tall = typeof window !== "undefined" && Math.max(window.innerWidth, window.innerHeight) * Math.min(window.devicePixelRatio || 1, 1.5) >= 1300;
  return {
    hookah: `/lounge/hookah-${tall ? 1536 : 768}.webp`,
    hookahDepth: "/lounge/hookah-depth.webp",
    bar: `/lounge/bar-${tall ? 2048 : 1024}.webp`,
    barDepth: "/lounge/bar-depth.webp",
    barGlow: "/lounge/bar-glow.webp",
  };
}

function Name({ className, layer }: { className?: string; layer?: string }) {
  return (
    <div className={className} data-copy={layer}>
      <p className="eyebrow mb-6">{restaurant.descriptor}, Lalitpur</p>
      <h1 id="hero-title" className="text-display text-paper">
        {restaurant.name}
        <span lang="ne" className="font-devanagari mt-3 block text-[0.42em] font-normal tracking-normal text-azure">
          {restaurant.nameDevanagari}
        </span>
      </h1>
    </div>
  );
}

function Actions() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <BookButton size="lg">Book a Table</BookButton>
      <Button size="lg" variant="ghost" href="/menu">
        See the Menu
        <ArrowIcon className="opacity-70" />
      </Button>
    </div>
  );
}

function LiveLounge() {
  const textures = useMemo(texturesFor, []);
  const { sectionRef, canvasRef, copyRef, still } = useLoungeScroll(textures);
  return (
    <section ref={sectionRef} data-hero data-lounge={still ? "static" : "live"} className="relative isolate h-[100svh] overflow-hidden bg-ink" aria-labelledby="hero-title">
      <canvas ref={canvasRef} aria-hidden className={cn("absolute inset-0 -z-10 h-full w-full", still && "hidden")} />
      {/* If WebGL is refused, the still of the bar stands in. */}
      {still && (
        <div aria-hidden className="absolute inset-0 -z-20">
          <Image src="/lounge/poster.jpg" alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(4_9_18/0.85),rgb(4_9_18/0.25)_60%,transparent)]" />
        </div>
      )}
      <div ref={copyRef} className="container-site relative flex h-full flex-col justify-center pb-[max(56px,10vh)] pt-24 md:pb-24">
        {/* a little shade under the closing line, so it reads over the steel */}
        <div data-copy="scrim" aria-hidden className="pointer-events-none absolute inset-x-[calc(-1*var(--gutter))] bottom-0 h-[55%] bg-[linear-gradient(180deg,transparent,rgb(4_9_18/0.72))]" style={{ opacity: 0, visibility: "hidden" }} />
        <Name layer="name" className="max-w-[760px] will-change-[opacity,transform]" />
        <p className="sr-only">Scroll to walk through the lounge.</p>
        <p data-copy="night" className="text-display absolute left-[var(--gutter)] top-[18%] max-w-[8ch] text-paper will-change-[opacity,transform] md:top-1/2 md:max-w-[9ch] md:-translate-y-1/2" style={{ opacity: 0, visibility: "hidden" }}>
          Where the night begins.
        </p>
        <div data-copy="linger" className="absolute bottom-[max(56px,10vh)] left-[var(--gutter)] right-[var(--gutter)] will-change-[opacity,transform] md:bottom-24" style={{ opacity: 0, visibility: "hidden" }}>
          <p className="text-lead max-w-[30ch] text-paper">An atmosphere crafted for lingering.</p>
          <div className="mt-8">
            <Actions />
          </div>
        </div>
        <p data-copy="cue" aria-hidden className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-3 text-small text-fg-muted">
          <span className="block h-px w-10 bg-azure/70" />
          Scroll
        </p>
      </div>
    </section>
  );
}

/** No pin, no WebGL: the bar, the name, both lines, the buttons. */
function StillLounge() {
  useEffect(() => {
    announceHeroReady(1);
  }, []);
  return (
    <section data-hero className="relative isolate min-h-[100svh] overflow-hidden bg-ink" aria-labelledby="hero-title">
      <div className="absolute inset-0 -z-10">
        <Image src="/lounge/poster.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(4_9_18/0.88),rgb(4_9_18/0.4)_55%,rgb(4_9_18/0.2))]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,transparent,rgb(4_9_18/0.85))]" />
      </div>
      <div className="container-site relative flex min-h-[100svh] flex-col justify-center pb-[max(56px,10vh)] pt-24 md:pb-24">
        <Name className="max-w-[760px]" />
        <p className="text-lead mt-8 max-w-[38ch] text-fg-muted">Where the night begins. An atmosphere crafted for lingering.</p>
        <div className="mt-10">
          <Actions />
        </div>
      </div>
    </section>
  );
}

export function LoungeHero() {
  const reduced = useReducedMotion();
  const mounted = useMounted();
  if (reduced || !mounted) return <StillLounge />;
  return <LiveLounge />;
}

export { LOUNGE_SCROLL };
