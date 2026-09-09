export type Occasion = "none" | "birthday" | "anniversary" | "business";
/** Where a reservation is in its life: the guest sets the first two, the
 *  restaurant sets the rest from the admin panel. */
export type BookingStatus = "confirmed" | "cancelled" | "seated" | "no_show";
export type Seating = "indoor" | "terrace" | "bar";

export interface BookingDraft {
  party: number | null;
  /** "YYYY-MM-DD" */
  date: string | null;
  /** "HH:MM" */
  time: string | null;
  occasion: Occasion;
  seating: Seating | null;
  name: string;
  phone: string;
  email: string;
  notes: string;
  /** Wizard step index 0-5 */
  step: number;
  /** Epoch ms of last edit, used for the 24h "continue" offer */
  updatedAt: number;
}

export interface Booking {
  reference: string;
  party: number;
  date: string;
  time: string;
  occasion: Occasion;
  seating: Seating | null;
  name: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: number;
  status: BookingStatus;
}

export const emptyDraft = (): BookingDraft => ({
  party: null,
  date: null,
  time: null,
  occasion: "none",
  seating: null,
  name: "",
  phone: "",
  email: "",
  notes: "",
  step: 0,
  updatedAt: Date.now(),
});

export const STEP_LABELS = ["Party", "Date", "Time", "Occasion", "Details", "Confirmed"] as const;

export const occasionLabel: Record<Occasion, string> = {
  none: "Just dinner",
  birthday: "Birthday",
  anniversary: "Anniversary",
  business: "Business",
};

export const statusLabel: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  seated: "Seated",
  no_show: "No show",
  cancelled: "Cancelled",
};

export const seatingLabel: Record<Seating, string> = {
  indoor: "Indoor",
  terrace: "Terrace",
  bar: "Bar counter",
};
