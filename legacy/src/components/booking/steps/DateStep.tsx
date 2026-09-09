"use client";
import { useMemo, useState } from "react";
import { BOOKING_WINDOW_DAYS, isClosedOn, toDateKey } from "@/data/availability";
import { useAdminState } from "@/hooks/useAdminState";
import { ArrowIcon } from "@/components/ui/Glyphs";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function DateStep({ value, onChange }: { value: string | null; onChange: (key: string) => void }) {
  const admin = useAdminState();
  const today = useMemo(() => startOfDay(new Date()), []);
  const last = useMemo(() => new Date(today.getFullYear(), today.getMonth(), today.getDate() + BOOKING_WINDOW_DAYS), [today]);
  const [cursor, setCursor] = useState(() => {
    const base = value ? new Date(value) : today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const canPrev = cursor > new Date(today.getFullYear(), today.getMonth(), 1);
  const canNext = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) <= last;

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const lead = first.getDay();
    const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
    for (let i = 1; i <= count; i++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), i));
    return cells;
  }, [cursor]);

  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div>
      <h2 tabIndex={-1} className="text-h3 text-paper outline-none">Which day?</h2>
      <p className="mt-2 text-small text-fg-muted">We take bookings up to {BOOKING_WINDOW_DAYS} days ahead.</p>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          disabled={!canPrev}
          aria-label="Previous month"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-hairline hover:border-azure disabled:opacity-30"
        >
          <ArrowIcon direction="left" className="h-4 w-4" />
        </button>
        <p className="font-display text-[1.25rem] text-paper" aria-live="polite">
          {monthLabel}
        </p>
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          disabled={!canNext}
          aria-label="Next month"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-hairline hover:border-azure disabled:opacity-30"
        >
          <ArrowIcon className="h-4 w-4" />
        </button>
      </div>

      <div role="grid" aria-label={`Calendar, ${monthLabel}`} className="mt-4">
        <div role="row" className="grid grid-cols-7 text-center text-eyebrow uppercase tracking-[0.14em] text-fg-muted">
          {WEEKDAYS.map((w) => (
            <span key={w} role="columnheader" className="py-2">
              {w}
            </span>
          ))}
        </div>
        <div role="row" className="grid grid-cols-7 gap-y-1">
          {days.map((d, i) => {
            if (!d) return <span key={`pad-${i}`} role="gridcell" aria-hidden />;
            const key = toDateKey(d);
            const past = d < today;
            const beyond = d > last;
            const closed = isClosedOn(d) || admin.closedDates.includes(key);
            const disabled = past || beyond || closed;
            const isToday = d.getTime() === today.getTime();
            const selected = value === key;
            return (
              <span key={key} role="gridcell" className="flex justify-center">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(key)}
                  aria-pressed={selected}
                  aria-label={`${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}${isToday ? ", today" : ""}${closed ? ", closed" : ""}`}
                  className={cn(
                    "relative h-10 w-10 rounded-full text-[0.9375rem] tabular-nums transition-colors duration-[var(--dur-micro)]",
                    selected ? "bg-azure text-ink" : "text-fg hover:bg-char",
                    isToday && !selected && "ring-1 ring-azure",
                    disabled && "cursor-not-allowed text-fg-muted/40 hover:bg-transparent",
                    closed && !past && "line-through decoration-alert/80",
                  )}
                >
                  {d.getDate()}
                </button>
              </span>
            );
          })}
        </div>
      </div>
      <p className="mt-4 text-[0.8125rem] text-fg-muted/80">Today is ringed. Struck-out dates are closed.</p>
    </div>
  );
}
