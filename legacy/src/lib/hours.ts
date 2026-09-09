import { restaurant, type DayHours, type Weekday } from "@/data/restaurant";

export interface OpenStatus {
  isOpen: boolean;
  today: Weekday;
  /** Human line, e.g. "Open now closes 23:30" or "Closed opens 9:00" */
  line: string;
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Current wall-clock in the restaurant's timezone. */
const nowInZone = (now: Date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: restaurant.timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const day = days.indexOf(get("weekday")) as Weekday;
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  return { day, minutes: hour * 60 + minute };
};

export const formatTime = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hr}${suffix}` : `${hr}:${String(m).padStart(2, "0")}${suffix}`;
};

export const hoursFor = (day: Weekday): DayHours =>
  restaurant.hours.find((h) => h.day === day) ?? restaurant.hours[0];

export const getOpenStatus = (now: Date = new Date()): OpenStatus => {
  const { day, minutes } = nowInZone(now);
  const today = hoursFor(day);
  if (!today.open || !today.close) {
    return { isOpen: false, today: day, line: "Closed today" };
  }
  const open = toMinutes(today.open);
  const close = toMinutes(today.close);
  if (minutes >= open && minutes < close) {
    return { isOpen: true, today: day, line: `Open now, closes ${formatTime(today.close)}` };
  }
  if (minutes < open) {
    return { isOpen: false, today: day, line: `Closed, opens ${formatTime(today.open)}` };
  }
  return { isOpen: false, today: day, line: "Closed for tonight" };
};
