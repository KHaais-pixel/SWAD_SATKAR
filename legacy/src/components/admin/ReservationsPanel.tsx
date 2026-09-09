"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminClient } from "@/lib/adminClient";
import { statusLabel, occasionLabel, seatingLabel, type Booking, type BookingStatus } from "@/lib/booking-types";
import { formatTime } from "@/lib/hours";
import { toDateKey } from "@/data/availability";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Range = "today" | "upcoming" | "past" | "all";

const rangeLabel: Record<Range, string> = {
  today: "Today",
  upcoming: "Upcoming",
  past: "Past",
  all: "All",
};

const statusChip: Record<BookingStatus, string> = {
  confirmed: "border-azure/60 text-azure",
  seated: "border-basil/70 text-basil",
  no_show: "border-alert/60 text-alert",
  cancelled: "border-hairline text-fg-muted",
};

const csvEscape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

function exportCsv(rows: Booking[]) {
  const head = ["Reference", "Date", "Time", "Party", "Name", "Phone", "Email", "Seating", "Occasion", "Status", "Notes"];
  const body = rows.map((b) =>
    [
      b.reference,
      b.date,
      b.time,
      String(b.party),
      b.name,
      b.phone,
      b.email,
      b.seating ? seatingLabel[b.seating] : "",
      occasionLabel[b.occasion],
      statusLabel[b.status],
      b.notes,
    ]
      .map(csvEscape)
      .join(","),
  );
  const blob = new Blob([[head.join(","), ...body].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `swad-satkar-reservations-${toDateKey(new Date())}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ReservationsPanel() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [range, setRange] = useState<Range>("upcoming");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const load = useCallback(() => adminClient.listBookings().then(setBookings), []);
  useEffect(() => {
    load();
  }, [load]);

  const today = toDateKey(new Date());

  const rows = useMemo(() => {
    if (!bookings) return [];
    const q = query.trim().toLowerCase();
    return bookings
      .filter((b) => {
        if (range === "today") return b.date === today;
        if (range === "upcoming") return b.date >= today;
        if (range === "past") return b.date < today;
        return true;
      })
      .filter((b) =>
        q ? [b.reference, b.name, b.phone, b.email].some((f) => f.toLowerCase().includes(q)) : true,
      )
      .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
  }, [bookings, range, query, today]);

  const covers = rows.filter((b) => b.status === "confirmed" || b.status === "seated").reduce((n, b) => n + b.party, 0);

  const act = async (ref: string, fn: () => Promise<Booking[]>) => {
    setBusy(ref);
    setBookings(await fn());
    setBusy(null);
  };

  if (!bookings) return <p className="text-small text-fg-muted">Loading reservations…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Reservations</p>
          <p className="mt-2 text-small text-fg-muted">
            {rows.length} {rows.length === 1 ? "booking" : "bookings"} · {covers} {covers === 1 ? "cover" : "covers"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => exportCsv(rows)} disabled={rows.length === 0}>
            Export CSV
          </Button>
          <Button size="sm" variant="ghost" onClick={load}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Date range" className="flex flex-wrap gap-2">
          {(Object.keys(rangeLabel) as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={range === r}
              onClick={() => setRange(r)}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border px-4 text-small transition-colors duration-[var(--dur-micro)]",
                range === r ? "border-azure bg-azure text-ink" : "border-hairline text-fg hover:border-azure",
              )}
            >
              {rangeLabel[r]}
            </button>
          ))}
        </div>
        <label className="flex-1 min-w-[220px]">
          <span className="sr-only">Search reservations</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, email or reference"
            className="w-full rounded-card border border-hairline bg-ink/40 px-4 py-3 text-small text-paper placeholder:text-fg-muted/60 focus-visible:border-azure"
          />
        </label>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 text-small text-fg-muted">
          No reservations in this view. Bookings made in this browser appear here.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-hairline/60">
          {rows.map((b) => (
            <li key={b.reference} className={cn("py-4", b.status === "cancelled" && "opacity-60")}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-[220px]">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-[1.125rem] text-paper">{b.name}</span>
                    <span
                      className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[0.75rem]", statusChip[b.status])}
                    >
                      {statusLabel[b.status]}
                    </span>
                  </p>
                  <p className="mt-1 text-small text-fg-muted">
                    {new Date(b.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} ·{" "}
                    {formatTime(b.time)} · {b.party} {b.party === 1 ? "guest" : "guests"}
                    {b.seating ? ` · ${seatingLabel[b.seating]}` : ""}
                    {b.occasion !== "none" ? ` · ${occasionLabel[b.occasion]}` : ""}
                  </p>
                  <p className="mt-1 text-small text-fg-muted">
                    <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} className="hover:text-paper">
                      {b.phone}
                    </a>
                    {" · "}
                    <a href={`mailto:${b.email}`} className="hover:text-paper">
                      {b.email}
                    </a>
                    {" · "}
                    <span className="text-azure">{b.reference}</span>
                  </p>
                  {b.notes && <p className="mt-1 max-w-[52ch] text-small text-fg-muted">Note: {b.notes}</p>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {b.status !== "seated" && b.status !== "cancelled" && (
                    <Button size="sm" variant="ghost" disabled={busy === b.reference} onClick={() => act(b.reference, () => adminClient.setBookingStatus(b.reference, "seated"))}>
                      Seat
                    </Button>
                  )}
                  {b.status !== "no_show" && b.status !== "cancelled" && (
                    <Button size="sm" variant="ghost" disabled={busy === b.reference} onClick={() => act(b.reference, () => adminClient.setBookingStatus(b.reference, "no_show"))}>
                      No show
                    </Button>
                  )}
                  {b.status !== "cancelled" && (
                    <Button size="sm" variant="ghost" disabled={busy === b.reference} onClick={() => act(b.reference, () => adminClient.setBookingStatus(b.reference, "cancelled"))}>
                      Cancel
                    </Button>
                  )}
                  {b.status === "cancelled" && (
                    <Button size="sm" variant="ghost" disabled={busy === b.reference} onClick={() => act(b.reference, () => adminClient.setBookingStatus(b.reference, "confirmed"))}>
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 border-t border-hairline pt-4">
        {confirmClear ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-small text-paper">Delete every reservation stored in this browser?</p>
            <Button
              size="sm"
              onClick={async () => {
                await adminClient.clearAllBookings();
                setConfirmClear(false);
                load();
              }}
            >
              Delete all
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmClear(false)}>
              Keep them
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="text-small text-alert underline-offset-4 hover:underline"
          >
            Clear demo reservations
          </button>
        )}
      </div>
    </div>
  );
}
