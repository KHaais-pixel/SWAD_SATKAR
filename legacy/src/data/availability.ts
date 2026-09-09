import { restaurant, type Weekday } from "./restaurant";

/**
 * Seeded mock availability. Deterministic: the same date + slot always gives
 * the same result, so the book "feels real" across refreshes.
 * TODO(backend) lives in src/lib/bookingClient.ts — this file is pure mock data.
 */

export type SlotState = "available" | "few" | "full";

export interface Slot {
  time: string; // "HH:MM"
  service: "lunch" | "dinner";
  state: SlotState;
  remaining: number;
}

/** Weekdays the restaurant is closed (0 = Sunday). Empty = open every day. */
export const closedWeekdays: Weekday[] = [];

/** Specific closed dates as "YYYY-MM-DD" (festivals, private events). */
export const closedDates: string[] = [];

export const BOOKING_WINDOW_DAYS = 60;
export const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const fromDateKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const isClosedOn = (d: Date) =>
  closedWeekdays.includes(d.getDay() as Weekday) || closedDates.includes(toDateKey(d));

/** Small deterministic hash (FNV-1a) → 0..1 */
const hash01 = (input: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) % 10000) / 10000;
};

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const label = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

const range = (start: string, end: string) => {
  const out: number[] = [];
  for (let t = minutes(start); t <= minutes(end) - 60; t += 30) out.push(t);
  return out;
};

/**
 * Generates slots for a date and party size. Weekend dinners are visibly
 * tighter; larger parties eat into capacity faster.
 */
export const slotsFor = (dateKey: string, party: number): Slot[] => {
  const date = fromDateKey(dateKey);
  if (isClosedOn(date)) return [];
  const dow = date.getDay();
  const weekend = dow === 5 || dow === 6;

  const build = (service: "lunch" | "dinner", times: number[]) =>
    times.map((t) => {
      const r = hash01(`${dateKey}|${service}|${t}`);
      const peak = service === "dinner" && t >= minutes("19:00") && t <= minutes("21:00");
      // Base pressure 0..1: higher = fuller
      let pressure = r * 0.55;
      if (weekend) pressure += 0.25;
      if (peak) pressure += 0.2;
      if (service === "lunch" && !weekend) pressure -= 0.15;
      pressure += (party - 2) * 0.04;
      const remaining = Math.max(0, Math.round((1 - pressure) * 5));
      const state: SlotState = remaining === 0 ? "full" : remaining <= 2 ? "few" : "available";
      return { time: label(t), service, state, remaining };
    });

  return [
    ...build("lunch", range(restaurant.services.lunch.start, restaurant.services.lunch.end)),
    ...build("dinner", range(restaurant.services.dinner.start, restaurant.services.dinner.end)),
  ];
};
