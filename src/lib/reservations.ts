/**
 * The shape of a reservation request and the helpers both ends share.
 *
 * Requests are stored on the server (content/reservations.json, through
 * /api/reservations): a booking made on a guest's telephone has to reach the
 * restaurant, which is exactly what keeping them in the browser's own storage
 * could never do.
 */
export type Status = "pending" | "confirmed" | "seated" | "declined";
export interface Reservation {
  id: string;
  ref: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: string;
  area: string;
  note: string;
  status: Status;
  created: string;
}

export function newReservation(f: Omit<Reservation, "id" | "ref" | "status" | "created">): Reservation {
  return {
    ...f,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ref: `SS-${Math.floor(1000 + Math.random() * 9000)}`,
    status: "pending",
    created: new Date().toISOString(),
  };
}
export function fmtDate(d: string) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
export function toCsv(list: Reservation[]) {
  const head = ["Ref", "Name", "Phone", "Email", "Date", "Time", "Guests", "Seating", "Request", "Status", "Received"];
  const rows = list.map((r) => [r.ref, r.name, r.phone, r.email, r.date, r.time, r.guests, r.area, r.note, r.status, r.created]);
  return [head, ...rows].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
}
/** Half-hour slots from opening to the last order. */
export const TIMES = (() => {
  const t: string[] = [];
  for (let h = 8; h <= 23; h++) {
    const ampm = h < 12 ? "AM" : "PM";
    const hr = h % 12 === 0 ? 12 : h % 12;
    t.push(`${hr}:00 ${ampm}`, `${hr}:30 ${ampm}`);
  }
  return t;
})();
export const GUESTS = ["1 guest", "2 guests", "3 guests", "4 guests", "5 guests", "6 guests", "7 guests", "8 guests", "9+ guests"];
export const AREAS = ["No preference", "Dining room", "Bar side", "Terrace / hookah", "Group table"];
