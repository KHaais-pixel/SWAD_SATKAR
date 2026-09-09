import type { Heat } from "@/data/menu";
import { cn } from "@/lib/cn";

/** Drawn leaf for vegetarian items. */
export function LeafGlyph({ className, title = "Vegetarian" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" className={cn("inline-block", className)} role="img" aria-label={title}>
      <path
        d="M13.5 2.5C8 2.5 3.5 5.5 3 11.5c3.5.5 8-1 10.5-9z"
        fill="var(--basil)"
        stroke="var(--basil)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path d="M3.2 12.8c2-3 4.5-5.5 7.5-7.5" stroke="var(--paper)" strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const heatLabel: Record<Heat, string> = { 0: "", 1: "Mild", 2: "Medium heat", 3: "Hot" };

/** One to three drawn chilies. */
export function HeatGlyph({ level, className }: { level: Heat; className?: string }) {
  if (!level) return null;
  return (
    <span role="img" aria-label={heatLabel[level]} className={cn("inline-flex items-center gap-[1px]", className)}>
      {Array.from({ length: level }, (_, i) => (
        <svg key={i} viewBox="0 0 12 16" width="9" height="12" aria-hidden>
          <path
            d="M7.5 1.2c.3 1.2-.2 2.3-1 3.1M6.6 4.3C3 5 1.5 8.5 2.2 11.2c.6 2.3 2.6 3.7 4.3 3.3 1.7-.4 2.8-2.4 3.4-4.8.7-2.8.2-5.7-3.3-5.4z"
            fill="var(--chili)"
            stroke="var(--chili)"
            strokeWidth="0.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path d="M7.5 1.2c.3 1.2-.2 2.3-1 3.1" fill="none" stroke="var(--basil)" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ))}
    </span>
  );
}

/** Two lines that become a cross: the phone navigation toggle. */
export function NavIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
    </svg>
  );
}

export function ArrowIcon({ direction = "right", className }: { direction?: "left" | "right" | "down"; className?: string }) {
  const rotate = direction === "left" ? 180 : direction === "down" ? 90 : 0;
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden
      className={className}
      style={{ transform: `rotate(${rotate}deg)` }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h16M13 5l7 7-7 7" />
    </svg>
  );
}

export function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
