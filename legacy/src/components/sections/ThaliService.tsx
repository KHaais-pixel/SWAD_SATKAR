"use client";
import Image from "next/image";
import { restaurant } from "@/data/restaurant";
import { FRAME_COUNT, framePath, thaliStages } from "@/data/thali";
import { FrameSequence } from "@/components/sequence/FrameSequence";
import { useThaliService } from "@/hooks/useThaliService";
import { useMounted } from "@/hooks/useMounted";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";

/**
 * One thali, served course by course as the guest scrolls. The plate never
 * leaves the screen: scroll position picks the frame, so moving down serves
 * the next course and moving up takes it away again.
 */

/** The seven captions, stacked so only one shows at a time. */
function Captions() {
  return (
    <div className="relative mt-8 h-[8.5rem] sm:h-[7.5rem]">
      {thaliStages.map((s, i) => (
        <div key={s.n} data-stage={i} aria-hidden className="absolute inset-x-0 top-0 will-change-transform">
          <p className="text-[0.75rem] font-medium tracking-[0.28em] text-azure">{s.n}</p>
          <h3 className="text-h3 mt-2 text-paper">{s.title}</h3>
          <p className="mt-2 max-w-[32ch] text-fg-muted">{s.line}</p>
        </div>
      ))}
    </div>
  );
}

/** The thin cyan line with a numbered tick per course. */
function ProgressRail({ current }: { current: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 md:bottom-8">
      <div className="container-site">
        <ol className="flex items-end gap-2 sm:gap-3">
          {thaliStages.map((s, i) => (
            <li key={s.n} data-tick={i} className="flex-1" aria-current={i === current ? "step" : undefined}>
              <span
                className={cn(
                  "mb-2 block text-[0.625rem] tracking-[0.2em] transition-colors duration-[var(--dur-std)]",
                  i === current ? "text-azure" : "text-fg-muted/60",
                )}
              >
                {s.n}
              </span>
              <span aria-hidden className="block h-px w-full overflow-hidden bg-hairline">
                <span data-tick-fill={i} className="block h-full w-full bg-azure" />
              </span>
              <span className="sr-only">{s.title}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- scrubbed version */

function ServedByScroll() {
  const { sectionRef, stage, onSequenceReady } = useThaliService();

  return (
    <section
      ref={sectionRef}
      id="thali"
      className="relative isolate h-[100svh] overflow-hidden bg-transparent scroll-mt-16"
      aria-labelledby="thali-title"
    >
      <div
        aria-hidden
        data-parallax
        className="absolute inset-0 -z-10"
        style={{ background: "radial-gradient(80% 65% at 24% 10%, rgb(15 159 224 / 0.12), transparent 62%)" }}
      />

      <div className="container-site grid h-full grid-cols-1 items-center gap-4 md:grid-cols-12 md:gap-4">
        {/* the brand stays put while the plate fills */}
        <div className="md:col-span-4">
          <h2 id="thali-title" className="text-h2 max-w-[14ch] text-paper">
            The Thakali thali, course by course.
          </h2>
          <Captions />
          <p className="mt-6 hidden text-small text-fg-muted md:block">
            {restaurant.name}, {restaurant.address.locality}
          </p>
        </div>

        <div className="relative flex items-center justify-center md:col-span-8">
          {/* the light the plate sits in */}
          <div
            aria-hidden
            data-plate-glow
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[min(110vw,80vh)] w-[min(110vw,80vh)] -translate-x-1/2 -translate-y-1/2 rounded-full md:h-[min(70vw,110vh)] md:w-[min(70vw,110vh)]"
            style={{
              background:
                "radial-gradient(closest-side, color-mix(in srgb, var(--menu-gold) 16%, transparent), color-mix(in srgb, var(--azure) 8%, transparent) 50%, transparent 100%)",
            }}
          />
          <div data-plate-shift className="w-[min(88vw,56vh)] will-change-transform md:w-[min(56vw,calc(100svh-8.5rem))]">
            <div
              className="aspect-square"
              style={{
                maskImage: "radial-gradient(circle at 50% 50%, #000 58%, rgb(0 0 0 / 0.55) 72%, transparent 84%)",
                WebkitMaskImage: "radial-gradient(circle at 50% 50%, #000 58%, rgb(0 0 0 / 0.55) 72%, transparent 84%)",
              }}
            >
              <FrameSequence count={FRAME_COUNT} path={framePath} onReady={onSequenceReady} loadingLabel="Setting the table" className="aspect-square" />
            </div>
          </div>
        </div>
      </div>

      {/* what a screen reader hears as the courses arrive */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {thaliStages[stage]?.n} {thaliStages[stage]?.title}. {thaliStages[stage]?.line}
      </p>

      <ProgressRail current={stage} />
    </section>
  );
}

/* --------------------------------------------------------- static version */

/** No pin, no scrubbing: the finished thali and the whole story at once. */
function ServedStatic() {
  return (
    <section id="thali" className="section-y relative bg-transparent scroll-mt-16" aria-labelledby="thali-title-s">
      <div className="container-site grid grid-cols-1 items-center gap-12 md:grid-cols-12 md:gap-6">
        <div className="md:col-span-5">
          <h2 id="thali-title-s" className="text-h2 max-w-[14ch] text-paper">
            The Thakali thali, course by course.
          </h2>
          <ol className="mt-8 space-y-5">
            {thaliStages.map((s) => (
              <li key={s.n}>
                <p className="text-[0.75rem] font-medium tracking-[0.28em] text-azure">{s.n}</p>
                <h3 className="font-display text-[1.25rem] text-paper">{s.title}</h3>
                <p className="text-small text-fg-muted">{s.line}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex items-center justify-center md:col-span-7">
          <div className="w-[min(80vw,520px)]">
            <Image
              src={framePath(FRAME_COUNT - 1)}
              alt="A complete Thakali thali: rice, dal, curry, curd, papad, greens and pickles on a brass plate."
              width={640}
              height={640}
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ThaliService() {
  const reduced = useReducedMotion();
  const mounted = useMounted();
  // The pin inserts a spacer into the DOM, so it must not be server-rendered
  // and then swapped: React and ScrollTrigger would fight over the node.
  if (reduced || !mounted) return <ServedStatic />;
  return <ServedByScroll />;
}
