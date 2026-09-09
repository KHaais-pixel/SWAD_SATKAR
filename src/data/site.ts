/**
 * Facts about the house. Contact details come from the restaurant's card;
 * the hours are the ones on the design (8 AM to 12 AM). Nothing here is
 * invented: every unknown is marked and shown as such.
 */
export const site = {
  name: "Swad Satkar",
  nameDevanagari: "स्वाद सत्कार",
  cuisineLine: "Thakali • Thai • Bar",
  descriptor: "Asian Mix Cuisine",
  tagline: "A Taste of Tradition. A World of Flavor.",
  cardTagline: "Taste of Nepal, served with warm hospitality.",
  taglineNepali: "स्वादमा नेपालीपन, सेवामा आत्मीयता",
  hours: {
    open: "8:00 AM",
    close: "12:00 AM",
    short: "OPEN 8 AM — 12 AM",
    long: "8:00 AM — 12:00 AM",
    daily: "Open daily 8:00 AM – 12:00 AM",
    /** for schema.org */
    opens: "08:00",
    closes: "23:59",
  },
  phone: "+977 9849413269",
  phoneSecondary: "+977 9827401800",
  email: "swadsatkar9@gmail.com",
  address: {
    street: "Bhanimandal Marg",
    locality: "Lalitpur",
    region: "Bagmati Province",
    postalCode: "44600",
    country: "Nepal",
    countryCode: "NP",
    /** what you see from the street */
    landmark: "Look for the Thakali · Thai · Continental sign above Kasthamandap Liquor Store.",
  },
  maps: {
    shareUrl: "https://maps.app.goo.gl/XYj66Kfh9Cp3Gz8v6",
    embedUrl: "https://www.google.com/maps?q=Swad+Satkar+Bhanimandal+Marg+Lalitpur+Nepal&z=16&output=embed",
    directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=Swad+Satkar+Bhanimandal+Marg+Lalitpur+Nepal",
  },
  socials: {
    facebook: "https://www.facebook.com/people/%E0%A4%B8%E0%A5%8D%E0%A4%B5%E0%A4%BE%E0%A4%A6-%E0%A4%B8%E0%A4%A4%E0%A5%8D%E0%A4%95%E0%A4%BE%E0%A4%B0/61591201389130/",
    instagram: null as string | null,
  },
  siteUrl: "https://swadsatkar.example", // PLACEHOLDER domain
  /** Staff panel: the passcode is a build-time setting, never in the page source for real deployments. */
  staff: {
    passcode: process.env.NEXT_PUBLIC_STAFF_PASSCODE || "swad2026",
    requireCode: true,
  },
  /** Whether the cigarette list shows on the bar page. */
  showSmoking: true,
} as const;

