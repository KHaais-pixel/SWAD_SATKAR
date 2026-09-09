"use client";
import Image from "next/image";
import { dishes } from "@/data/dishes";
import { useDishCarousel } from "@/hooks/useDishCarousel";
import { useMounted } from "@/hooks/useMounted";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * A row of dishes that scroll slides past a fixed centre. Whichever plate is
 * at the centre is the hero: larger, brighter, sharper, lit from behind. Its
 * neighbours stay in view at the edges, dimmer and a little softer, so the
 * row reads as one continuous shelf rather than a set of slides.
 */

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------- scrubbed version */

function ScrolledRow() {
  const { sectionRef, active, goTo } = useDishCarousel();
  const n = dishes.length;

  return (
    <section
      ref={sectionRef}
      id="dishes"
      tabIndex={-1}
      className="relative isolate flex h-[100svh] flex-col overflow-hidden bg-transparent scroll-mt-16 outline-none"
      aria-labelledby="dishes-title"
      aria-roledescription="carousel"
    >
      {/* the light behind the centre */}
      <div
        aria-hidden
        data-glow
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[min(80vw,64vh)] w-[min(80vw,64vh)] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in srgb, var(--azure) 26%, transparent), color-mix(in srgb, var(--paper) 6%, transparent) 55%, transparent 100%)",
        }}
      />

      <div className="container-site pt-24 md:pt-28">
        <h2 id="dishes-title" className="text-h2 max-w-[18ch] text-paper">
          Five plates worth the trip.
        </h2>
      </div>

      {/* the row */}
      <div className="relative flex-1">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
          <ul data-track className="flex list-none items-center gap-[6vw] pl-0 will-change-transform md:gap-[4vw]" aria-label="Dishes">
            {dishes.map((d, i) => (
              <li
                key={d.slug}
                data-card={i}
                className="relative aspect-square w-[62vw] shrink-0 will-change-[transform,filter] md:w-[min(34vw,520px,56vh)]"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${n}: ${d.name}`}
                aria-current={i === active ? "true" : undefined}
              >
                {/* the floor it sits on */}
                <span
                  aria-hidden
                  data-shadow
                  className="absolute bottom-[4%] left-1/2 h-[9%] w-[74%] -translate-x-1/2 rounded-[100%] bg-ink-deep blur-xl"
                />
                <div data-img className="relative h-full w-full">
                  <Image
                    src={d.src}
                    alt={d.name}
                    width={d.width}
                    height={d.height}
                    sizes="(min-width: 768px) 34vw, 62vw"
                    // fetched at once, but without a preload link: the plate's width
                    // settles after mount, so a preload would ask for the wrong size
                    loading={i < 2 ? "eager" : undefined}
                    className="h-full w-full object-contain drop-shadow-[0_24px_36px_color-mix(in_srgb,var(--ink-deep)_65%,transparent)]"
                    draggable={false}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* caption and controls */}
      <div className="container-site relative pb-8 md:pb-10">
        <div className="relative h-[5.25rem]">
          {dishes.map((d, i) => (
            <div key={d.slug} data-caption={i} aria-hidden className="absolute inset-x-0 top-0 text-center will-change-transform">
              <h3 className="font-display text-[1.5rem] leading-tight text-paper md:text-[1.85rem]">{d.name}</h3>
              <p className="mx-auto mt-1 text-small text-fg-muted">{d.line}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            aria-label="Previous dish"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-hairline text-paper transition-colors duration-[var(--dur-std)] hover:border-azure hover:text-azure disabled:opacity-40 disabled:hover:border-hairline disabled:hover:text-paper"
          >
            <Arrow dir="left" />
          </button>
          <span className="min-w-[4ch] text-center text-[0.75rem] tracking-[0.28em] text-fg-muted" aria-hidden>
            {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            disabled={active === n - 1}
            aria-label="Next dish"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-hairline text-paper transition-colors duration-[var(--dur-std)] hover:border-azure hover:text-azure disabled:opacity-40 disabled:hover:border-hairline disabled:hover:text-paper"
          >
            <Arrow dir="right" />
          </button>
        </div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {dishes[active]?.name}. {dishes[active]?.line}
        </p>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- static version */

/** No pin, no scrubbing: a plain strip that scrolls and snaps sideways. */
function StaticRow() {
  return (
    <section id="dishes" className="section-y relative bg-transparent scroll-mt-16" aria-labelledby="dishes-title-s">
      <div className="container-site">
        <h2 id="dishes-title-s" className="text-h2 max-w-[18ch] text-paper">
          Five plates worth the trip.
        </h2>
      </div>
      <div
        className="mt-10 flex snap-x snap-mandatory gap-8 overflow-x-auto px-[max(1rem,calc((100vw-1240px)/2))] pb-6"
        tabIndex={0}
        role="region"
        aria-label="Dishes"
      >
        {dishes.map((d) => (
          <figure key={d.slug} className="w-[min(78vw,420px)] shrink-0 snap-center">
            <Image src={d.src} alt="" width={d.width} height={d.height} sizes="(min-width: 768px) 420px, 78vw" className="aspect-square h-auto w-full object-contain" />
            <figcaption className="mt-4 text-center">
              <h3 className="font-display text-[1.35rem] text-paper">{d.name}</h3>
              <p className="mx-auto mt-1 text-small text-fg-muted">{d.line}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function DishCarousel() {
  const reduced = useReducedMotion();
  const mounted = useMounted();
  // The pin inserts a spacer, so the pinned version must not be server
  // rendered and then swapped under ScrollTrigger.
  if (reduced || !mounted) return <StaticRow />;
  return <ScrolledRow />;
}
