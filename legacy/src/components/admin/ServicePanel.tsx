"use client";
import { useMemo, useState } from "react";
import { BOOKING_WINDOW_DAYS, closedWeekdays, toDateKey } from "@/data/availability";
import { restaurant } from "@/data/restaurant";
import { adminClient } from "@/lib/adminClient";
import { useAdminState } from "@/hooks/useAdminState";
import { formatTime } from "@/lib/hours";
import { ArrowIcon } from "@/components/ui/Glyphs";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Closing days for festivals and private events, plus the service reference. */
export function ServicePanel() {
  const state = useAdminState();
  const today = useMemo(() => startOfDay(new Date()), []);
  const last = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate() + BOOKING_WINDOW_DAYS),
    [today],
  );
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const canPrev = cursor > new Date(today.getFullYear(), today.getMonth(), 1);
  const canNext = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) <= last;

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = Array.from({ length: first.getDay() }, () => null);
    for (let i = 1; i <= count; i++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), i));
    return cells;
  }, [cursor]);

  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <section aria-labelledby="closed-days">
        <p className="eyebrow">Service</p>
        <h3 id="closed-days" className="text-h3 mt-2 text-paper">
          Closing days
        </h3>
        <p className="mt-3 max-w-[46ch] text-small text-fg-muted">
          Click a date to close it. Closed dates disappear from the booking calendar immediately.
        </p>

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

        <div role="grid" aria-label={`Closing days, ${monthLabel}`} className="mt-4 max-w-[380px]">
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
              const weekdayClosed = closedWeekdays.includes(d.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6);
              const closed = state.closedDates.includes(key) || weekdayClosed;
              return (
                <span key={key} role="gridcell" className="flex justify-center">
                  <button
                    type="button"
                    disabled={past || beyond || weekdayClosed}
                    onClick={() => adminClient.toggleClosedDate(key)}
                    aria-pressed={closed}
                    aria-label={`${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}${closed ? ", closed" : ", open"}`}
                    className={cn(
                      "h-10 w-10 rounded-full text-[0.9375rem] tabular-nums transition-colors duration-[var(--dur-micro)]",
                      closed ? "bg-alert/20 text-alert line-through" : "text-fg hover:bg-char",
                      (past || beyond) && "cursor-not-allowed text-fg-muted/40 hover:bg-transparent",
                    )}
                  >
                    {d.getDate()}
                  </button>
                </span>
              );
            })}
          </div>
        </div>

        {state.closedDates.length > 0 && (
          <div className="mt-6">
            <p className="eyebrow mb-2">Closed</p>
            <ul className="flex flex-wrap gap-2">
              {state.closedDates.map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => adminClient.toggleClosedDate(key)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-alert/50 px-3 text-small text-alert hover:border-alert"
                  >
                    {new Date(key).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    <span aria-hidden>×</span>
                    <span className="sr-only">Reopen this date</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section aria-labelledby="service-ref">
        <p className="eyebrow">Reference</p>
        <h3 id="service-ref" className="text-h3 mt-2 text-paper">
          Current service
        </h3>
        <p className="mt-3 max-w-[46ch] text-small text-fg-muted">
          These come from <code className="text-azure">src/data/restaurant.ts</code> and are not editable here yet, since
          changing them needs a deploy.
        </p>

        <dl className="mt-6 divide-y divide-hairline/60 text-small">
          {[
            ["Lunch", `${formatTime(restaurant.services.lunch.start)} to ${formatTime(restaurant.services.lunch.end)}`],
            ["Dinner", `${formatTime(restaurant.services.dinner.start)} to ${formatTime(restaurant.services.dinner.end)}`],
            ["Opening hours", restaurant.hoursSummary],
            ["Happy hour", restaurant.happyHour.window],
            ["Booking window", `${BOOKING_WINDOW_DAYS} days ahead`],
            ["Phone", restaurant.phone],
            ["Second line", restaurant.phoneSecondary],
            ["Email", restaurant.email ?? "none"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-fg-muted">{k}</dt>
              <dd className="text-right text-paper">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
