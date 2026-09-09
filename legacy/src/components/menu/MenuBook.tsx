"use client";
import Link from "next/link";
import { useCallback, useEffect, useId } from "react";
import { MENU_TURN_EVENT } from "@/hooks/useMenuArrival";
import { menuPages } from "@/data/menu";
import { useBookTurn } from "@/hooks/useBookTurn";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ArrowIcon } from "@/components/ui/Glyphs";
import { cn } from "@/lib/cn";
import { PageFace } from "./PageFace";

const total = menuPages.length;

/** Both leaf faces: culled when they turn away, lifted with a box-shadow. */
const FACE_STYLE: React.CSSProperties = {
  backfaceVisibility: "hidden",
  WebkitBackfaceVisibility: "hidden",
  boxShadow: "0 18px 26px -12px rgb(0 0 0 / 0.5)",
};
const pageAt = (i: number) => (i >= 0 && i < total ? menuPages[i] : null);

/** Stacked page-edge slivers so the book reads as thick. */
function EdgeStack({ side }: { side: "left" | "right" }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-y-[3px]", side === "left" ? "right-full" : "left-full")}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="absolute inset-y-0 w-[2px]"
          style={{
            [side === "left" ? "right" : "left"]: `${i * 2}px`,
            top: `${i * 1.5}px`,
            bottom: `${i * 1.5}px`,
            opacity: 0.95 - i * 0.2,
            background: "var(--menu-gold-dim)",
            boxShadow: "0 0 0 0.5px rgb(2 8 22 / 0.6)",
          }}
        />
      ))}
    </div>
  );
}

function Spine() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-1/2 z-[21] w-[28px] -translate-x-1/2"
      style={{
        background:
          "linear-gradient(90deg, transparent 0%, rgb(2 8 22 / 0.35) 30%, rgb(2 8 22 / 0.75) 50%, rgb(2 8 22 / 0.35) 70%, transparent 100%)",
      }}
    />
  );
}

