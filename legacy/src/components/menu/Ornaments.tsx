/**
 * The gold furniture from the restaurant's printed menu cards: a double rule
 * around the page, filigree in the corners, a notched banner behind every
 * section heading, and the Himalaya along the foot. All decorative.
 */
import { cn } from "@/lib/cn";

/** One corner flourish, drawn for the top-left and mirrored for the rest. */
function CornerFiligree({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 72" className={cn("h-10 w-10", className)} fill="none" aria-hidden>
      <g stroke="var(--menu-gold-dim)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        {/* the sweep that follows the corner */}
        <path d="M4 40C4 20 20 4 40 4" />
        {/* inner scroll, curling back on itself */}
        <path d="M12 40c0-15 13-28 28-28" strokeWidth="1" opacity="0.7" />
        <path d="M40 12c-8 0-13 5-13 11 0 4 3 7 7 7 3 0 5-2 5-5 0-2.5-2-4-4-4" />
        <path d="M12 40c0 8 5 13 11 13 4 0 7-3 7-7 0-3-2-5-5-5-2.5 0-4 2-4 4" />
        {/* leaf pair */}
        <path d="M44 22c5-4 11-4 15-1-4 4-10 5-15 1z" />
        <path d="M22 44c-4 5-4 11-1 15 4-4 5-10 1-15z" />
      </g>
      <circle cx="41" cy="41" r="1.8" fill="var(--menu-gold)" />
    </svg>
  );
}

/** The double gold rule plus the four corners. */
export function PageFrame() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <span className="absolute inset-[9px] rounded-[2px] border border-[var(--menu-rule)]" />
      <span className="absolute inset-[15px] rounded-[1px] border border-[var(--menu-rule-faint)]" />
      <CornerFiligree className="absolute left-[11px] top-[11px]" />
      <CornerFiligree className="absolute right-[11px] top-[11px] -scale-x-100" />
      <CornerFiligree className="absolute bottom-[11px] left-[11px] -scale-y-100" />
      <CornerFiligree className="absolute bottom-[11px] right-[11px] -scale-100" />
    </div>
  );
}

/**
 * A section heading inside the notched gold banner the cards use. The shape is
 * drawn behind the text so the label stays selectable and readable.
 */
export function SectionBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto mb-2 mt-1 w-fit max-w-full px-7 py-[3px]">
      <svg aria-hidden viewBox="0 0 200 26" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path
          d="M14 1h172l13 12-13 12H14L1 13z"
          fill="none"
          stroke="var(--menu-gold-dim)"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span aria-hidden className="absolute left-[3px] top-1/2 h-[3px] w-[3px] -translate-y-1/2 rotate-45 bg-[var(--menu-gold)]" />
      <span aria-hidden className="absolute right-[3px] top-1/2 h-[3px] w-[3px] -translate-y-1/2 rotate-45 bg-[var(--menu-gold)]" />
      <span className="relative block whitespace-nowrap text-center text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--menu-gold-bright)]">
        {children}
      </span>
    </div>
  );
}

/**
 * The Himalaya along the foot of every page: a filled range with a lit ridge
 * line and snow caps, the same motif as the plaque.
 */
export function MountainFooter() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 56"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-[16px] bottom-[16px] h-14 w-[calc(100%-32px)]"
    >
      {/* far range, sunk into the page */}
      <path
        d="M0 56V38l34-16 26 14 30-20 34 22 28-14 32 20 30-24 34 26 26-16 30 20 32-14 34 18 30-10v22z"
        fill="var(--menu-ridge)"
        opacity="0.55"
      />
      {/* near range */}
      <path
        d="M0 56V44l30-20 28 16 34-26 30 22 26-12 34 24 30-18 28 14 32-22 30 20 28-12 30 18v8z"
        fill="var(--menu-ridge)"
      />
      {/* lit ridge */}
      <path
        d="M0 44l30-20 28 16 34-26 30 22 26-12 34 24 30-18 28 14 32-22 30 20 28-12 30 18"
        fill="none"
        stroke="var(--menu-gold-dim)"
        strokeWidth="1.2"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* snow on the three tallest peaks */}
      <g fill="var(--menu-gold)" opacity="0.85">
        <path d="M92 18l9 7-5 1-4-3-4 3-5-1z" />
        <path d="M212 20l9 7-5 1-4-3-4 3-5-1z" />
        <path d="M312 22l9 7-5 1-4-3-4 3-5-1z" />
      </g>
    </svg>
  );
}
