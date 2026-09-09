"use client";
import Image from "next/image";
import { restaurant } from "@/data/restaurant";
import { heroFilmSources, heroFramePath, HERO_CUTS, HERO_FRAME_COUNT } from "@/data/hero";
import { FrameSequence } from "@/components/sequence/FrameSequence";
import { ArrowIcon } from "@/components/ui/Glyphs";
import { Button } from "@/components/ui/Button";
import { BookButton } from "@/components/booking/BookButton";
import { useHeroScrub } from "@/hooks/useHeroScrub";
import { useEffect } from "react";
import type { SequenceHandle } from "@/components/sequence/FrameSequence";
import { announceHeroReady } from "@/lib/loading";
import { useMounted } from "@/hooks/useMounted";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * The landing page. The name holds still while the footage behind it is
 * scrubbed by scroll: the doorway, the mountains, the plate, the spices, the
 * curry, the city, the bar, the room. A scrim keeps the type legible over
 * every scene. The first frame is a real image so the page paints at once.
 */

/** Pick the frame set for the screen: phones never fetch desktop frames. */
const pathForViewport = (i: number) => heroFramePath(i, typeof window !== "undefined" && window.innerWidth < 768 ? 960 : 1600);

function Copy() {
  return (
    <div className="max-w-[760px]">
      <p className="eyebrow rise mb-6" style={{ "--i": 0, color: "var(--on-night-muted)" } as React.CSSProperties}>
        {restaurant.descriptor}, Lalitpur
      </p>
      <h1 id="hero-title" className="text-display rise text-on-night" style={{ "--i": 1 } as React.CSSProperties}>
        {restaurant.name}
        <span lang="ne" className="font-devanagari mt-3 block text-[0.42em] font-normal tracking-normal text-on-night-muted">
          {restaurant.nameDevanagari}
        </span>
      </h1>
      <p className="text-lead rise mt-8 max-w-[38ch] text-on-night-muted" style={{ "--i": 2 } as React.CSSProperties}>
        {restaurant.tagline}
      </p>
      <div className="rise mt-10 flex flex-col gap-3 sm:flex-row" style={{ "--i": 3 } as React.CSSProperties}>
        <BookButton size="lg">Book a Table</BookButton>
        <Button size="lg" variant="night" href="/menu">
          See the Menu
          <ArrowIcon className="opacity-70" />
        </Button>
      </div>
    </div>
  );
}

/** The scene's first frame, so there is a picture before any script runs. */
function Poster() {
  return (
    <Image
      src={heroFramePath(0, 1600)}
      alt=""
      fill
      priority
      sizes="100vw"
      className="object-cover"
    />
  );
}

/** Keeps the type readable over the brightest scenes. */
function Scrim() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 45%, transparent 40%, color-mix(in srgb, var(--night) 55%, transparent) 78%, color-mix(in srgb, var(--night) 85%, transparent) 100%), linear-gradient(90deg, color-mix(in srgb, var(--night) 88%, transparent) 0%, color-mix(in srgb, var(--night) 62%, transparent) 42%, color-mix(in srgb, var(--night) 14%, transparent) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[38%]"
        style={{ background: "linear-gradient(0deg, color-mix(in srgb, var(--night) 80%, transparent) 0%, transparent 100%)" }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-28"
        style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--night) 70%, transparent) 0%, transparent 100%)" }}
      />
    </>
  );
}

/** The film, for idle playback; sits over the canvas and fades in and out. */
const filmForViewport = () => heroFilmSources(typeof window !== "undefined" && window.innerWidth < 768 ? 960 : 1600);

function ScrubbedHero() {
  const { sectionRef, videoRef, onSequenceReady } = useHeroScrub();
  // The loading screen waits for the first frame; the film is welcome later.
  const onReady = (h: SequenceHandle) => {
    onSequenceReady(h);
    announceHeroReady(h.ready ? 1 : 0.6);
  };
  useEffect(() => {
    announceHeroReady(0.3);
  }, []);
  return (
    <section ref={sectionRef} data-hero className="relative isolate h-[100svh] overflow-hidden bg-night" aria-labelledby="hero-title">
      <div className="absolute inset-0 -z-10">
        <Poster />
        <FrameSequence
          count={HERO_FRAME_COUNT}
          path={pathForViewport}
          onReady={onReady}
          loadingLabel="Setting the scene"
          eager
          cuts={[...HERO_CUTS, HERO_FRAME_COUNT]}
          className="absolute inset-0 h-full"
        />
        <video
          ref={videoRef}
          muted
          playsInline
          loop
          preload="none"
          aria-hidden
          tabIndex={-1}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 will-change-[opacity]"
        >
          {filmForViewport().map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
        <Scrim />
      </div>
      <div className="container-site relative flex h-full flex-col justify-center pb-[max(56px,10vh)] pt-24 md:pb-24">
        <Copy />
      </div>
    </section>
  );
}

/** No pin, no scrubbing: the first frame and the words. */
function StaticHero() {
  useEffect(() => {
    announceHeroReady(1);
  }, []);
  return (
    <section data-hero className="relative isolate min-h-[100svh] overflow-hidden bg-night" aria-labelledby="hero-title">
      <div className="absolute inset-0 -z-10">
        <Poster />
        <Scrim />
      </div>
      <div className="container-site relative flex min-h-[100svh] flex-col justify-center pb-[max(56px,10vh)] pt-24 md:pb-24">
        <Copy />
      </div>
    </section>
  );
}

export function Hero() {
  const reduced = useReducedMotion();
  const mounted = useMounted();
  // The pin inserts a spacer, so the pinned version is never server-rendered
  // and then swapped under ScrollTrigger.
  if (reduced || !mounted) return <StaticHero />;
  return <ScrubbedHero />;
}