export function MenuBook() {
  const reduced = useReducedMotion();
  const isSpread = useMediaQuery("(min-width: 768px)", true);
  const perView: 1 | 2 = isSpread ? 2 : 1;
  const regionId = useId();

  const labelFor = useCallback(
    (view: number) => {
      if (perView === 1) {
        const p = pageAt(view);
        return `Page ${view + 1} of ${total}: ${p?.label ?? ""}`;
      }
      const l = pageAt(view * 2);
      const r = pageAt(view * 2 + 1);
      const names = [l?.label, r?.label].filter(Boolean).join(" and ");
      return r ? `Pages ${view * 2 + 1} and ${view * 2 + 2} of ${total}: ${names}` : `Page ${view * 2 + 1} of ${total}: ${names}`;
    },
    [perView],
  );

  const book = useBookTurn({ pageCount: total, perView, reduced, labelFor });
  // The arrival scrub asks for a spread; the book's own queue turns to it.
  useEffect(() => {
    const onTurn = (e: Event) => book.scrubTo((e as CustomEvent<number>).detail);
    window.addEventListener(MENU_TURN_EVENT, onTurn);
    return () => window.removeEventListener(MENU_TURN_EVENT, onTurn);
  }, [book]);
  const { view, viewCount, turning, refs, handlers } = book;

  // Which page indexes are on the table right now
  let leftIdx: number | null;
  let rightIdx: number | null;
  let leafFront: number | null = null;
  let leafBack: number | null = null;

  if (perView === 2) {
    leftIdx = view * 2;
    rightIdx = view * 2 + 1;
    if (turning?.dir === 1) {
      leafFront = rightIdx;
      leafBack = view * 2 + 2;
      rightIdx = view * 2 + 3;
    } else if (turning?.dir === -1) {
      leafFront = leftIdx;
      leafBack = view * 2 - 1;
      leftIdx = view * 2 - 2;
    }
  } else {
    leftIdx = null;
    rightIdx = view;
    if (turning?.dir === 1) {
      leafFront = view;
      rightIdx = view + 1;
    } else if (turning?.dir === -1) {
      leafFront = view - 1;
    }
  }

  const leafOnRight = perView === 1 || turning?.dir === 1;

  return (
    <div className="relative">
      {/* Live region announces the open page after every turn */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {book.announcement}
      </p>

      <div className="flex items-center gap-3 md:gap-6">
        <button
          type="button"
          onClick={book.prev}
          disabled={!book.canPrev}
          aria-label="Previous page"
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-hairline text-fg transition-colors duration-[var(--dur-micro)] hover:border-azure hover:text-azure disabled:opacity-30 md:inline-flex"
        >
          <ArrowIcon direction="left" />
        </button>

        {/* The table under the book: perspective lives here */}
        <div
          data-book-stage
          className="relative mx-auto w-full max-w-[1000px] will-change-transform"
          style={{ perspective: "2400px", perspectiveOrigin: "50% 40%" }}
        >
          {/* Contact shadow on the table */}
          <div
            aria-hidden
            className="absolute inset-x-[4%] -bottom-6 h-16 rounded-[50%] bg-ink"
            style={{ filter: "blur(28px)", opacity: 0.9, transform: "translateY(10px)" }}
          />

          <div
            ref={refs.bookRef}
            id={regionId}
            role="region"
            aria-roledescription="menu book"
            data-views={viewCount}
            aria-label="Menu book, a visual page-turning menu. Use the left and right arrow keys to turn pages; the full menu in plain text is below."
            tabIndex={0}
            onKeyDown={handlers.onKeyDown}
            onPointerDown={handlers.onPointerDown}
            onPointerMove={handlers.onPointerMove}
            onPointerUp={handlers.onPointerUp}
            onPointerCancel={handlers.onPointerCancel}
            className={cn(
              "relative isolate select-none touch-pan-y",
              perView === 2 ? "aspect-[3/2]" : "aspect-[3/4] max-w-[440px] mx-auto",
            )}
            style={{ transformStyle: "preserve-3d", boxShadow: "36px 48px 80px -30px rgb(0 0 0 / 0.85), 0 0 0 1px rgb(4 20 31 / 0.6)" }}
          >
            {/* Static pages */}
            {perView === 2 && (
              <div className="absolute inset-y-0 left-0 w-1/2">
                <EdgeStack side="left" />
                {reduced ? (
                  <div key={leftIdx} className="page-fade h-full">
                    <PageFace page={pageAt(leftIdx ?? -1)} side="left" number={(leftIdx ?? 0) + 1} total={total} inert />
                  </div>
                ) : (
                  <PageFace page={pageAt(leftIdx ?? -1)} side="left" number={(leftIdx ?? 0) + 1} total={total} inert />
                )}
                <div ref={refs.leftShadowRef} aria-hidden className="pointer-events-none absolute inset-0 z-[3] opacity-0" style={{ background: "linear-gradient(270deg, rgb(4 20 31 / 0.55), rgb(4 20 31 / 0.2) 45%, transparent 85%)" }} />
              </div>
            )}

            <div className={cn("absolute inset-y-0", perView === 2 ? "right-0 w-1/2" : "inset-x-0")}>
              <EdgeStack side="right" />
              {reduced ? (
                <div key={rightIdx} className="page-fade h-full">
                  <PageFace page={pageAt(rightIdx ?? -1)} side={perView === 2 ? "right" : "single"} number={(rightIdx ?? 0) + 1} total={total} inert />
                </div>
              ) : (
                <PageFace page={pageAt(rightIdx ?? -1)} side={perView === 2 ? "right" : "single"} number={(rightIdx ?? 0) + 1} total={total} inert />
              )}
              <div ref={refs.rightShadowRef} aria-hidden className="pointer-events-none absolute inset-0 z-[3] opacity-0" style={{ background: "linear-gradient(90deg, rgb(4 20 31 / 0.55), rgb(4 20 31 / 0.2) 45%, transparent 85%)" }} />
            </div>

            {perView === 2 && <Spine />}

            {/* The leaf in flight */}
            {turning && !reduced && (
              <div
                ref={refs.leafRef}
                aria-hidden
                data-half="first"
                className={cn(
                  "menu-leaf absolute inset-y-0 will-change-transform",
                  perView === 2 ? "w-1/2" : "inset-x-0",
                  perView === 2 && leafOnRight && "left-1/2 origin-left",
                  perView === 2 && !leafOnRight && "left-0 origin-right",
                  perView === 1 && "origin-left",
                )}
                style={
                  {
                    transformStyle: "preserve-3d",
                    "--hl-x": "100%",
                    "--hl-a": "0",
                  } as React.CSSProperties
                }
              >
                {/* No `filter` on this element: a filter is a grouping property,
                    which forces transform-style to flat, collapses the 3D
                    context and stops backface-visibility culling the front
                    face. The result is a mirrored page mid-turn. The lift is a
                    box-shadow on each face instead. */}
                {/* Front face */}
                <div className="absolute inset-0" style={FACE_STYLE}>
                  <PageFace page={pageAt(leafFront ?? -1)} side={perView === 2 ? (leafOnRight ? "right" : "left") : "single"} number={(leafFront ?? 0) + 1} total={total} inert />
                  <div className="leaf-highlight" />
                </div>
                {/* Back face */}
                <div className="absolute inset-0" style={{ ...FACE_STYLE, transform: "rotateY(180deg)" }}>
                  <PageFace page={pageAt(leafBack ?? -1)} side={perView === 2 ? (leafOnRight ? "left" : "right") : "single"} number={(leafBack ?? 0) + 1} total={total} inert />
                  <div className="leaf-highlight" />
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={book.next}
          disabled={!book.canNext}
          aria-label="Next page"
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-hairline text-fg transition-colors duration-[var(--dur-micro)] hover:border-azure hover:text-azure disabled:opacity-30 md:inline-flex"
        >
          <ArrowIcon direction="right" />
        </button>
      </div>

      {/* Mobile controls + indicator */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <button type="button" onClick={book.prev} disabled={!book.canPrev} aria-label="Previous page" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-hairline text-fg disabled:opacity-30 md:hidden">
          <ArrowIcon direction="left" />
        </button>
        <div role="tablist" aria-label="Menu pages" className="flex max-w-full flex-wrap items-center justify-center">
          {Array.from({ length: viewCount }, (_, i) => {
            const label = perView === 2 ? [pageAt(i * 2)?.label, pageAt(i * 2 + 1)?.label].filter(Boolean).join(" and ") : pageAt(i)?.label;
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === view}
                aria-label={`Go to ${label}`}
                onClick={() => book.goTo(i)}
                className="group flex h-11 w-6 items-center justify-center"
              >
                {/* 44px hit area, small azure mark inside */}
                <span
                  aria-hidden
                  className={cn(
                    "block h-[6px] rounded-full bg-azure transition-[width,opacity] duration-[var(--dur-std)] ease-[var(--ease-out-expo)]",
                    i === view ? "w-7 opacity-100" : "w-[6px] opacity-45 group-hover:opacity-80",
                  )}
                />
              </button>
            );
          })}
        </div>
        <button type="button" onClick={book.next} disabled={!book.canNext} aria-label="Next page" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-hairline text-fg disabled:opacity-30 md:hidden">
          <ArrowIcon direction="right" />
        </button>
      </div>

      {/* The same menu as a list, further down the page: no pin to fight, prints cleanly */}
      <div className="mt-8 text-center">
        <Link href="#list" className="text-small text-fg-muted underline-offset-4 hover:text-azure hover:underline">
          View as a plain list
        </Link>
      </div>
    </div>
  );
}
