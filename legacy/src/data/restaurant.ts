/**
 * Restaurant facts. Everything marked PLACEHOLDER was not supplied at build
 * time and must be replaced before launch. Each is a single constant so the
 * swap is a one-line edit.
 */

/** From the restaurant's card. Two lines; the first is the one we publish. */
export const PHONE_PRIMARY = "+977 9849413269";
export const PHONE_SECONDARY = "+977 9827401800";
/** PLACEHOLDER — hours were given as an example ("e.g. Sun–Sat 9:00–23:30"). */
export const PLACEHOLDER_HOURS_ARE_EXAMPLE = true;
/** PLACEHOLDER — number of tables / max party not yet supplied. */
export const PLACEHOLDER_TABLE_COUNT = 12;
export const PLACEHOLDER_MAX_PARTY = 8;
/**
 * PLACEHOLDER — the Google review COUNT is unknown. Left null on purpose:
 * we never invent a count, and JSON-LD omits AggregateRating while it is null.
 */
export const GOOGLE_REVIEW_COUNT: number | null = null;

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export interface DayHours {
  day: Weekday;
  label: string;
  /** "HH:MM" 24h, or null when closed */
  open: string | null;
  close: string | null;
}

export const restaurant = {
  name: "Swad Satkar",
  nameDevanagari: "स्वाद सत्कार",
  descriptor: "Thakali, Thai and Continental",
  cuisineLine: "Asian mix cuisine",
  tagline: "Bangkok heat, Thakali warmth, a proper bar.",
  /** The line printed on the restaurant's own menu cover. */
  cardTagline: "Taste of Nepal, served with warm hospitality.",
  taglineNepali: "स्वादमा नेपालीपन, सेवामा आत्मीयता",
  /** The line printed on the business card. */
  businessCardTagline: "Great food. Fine drinks. Good times.",
  established: "Lalitpur",
  meaning: "swad is flavour, satkar is hospitality",
  address: {
    street: "Bhanimandal Marg",
    locality: "Lalitpur",
    region: "Bagmati Province",
    postalCode: "44600",
    country: "Nepal",
    countryCode: "NP",
  },
  phone: PHONE_PRIMARY,
  phoneSecondary: PHONE_SECONDARY,
  whatsapp: PHONE_PRIMARY,
  email: "swadsatkar9@gmail.com",
  owner: "Madhu Dhamala",
  rating: {
    value: 4.7,
    source: "Google",
    count: GOOGLE_REVIEW_COUNT,
    /** Link to the Google listing / short map link supplied by the owner. */
    url: "https://maps.app.goo.gl/XYj66Kfh9Cp3Gz8v6",
  },
  maps: {
    shareUrl: "https://maps.app.goo.gl/XYj66Kfh9Cp3Gz8v6",
    /** Keyless embed built from the address query. */
    embedUrl:
      "https://www.google.com/maps?q=Swad+Satkar+Bhanimandal+Marg+Lalitpur+Nepal&z=16&output=embed",
    directionsUrl:
      "https://www.google.com/maps/dir/?api=1&destination=Swad+Satkar+Bhanimandal+Marg+Lalitpur+Nepal",
  },
  socials: {
    facebook:
      "https://www.facebook.com/people/%E0%A4%B8%E0%A5%8D%E0%A4%B5%E0%A4%BE%E0%A4%A6-%E0%A4%B8%E0%A4%A4%E0%A5%8D%E0%A4%95%E0%A4%BE%E0%A4%B0/61591201389130/",
    instagram: null as string | null,
  },
  /** PLACEHOLDER hours — see PLACEHOLDER_HOURS_ARE_EXAMPLE. */
  hours: [
    { day: 0, label: "Sunday", open: "09:00", close: "23:30" },
    { day: 1, label: "Monday", open: "09:00", close: "23:30" },
    { day: 2, label: "Tuesday", open: "09:00", close: "23:30" },
    { day: 3, label: "Wednesday", open: "09:00", close: "23:30" },
    { day: 4, label: "Thursday", open: "09:00", close: "23:30" },
    { day: 5, label: "Friday", open: "09:00", close: "23:30" },
    { day: 6, label: "Saturday", open: "09:00", close: "23:30" },
  ] as DayHours[],
  hoursSummary: "Every day, 9:00 to 23:30",
  happyHour: { label: "Happy hour", window: "Daily, 4pm to 7pm", note: "Two-for-one on house pours" },
  timezone: "Asia/Kathmandu",
  currency: "NPR",
  services: {
    lunch: { start: "11:30", end: "15:00" },
    dinner: { start: "18:00", end: "22:30" },
  },
  seating: ["Indoor", "Terrace", "Bar counter"] as const,
  siteUrl: "https://swadsatkar.example", // PLACEHOLDER domain
} as const;

export type Restaurant = typeof restaurant;

export const telHref = `tel:${restaurant.phone.replace(/[^\d+]/g, "")}`;
export const telHrefSecondary = `tel:${restaurant.phoneSecondary.replace(/[^\d+]/g, "")}`;
export const whatsappHref = (text?: string) =>
  `https://wa.me/${restaurant.whatsapp.replace(/[^\d]/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
