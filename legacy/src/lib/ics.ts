import { restaurant } from "@/data/restaurant";
import type { Booking } from "./booking-types";

const pad = (n: number) => String(n).padStart(2, "0");

/** Local floating time in ICS format: YYYYMMDDTHHMMSS */
const icsLocal = (date: string, time: string) => {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`;
};

const addMinutes = (date: string, time: string, mins: number) => {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const dt = new Date(y, m - 1, d, hh, mm + mins);
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
};

const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export const buildIcs = (booking: Booking) => {
  const a = restaurant.address;
  const location = `${restaurant.name}, ${a.street}, ${a.locality} ${a.postalCode}, ${a.country}`;
  const stamp = new Date(booking.createdAt).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Swad Satkar//Reservation//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.reference}@swadsatkar`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${restaurant.timezone}:${icsLocal(booking.date, booking.time)}`,
    `DTEND;TZID=${restaurant.timezone}:${addMinutes(booking.date, booking.time, 120)}`,
    `SUMMARY:${escape(`Table for ${booking.party} at ${restaurant.name}`)}`,
    `DESCRIPTION:${escape(`Reference ${booking.reference}. ${booking.notes || ""}`.trim())}`,
    `LOCATION:${escape(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
};

export const downloadIcs = (booking: Booking) => {
  const blob = new Blob([buildIcs(booking)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `swad-satkar-${booking.reference}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
