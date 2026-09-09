"use client";
import { useEffect, useState } from "react";
import { bookingClient } from "@/lib/bookingClient";
import { statusLabel, type Booking } from "@/lib/booking-types";
import { formatTime } from "@/lib/hours";
import { cn } from "@/lib/cn";

export function MyReservations() {
  const [items, setItems] = useState<Booking[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => bookingClient.listBookings().then(setItems);
  useEffect(() => {
    load();
  }, []);

  const cancel = async (ref: string) => {
    setBusy(ref);
    await bookingClient.cancelBooking(ref);
    await load();
    setBusy(null);
  };

  if (!items) return null;
  if (items.length === 0) return <p className="text-small text-fg-muted">No reservations made in this browser yet.</p>;

  return (
    <ul className="divide-y divide-hairline/60">
      {items.map((b) => (
        <li key={b.reference} className={cn("flex items-center justify-between gap-4 py-3", b.status === "cancelled" && "opacity-50")}>
          <div className="text-small">
            <p className="text-paper">
              {new Date(b.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · {formatTime(b.time)} · {b.party}{" "}
              {b.party === 1 ? "guest" : "guests"}
            </p>
            <p className="text-fg-muted">
              {b.reference}
              {b.status !== "confirmed" && ` · ${statusLabel[b.status].toLowerCase()}`}
            </p>
          </div>
          {b.status === "confirmed" && (
            <button
              type="button"
              onClick={() => cancel(b.reference)}
              disabled={busy === b.reference}
              className="text-small text-alert underline-offset-4 hover:underline disabled:opacity-50"
            >
              {busy === b.reference ? "Cancelling…" : "Cancel"}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