export const telHref = `tel:${site.phone.replace(/[^\d+]/g, "")}`;
export const telHrefSecondary = `tel:${site.phoneSecondary.replace(/[^\d+]/g, "")}`;
export const whatsappHref = (text?: string) => `https://wa.me/${site.phone.replace(/[^\d]/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** The photographs, all from the restaurant. */
export const photos = {
  exterior: { src: "/photos/exterior.jpg", alt: "Swad Satkar at dusk, lit along every balcony", w: 868, h: 1122 },
  thali: { src: "/photos/thakali-thali.jpg", alt: "Thakali thali served at Swad Satkar", w: 1800, h: 1129 },
  platter: { src: "/photos/khaja-platter.jpg", alt: "Khaja set platter", w: 1680, h: 1250 },
  grill: { src: "/photos/mixed-grill.jpg", alt: "Mixed grill plate", w: 1676, h: 1238 },
  board1: { src: "/photos/menu-board-1.jpg", alt: "Menu board: starters, soups, veg snacks", w: 1800, h: 1247 },
  board2: { src: "/photos/menu-board-2.jpg", alt: "Menu board: Thakali sets, momo, pizza", w: 1800, h: 1224 },
  board3: { src: "/photos/menu-board-3.jpg", alt: "Menu board: non-veg snacks, seafood", w: 1800, h: 1219 },
  board4: { src: "/photos/menu-board-4.jpg", alt: "Menu board: Thai food and bar", w: 1800, h: 1199 },
  plaque: { src: "/brand/plaque.webp", alt: "Swad Satkar", w: 1200, h: 887 },
  team: { src: "/photos/team.webp", alt: "The Swad Satkar team at the bar: the kitchen in chef whites, the floor team in blue", w: 1536, h: 1024 },
  /** the same plaque, small, for the header and footer */
  plaqueSmall: { src: "/brand/plaque-sm.webp", alt: "Swad Satkar", w: 400, h: 296 },
} as const;

/**
 * The reel, in the order it is walked: the house, the table, the sign, the
 * plates. Every note here is the photograph's own description, nothing added.
 * The menu boards are not in it; they belong to the printed menu.
 */
export interface GalleryItem {
  src: string;
  alt: string;
  w: number;
  h: number;
  tag: string;
  note: string;
  /** the album it sits in on the gallery page */
  album: string;
  /** set on staff uploads only; the house photographs have none */
  id?: string;
  created?: string;
}
export const gallery: GalleryItem[] = [
  { ...photos.exterior, tag: "EXTERIOR", note: "At dusk, lit along every balcony", album: "The House" },
  { ...photos.thali, tag: "THAKALI SET", note: "The thali, served on steel", album: "The Table" },
  { ...photos.plaque, alt: "Swad Satkar sign", tag: "THE SIGN", note: "Swad Satkar, above the street", album: "The House" },
  { ...photos.platter, tag: "KHAJA SET", note: "The khaja set platter", album: "The Table" },
  { ...photos.grill, tag: "SNACKS", note: "The mixed grill plate", album: "The Table" },
];

/** The rooms, as the house describes them, with their own photographs. */
export const rooms = [
  { idx: "R 01", src: "/story/veranda.webp", w: 1200, h: 1597, name: "The Veranda", meta: "Street side · arched windows", d: "A single run of tables along the arched windows, under a woven bamboo ceiling and rattan lamps. The room to take when you want to watch the road.", alt: "Street-side veranda with a brick wall, oxblood band, woven bamboo ceiling and rattan pendant lamps." },
  { idx: "R 02", src: "/story/snug.webp", w: 1000, h: 1335, name: "The Snug", meta: "Private · seats six", d: "A door that closes. Six chairs, one long table, a window cracked open to the tree outside. Booked whole, for a family or a quiet argument.", alt: "A private dining room seating six, with textured cream walls, wood panelling and a bright window." },
  { idx: "R 03", src: "/story/lounge.webp", w: 1100, h: 1470, name: "The Lounge", meta: "Leather · low tables", d: "Deep leather, low pine tables and a slat screen that gives every bench its own corner. Where the bar list gets read properly.", alt: "Lounge seating with brown leather sofas, a slatted wood screen and a white column." },
  { idx: "R 04", src: "/story/long-room.webp", w: 1400, h: 1053, name: "The Long Room", meta: "Booths · the big table", d: "Booths down both walls and the column in the middle everyone ends up leaning on. The room that takes the overflow on a Friday.", alt: "The long room with booth seating on both sides, a central column and framed paintings." },
] as const;

export const timeline = [
  { k: "THE NAME", t: "Swad Satkar — flavour and hospitality", d: "स्वाद for taste, सत्कार for the welcome. The two words describe the whole intention of the house." },
  { k: "THE KITCHEN", t: "Two traditions, cooked separately", d: "A Thakali kitchen and a Thai kitchen, each cooked on its own terms. Nothing is blended to please both." },
  { k: "THE ROOM", t: "Above the street, under the lights", d: "Brick, timber windows, prayer flags across the front and warm light down the whole facade after dark." },
  { k: "THE HOURS", t: "Morning tea to midnight", d: "Open from 8:00 AM for tea and coffee, through lunch sets and dinner, until the last order at midnight." },
];

export const barAtmosphere = [
  { k: "THE ROOM", t: "Warm light, low tables", d: "Timber windows, brick walls and lamp light. Big tables for groups, corners for two." },
  { k: "THE TERRACE", t: "Hookah and evening air", d: "Shisha in mint, double apple, watermelon and kiwi, served regular or deluxe with an ice base." },
  { k: "AFTER WORK", t: "Kitchen stays open", d: "Snacks, seafood and khaja plates run alongside the bar right up to last orders." },
];

export const contactCards = [
  { k: "ADDRESS", v: `${site.address.street}, ${site.address.locality}`, note: site.address.landmark },
  { k: "PHONE", v: site.phone, note: "Call for same-day tables and group khaja sets.", href: telHref },
  { k: "EMAIL", v: site.email, note: "For events and private dining enquiries.", href: `mailto:${site.email}` },
  { k: "HOURS", v: site.hours.long, note: "Open every day, including public holidays." },
];
