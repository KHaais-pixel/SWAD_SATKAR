"use client";
import { useState } from "react";
import { restaurant, whatsappHref } from "@/data/restaurant";
import { occasionLabel, seatingLabel, type Booking } from "@/lib/booking-types";
import { downloadIcs } from "@/lib/ics";
import { formatTime } from "@/lib/hours";
import { Button } from "@/components/ui/Button";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const summaryText = (b: Booking) =>
  `Hello Swad Satkar, reservation ${b.reference}: table for ${b.party} on ${new Date(b.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} at ${formatTime(b.time)} under ${b.name}.`;

function AzureCheck() {
  const reduced = useReducedMotion();
  return (
    <svg viewBox="0 0 64 64" width="72" height="72" aria-hidden className="mx-auto">
      <circle cx="32" cy="32" r="30" fill="none" stroke="var(--azure)" strokeWidth="1.5" strokeDasharray="190" strokeDashoffset={reduced ? 0 : 190} style={{ animation: reduced ? "none" : "draw-check 700ms var(--ease-out-expo) forwards" }} />
      <path d="M20 33l8 8 16-18" fill="none" stroke="var(--glow)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="40" strokeDashoffset={reduced ? 0 : 40} style={{ animation: reduced ? "none" : "draw-check 500ms 350ms var(--ease-out-expo) forwards" }} />
    </svg>
  );
}

export function ConfirmStep({ booking }: { booking: Booking }) {
  const [copied, setCopied] = useState(false);
  const date = new Date(booking.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const share = async () => {
    const text = summaryText(booking);
    if (navigator.share) {
      try {
        await navigator.share({ title: `Reservation ${booking.reference}`, text });
        return;
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="text-center">
      <AzureCheck />
      <p className="eyebrow mt-4">Table held</p>
      <h2 tabIndex={-1} className="text-h3 mt-2 text-paper outline-none">See you {booking.party > 1 ? "all " : ""}on {date.split(",")[0]}.</h2>
      <p className="mt-3 text-small text-fg-muted">
        Reference{" "}
        <span className="font-display text-[1.125rem] tracking-[0.06em] text-glow" style={{ fontVariationSettings: '"opsz" 32, "wght" 500' }}>
          {booking.reference}
        </span>
      </p>

      <dl className="surface-raised mt-6 grid grid-cols-2 gap-x-4 gap-y-3 rounded-card p-5 text-left text-small">
        <div>
          <dt className="eyebrow">When</dt>
          <dd className="mt-1 text-paper">
            {date}
            <br />
            {formatTime(booking.time)}
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Party</dt>
          <dd className="mt-1 text-paper">
            {booking.party} {booking.party === 1 ? "guest" : "guests"}
            {booking.party > 8 && <span className="block text-fg-muted">We&rsquo;ll call to confirm</span>}
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Name</dt>
          <dd className="mt-1 text-paper">{booking.name}</dd>
        </div>
        <div>
          <dt className="eyebrow">Table</dt>
          <dd className="mt-1 text-paper">
            {booking.seating ? seatingLabel[booking.seating] : "Any"} · {occasionLabel[booking.occasion]}
          </dd>
        </div>
        {booking.notes && (
          <div className="col-span-2">
            <dt className="eyebrow">Notes</dt>
            <dd className="mt-1 text-fg-muted">{booking.notes}</dd>
          </div>
        )}
        <div className="col-span-2 border-t border-hairline pt-3 text-fg-muted">
          {restaurant.name}, {restaurant.address.street}, {restaurant.address.locality}
        </div>
      </dl>

      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        <Button size="sm" onClick={() => downloadIcs(booking)}>
          Add to calendar
        </Button>
        <Button size="sm" variant="ghost" onClick={share}>
          {copied ? "Copied" : "Save to wallet / share"}
        </Button>
        <Button size="sm" variant="ghost" href={whatsappHref(summaryText(booking))} target="_blank" rel="noreferrer">
          WhatsApp us
        </Button>
      </div>
      <p className="mt-4 text-[0.8125rem] text-fg-muted/80">
        The calendar file holds two hours. Wallet passes need the restaurant&rsquo;s system; sharing gives you the same summary to keep.
      </p>
    </div>
  );
}
