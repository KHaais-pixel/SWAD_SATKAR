import { z } from "zod";
import { addReservation, readReservations, writeReservations } from "@/lib/content";
import { sendBookingConfirmation } from "@/lib/mail";
import { AREAS, GUESTS, TIMES, newReservation, type Status } from "@/lib/reservations";
import { authorised, unauthorised } from "@/lib/staff-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reservation requests.
 *
 * POST is public — it is the booking form — so everything it accepts is
 * checked here and nothing longer than a table request can get through. GET,
 * PATCH and DELETE are the staff panel's, behind the passcode.
 */

const Request_ = z.object({
  name: z.string().trim().min(1, "Please give a name").max(80),
  phone: z.string().trim().min(4, "Please give a telephone number").max(32),
  email: z.string().trim().max(120).email("That email address does not look right").or(z.literal("")),
  // an <input type="date">, and never in the past
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a date"),
  time: z.enum(TIMES as [string, ...string[]]),
  guests: z.enum(GUESTS as [string, ...string[]]),
  area: z.enum(AREAS as [string, ...string[]]),
  note: z.string().trim().max(500, "Please keep the request under 500 characters"),
});

/** Requests are kept for the staff panel, not forever: the newest 500. */
const KEEP = 500;

/**
 * A public endpoint that sends mail is worth a limit. One address may make a
 * handful of requests an hour; the counter is in this process's memory.
 * ponytail: per-process and lost on restart, which is enough for a single
 * Passenger app — move it to the content directory if the site ever runs on
 * more than one process.
 */
const RATE = new Map<string, number[]>();
const PER_HOUR = 6;
function tooMany(ip: string): boolean {
  const hour = Date.now() - 3600_000;
  const hits = (RATE.get(ip) || []).filter((t) => t > hour);
  hits.push(Date.now());
  RATE.set(ip, hits);
  if (RATE.size > 5000) RATE.clear();
  return hits.length > PER_HOUR;
}
const clientIp = (req: Request) =>
  (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";

export async function POST(req: Request) {
  if (tooMany(clientIp(req))) {
    return Response.json({ error: "Too many requests just now. Please call us instead." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Nothing to save" }, { status: 400 });
  }
  const parsed = Request_.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message || "Please check the form" }, { status: 400 });
  }
  const today = new Date().toISOString().slice(0, 10);
  if (parsed.data.date < today) {
    return Response.json({ error: "Please choose a date that has not passed" }, { status: 400 });
  }

  const rec = newReservation(parsed.data);
  await addReservation(rec);
  const list = await readReservations();
  if (list.length > KEEP) await writeReservations(list.slice(0, KEEP));

  // the request is safe on disk; the email is a courtesy on top of it and
  // must never be the reason a guest is told the booking failed
  const mail = await sendBookingConfirmation(rec);
  if (!mail.sent && rec.email) console.error(`[reservations] ${rec.ref}: confirmation not sent — ${mail.reason}`);

  return Response.json({ reservation: rec, emailed: mail.sent }, { status: 201 });
}

/* the staff panel */

export async function GET(req: Request) {
  if (!authorised(req)) return unauthorised();
  return Response.json({ items: await readReservations() });
}

const STATUSES: Status[] = ["pending", "confirmed", "seated", "declined"];

/** One request's status. */
export async function PATCH(req: Request) {
  if (!authorised(req)) return unauthorised();
  let body: { id?: string; status?: Status };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Nothing to change" }, { status: 400 });
  }
  if (!body.id || !body.status || !STATUSES.includes(body.status)) {
    return Response.json({ error: "Unknown status" }, { status: 400 });
  }
  const items = await readReservations();
  if (!items.some((r) => r.id === body.id)) return Response.json({ error: "No such request" }, { status: 404 });
  const next = items.map((r) => (r.id === body.id ? { ...r, status: body.status as Status } : r));
  await writeReservations(next);
  return Response.json({ items: next });
}

export async function DELETE(req: Request) {
  if (!authorised(req)) return unauthorised();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Which request?" }, { status: 400 });
  const items = await readReservations();
  const next = items.filter((r) => r.id !== id);
  if (next.length === items.length) return Response.json({ error: "No such request" }, { status: 404 });
  await writeReservations(next);
  return Response.json({ items: next });
}
