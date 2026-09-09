/**
 * The ONLY place that talks to a reservation backend.
 *
 * Today this is a localStorage mock so the flow is fully usable with no server.
 * Every TODO(backend) in the codebase lives in this file. To go live, implement
 * `BookingClient` against the real API and export it from `bookingClient`.
 */
import { slotsFor, type Slot } from "@/data/availability";
import { adminClient } from "./adminClient";
import type { Booking, BookingDraft } from "./booking-types";

export interface BookingClient {
  getAvailability(date: string, party: number): Promise<Slot[]>;
  createBooking(draft: BookingDraft): Promise<Booking>;
  listBookings(): Promise<Booking[]>;
  cancelBooking(reference: string): Promise<void>;
  loadDraft(): BookingDraft | null;
  saveDraft(draft: BookingDraft): void;
  clearDraft(): void;
}

const BOOKINGS_KEY = "swadsatkar:bookings";
const DRAFT_KEY = "swadsatkar:draft";
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

const canStore = () => typeof window !== "undefined" && "localStorage" in window;

const read = <T,>(key: string, fallback: T): T => {
  if (!canStore()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  if (!canStore()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: degrade silently */
  }
};

/** SS- + base36 timestamp, e.g. SS-LX3K9Q2 */
export const generateReference = (now = Date.now()) => `SS-${now.toString(36).toUpperCase()}`;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const mockClient: BookingClient = {
  async getAvailability(date, party) {
    // TODO(backend): GET /availability?date=&party= — replace the seeded mock.
    await wait(180);
    // Days the restaurant closed from the admin panel have no slots at all.
    if (adminClient.getState().closedDates.includes(date)) return [];
    return slotsFor(date, party);
  },

  async createBooking(draft) {
    // TODO(backend): POST /bookings with the draft; the server should own the
    // reference code, hold the slot, and send the confirmation SMS/email.
    await wait(600);
    if (!draft.party || !draft.date || !draft.time) {
      throw new Error("Incomplete booking");
    }
    const booking: Booking = {
      reference: generateReference(),
      party: draft.party,
      date: draft.date,
      time: draft.time,
      occasion: draft.occasion,
      seating: draft.seating,
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      notes: draft.notes.trim(),
      createdAt: Date.now(),
      status: "confirmed",
    };
    const all = read<Booking[]>(BOOKINGS_KEY, []);
    write(BOOKINGS_KEY, [booking, ...all]);
    return booking;
  },

  async listBookings() {
    // TODO(backend): GET /bookings for the authenticated guest (or by phone OTP).
    return read<Booking[]>(BOOKINGS_KEY, []);
  },

  async cancelBooking(reference) {
    // TODO(backend): DELETE /bookings/:reference
    await wait(300);
    const all = read<Booking[]>(BOOKINGS_KEY, []);
    write(
      BOOKINGS_KEY,
      all.map((b) => (b.reference === reference ? { ...b, status: "cancelled" as const } : b)),
    );
  },

  loadDraft() {
    const draft = read<BookingDraft | null>(DRAFT_KEY, null);
    if (!draft) return null;
    if (Date.now() - draft.updatedAt > DRAFT_TTL_MS) {
      this.clearDraft();
      return null;
    }
    return draft;
  },

  saveDraft(draft) {
    write(DRAFT_KEY, { ...draft, updatedAt: Date.now() });
  },

  clearDraft() {
    if (!canStore()) return;
    window.localStorage.removeItem(DRAFT_KEY);
  },
};

export const bookingClient: BookingClient = mockClient;
