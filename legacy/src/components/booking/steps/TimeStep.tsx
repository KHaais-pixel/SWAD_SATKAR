"use client";
import { useEffect, useState } from "react";
import { bookingClient } from "@/lib/bookingClient";
import type { Slot } from "@/data/availability";
import { formatTime } from "@/lib/hours";
import { cn } from "@/lib/cn";

interface Props {
  date: string;
  party: number;
  value: string | null;
  onChange: (time: string) => void;
}

export function TimeStep({ date, party, value, onChange }: Props) {
  const [slots, setSlots] = useState<Slot[] | null>(null);

  useEffect(() => {
    let alive = true;
    setSlots(null);
    bookingClient.getAvailability(date, party).then((s) => alive && setSlots(s));
    return () => {
      alive = false;
    };
  }, [date, party]);

  const pretty = new Date(date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  const group = (service: Slot["service"]) => slots?.filter((s) => s.service === service) ?? [];

  const Grid = ({ title, items }: { title: string; items: Slot[] }) => (
    <fieldset className="mt-6">
      <legend className="eyebrow mb-3">{title}</legend>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((s) => {
          const full = s.state === "full";
          const selected = value === s.time;
          return (
            <button
              key={s.time}
              type="button"
              disabled={full}
              onClick={() => onChange(s.time)}
              aria-pressed={selected}
              aria-label={`${formatTime(s.time)}${full ? ", full" : s.state === "few" ? `, ${s.remaining} left` : ""}`}
              className={cn(
                "relative flex min-h-11 flex-col items-center justify-center rounded-full border px-2 text-[0.9375rem] tabular-nums transition-colors duration-[var(--dur-micro)]",
                selected ? "border-azure bg-azure text-ink" : "border-hairline text-fg hover:border-azure",
                full && "cursor-not-allowed border-hairline/50 text-fg-muted/50 line-through hover:border-hairline/50",
              )}
            >
              {formatTime(s.time)}
              {s.state === "few" && !selected && (
                <span className="absolute -top-2 rounded-full bg-azure px-1.5 text-[0.625rem] font-medium uppercase tracking-[0.08em] text-ink" aria-hidden>
                  {s.remaining} left
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );

  return (
    <div>
      <h2 tabIndex={-1} className="text-h3 text-paper outline-none">What time?</h2>
      <p className="mt-2 text-small text-fg-muted">
        {pretty} · table for {party}
      </p>
      {slots === null ? (
        <div className="mt-8 space-y-3" aria-busy="true" aria-live="polite">
          <p className="sr-only">Checking availability</p>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-full bg-char" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <p className="mt-6 text-fg-muted">We&rsquo;re closed that day. Pick another date.</p>
      ) : (
        <>
          <Grid title="Lunch" items={group("lunch")} />
          <Grid title="Dinner" items={group("dinner")} />
        </>
      )}
    </div>
  );
}
