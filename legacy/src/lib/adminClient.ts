/**
 * The ONLY place the admin panel talks to storage.
 *
 * Like `bookingClient`, this is a localStorage mock so the panel is fully
 * usable with no server. Every TODO(backend) for admin features lives here.
 * To go live, implement `AdminClient` against the real API and export it as
 * `adminClient`; nothing else changes.
 *
 * IMPORTANT: because this is browser storage, the panel only sees reservations
 * made in the same browser, and menu edits only reach guests on this device.
 */
import type { Booking, BookingStatus } from "./booking-types";
import {
  emptyMenuOverrides,
  type AddedItem,
  type MenuItemOverride,
  type MenuOverrideState,
} from "./menuOverrides";

export interface AdminState extends MenuOverrideState {
  /** Extra closed dates as "YYYY-MM-DD", on top of the static ones. */
  closedDates: string[];
  updatedAt: number;
}

export interface AdminClient {
  getState(): AdminState;
  /** Merge a change into one printed dish. Pass null to clear all its edits. */
  setItemOverride(key: string, patch: MenuItemOverride | null): AdminState;
  /** Add a dish that is not on the printed card. */
  addItem(groupKey: string, item: Omit<AddedItem, "id">): AdminState;
  /** Change a dish that was added here. */
  updateAddedItem(groupKey: string, id: string, patch: Partial<Omit<AddedItem, "id">>): AdminState;
  /** Delete a dish that was added here. Printed dishes use `removed` instead. */
  deleteAddedItem(groupKey: string, id: string): AdminState;
  resetMenu(): AdminState;
  toggleClosedDate(dateKey: string): AdminState;
  listBookings(): Promise<Booking[]>;
  setBookingStatus(reference: string, status: BookingStatus): Promise<Booking[]>;
  deleteBooking(reference: string): Promise<Booking[]>;
  clearAllBookings(): Promise<void>;
}

const STATE_KEY = "swadsatkar:admin";
const BOOKINGS_KEY = "swadsatkar:bookings";
/** Fired whenever admin state changes so open views re-read it. */
export const ADMIN_EVENT = "swadsatkar:admin-changed";

const canStore = () => typeof window !== "undefined" && "localStorage" in window;

export const emptyAdminState = (): AdminState => ({ ...emptyMenuOverrides(), closedDates: [], updatedAt: 0 });

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
    window.dispatchEvent(new CustomEvent(ADMIN_EVENT));
  } catch {
    /* storage full or blocked: degrade silently */
  }
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const newId = () => Math.random().toString(36).slice(2, 9);

/** Drops keys whose value is undefined so "unset" really clears an override. */
const prune = <T extends object>(o: T): T => {
  const out = {} as T;
  for (const [k, v] of Object.entries(o)) if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  return out;
};

const mockAdminClient: AdminClient = {
  getState() {
    const s = read<Partial<AdminState>>(STATE_KEY, {});
    return { ...emptyAdminState(), ...s, items: s.items ?? {}, added: s.added ?? {} };
  },

  setItemOverride(key, patch) {
    // TODO(backend): PATCH /menu/items/:key
    const state = this.getState();
    const items = { ...state.items };
    if (patch === null) {
      delete items[key];
    } else {
      const merged = prune({ ...items[key], ...patch });
      if (Object.keys(merged).length === 0) delete items[key];
      else items[key] = merged;
    }
    const next = { ...state, items, updatedAt: Date.now() };
    write(STATE_KEY, next);
    return next;
  },

  addItem(groupKey, item) {
    // TODO(backend): POST /menu/groups/:groupKey/items
    const state = this.getState();
    const list = state.added[groupKey] ?? [];
    const next = {
      ...state,
      added: { ...state.added, [groupKey]: [...list, { ...item, id: newId() }] },
      updatedAt: Date.now(),
    };
    write(STATE_KEY, next);
    return next;
  },

  updateAddedItem(groupKey, id, patch) {
    // TODO(backend): PATCH /menu/groups/:groupKey/items/:id
    const state = this.getState();
    const list = (state.added[groupKey] ?? []).map((a) => (a.id === id ? { ...a, ...prune(patch) } : a));
    const next = { ...state, added: { ...state.added, [groupKey]: list }, updatedAt: Date.now() };
    write(STATE_KEY, next);
    return next;
  },

  deleteAddedItem(groupKey, id) {
    // TODO(backend): DELETE /menu/groups/:groupKey/items/:id
    const state = this.getState();
    const list = (state.added[groupKey] ?? []).filter((a) => a.id !== id);
    const added = { ...state.added };
    if (list.length) added[groupKey] = list;
    else delete added[groupKey];
    const next = { ...state, added, updatedAt: Date.now() };
    write(STATE_KEY, next);
    return next;
  },

  resetMenu() {
    const next = { ...this.getState(), ...emptyMenuOverrides(), updatedAt: Date.now() };
    write(STATE_KEY, next);
    return next;
  },

  toggleClosedDate(dateKey) {
    // TODO(backend): POST/DELETE /service/closed-dates/:date
    const state = this.getState();
    const closedDates = state.closedDates.includes(dateKey)
      ? state.closedDates.filter((d) => d !== dateKey)
      : [...state.closedDates, dateKey].sort();
    const next = { ...state, closedDates, updatedAt: Date.now() };
    write(STATE_KEY, next);
    return next;
  },

  async listBookings() {
    // TODO(backend): GET /admin/bookings — the real list across all guests,
    // which localStorage cannot provide.
    return read<Booking[]>(BOOKINGS_KEY, []);
  },

  async setBookingStatus(reference, status) {
    // TODO(backend): PATCH /admin/bookings/:reference { status }
    await wait(200);
    const all = read<Booking[]>(BOOKINGS_KEY, []);
    const next = all.map((b) => (b.reference === reference ? { ...b, status } : b));
    write(BOOKINGS_KEY, next);
    return next;
  },

  async deleteBooking(reference) {
    // TODO(backend): DELETE /admin/bookings/:reference
    await wait(200);
    const next = read<Booking[]>(BOOKINGS_KEY, []).filter((b) => b.reference !== reference);
    write(BOOKINGS_KEY, next);
    return next;
  },

  async clearAllBookings() {
    // TODO(backend): there is no bulk delete in a real system; this exists
    // only to reset the local demo.
    write(BOOKINGS_KEY, []);
  },
};

export const adminClient: AdminClient = mockAdminClient;
