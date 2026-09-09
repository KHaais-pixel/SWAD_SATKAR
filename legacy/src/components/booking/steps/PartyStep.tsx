"use client";
import { PARTY_SIZES } from "@/data/availability";
import { restaurant, telHref } from "@/data/restaurant";
import { Pill } from "../Pill";

export function PartyStep({ value, onChange }: { value: number | null; onChange: (n: number) => void }) {
  const large = value !== null && value > 8;
  return (
    <div>
      <h2 tabIndex={-1} className="text-h3 text-paper outline-none">
        How many of you?
      </h2>
      <p className="mt-2 text-small text-fg-muted">Counting everyone at the table.</p>
      <div role="radiogroup" aria-label="Party size" className="mt-6 flex flex-wrap gap-2">
        {PARTY_SIZES.map((n) => (
          <Pill
            key={n}
            selected={value === n}
            onClick={() => onChange(n)}
            className="w-12 px-0"
            aria-label={`${n} ${n === 1 ? "guest" : "guests"}`}
          >
            {n}
          </Pill>
        ))}
        <Pill selected={large} onClick={() => onChange(9)} aria-label="9 or more guests">
          9+
        </Pill>
      </div>
      {large && (
        <p role="note" className="mt-5 rounded-card border border-hairline bg-ink/50 p-4 text-small text-fg-muted">
          For nine or more we set the room up specially. Leave your details and we&rsquo;ll call you to confirm, or ring
          us on{" "}
          <a href={telHref} className="text-azure underline-offset-4 hover:underline">
            {restaurant.phone}
          </a>
          .
        </p>
      )}
    </div>
  );
}
