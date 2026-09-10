import { promises as fs } from "node:fs";
import path from "node:path";
import { gallery as builtIn, type GalleryItem } from "@/data/site";
import { BAR_LISTS, SMOKING, SPIRITS, THAI, THAKALI, type BarList, type Category, type Spirit } from "@/data/menus";
import type { Reservation } from "@/lib/reservations";

/**
 * What the staff panel can change, kept as two small JSON files in
 * content/ and the uploaded photographs in content/uploads/gallery/. The
 * pages read these at render time and merge them over the built-in data,
 * so the printed menu and the house photographs stay in the code and the
 * staff's changes sit on top.
 *
 * This is a file on the server's disk: it works wherever the site runs as a
 * Node process with a writable filesystem, and not on a static export or a
 * host that throws the filesystem away between requests.
 */
export const CONTENT_DIR = path.join(process.cwd(), "content");
/**
 * Uploads live outside public/: a production server only serves what public/
 * held at build time, so the route at /uploads/gallery/[file] reads these
 * from disk instead.
 */
export const UPLOAD_DIR = path.join(CONTENT_DIR, "uploads", "gallery");
const GALLERY_FILE = path.join(CONTENT_DIR, "gallery.json");
const PRICES_FILE = path.join(CONTENT_DIR, "prices.json");
const RESERVATIONS_FILE = path.join(CONTENT_DIR, "reservations.json");

export type { GalleryItem };
export interface Uploaded extends GalleryItem { id: string; created: string }

/** Prices the staff have changed, keyed the way the menus are read: list → "category/item" → price. */
export interface PriceOverrides {
  thakali: Record<string, string>;
  thai: Record<string, string>;
  /** the bar lists and the cigarettes, keyed "category/item" */
  bar: Record<string, string>;
  /** spirits, keyed by name, each column on its own */
  spirits: Record<string, Partial<Pick<Spirit, "b" | "m30" | "m60" | "h" | "q">>>;
}
const EMPTY: PriceOverrides = { thakali: {}, thai: {}, bar: {}, spirits: {} };

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return { ...fallback, ...(JSON.parse(await fs.readFile(file, "utf8")) as T) };
  } catch {
    return fallback;
  }
}
async function writeJson(file: string, data: unknown, mode?: number) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  // written beside the file and moved into place, so a reader in another
  // request never catches it half-written
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + "\n", mode ? { mode } : undefined);
  if (mode) await fs.chmod(tmp, mode);
  await fs.rename(tmp, file);
}

/* the gallery */

interface GalleryFile { items: Uploaded[]; hidden: string[] }
async function readGalleryFile(): Promise<GalleryFile> {
  const g = await readJson<GalleryFile>(GALLERY_FILE, { items: [], hidden: [] });
  return { items: Array.isArray(g.items) ? g.items : [], hidden: Array.isArray(g.hidden) ? g.hidden : [] };
}
export async function readUploads(): Promise<Uploaded[]> {
  return (await readGalleryFile()).items;
}
export async function writeUploads(items: Uploaded[]) {
  await writeJson(GALLERY_FILE, { ...(await readGalleryFile()), items });
}
/** House photographs the staff have taken out of the gallery, by src. They stay in the code; only the list changes. */
export async function readHidden(): Promise<string[]> {
  return (await readGalleryFile()).hidden;
}
export async function writeHidden(hidden: string[]) {
  await writeJson(GALLERY_FILE, { ...(await readGalleryFile()), hidden: [...new Set(hidden)] });
}
export const isHouse = (src: string) => builtIn.some((b) => b.src === src);
/**
 * Uploads whose file is actually on disk. gallery.json and content/uploads/
 * can drift apart — the photographs are not in the repository, so a fresh
 * deployment starts with an empty upload directory and a manifest that still
 * lists every photograph the staff had added. Showing those would put broken
 * images on the page; skipping them here keeps the entry, so a photograph
 * restored to the directory reappears with its caption intact.
 */
async function onDisk(items: Uploaded[]): Promise<Uploaded[]> {
  const here = await Promise.all(
    items.map(async (i) => {
      const name = i.src.startsWith("/uploads/gallery/") ? path.basename(i.src) : null;
      if (!name) return true; // not an upload: a house photograph, served from public/
      try {
        await fs.access(path.join(UPLOAD_DIR, name));
        return true;
      } catch {
        return false;
      }
    }),
  );
  return items.filter((_, n) => here[n]);
}

/** The gallery as visitors see it: the house photographs the staff have kept, then whatever they have added, oldest first. */
export async function getGallery(): Promise<GalleryItem[]> {
  const { items, hidden } = await readGalleryFile();
  const present = await onDisk(items);
  return [...builtIn.filter((b) => !hidden.includes(b.src)), ...present.map((i) => ({ ...i, album: i.album || "The House" }))];
}

/* the prices */

export async function readPrices(): Promise<PriceOverrides> {
  const raw = await readJson<PriceOverrides>(PRICES_FILE, EMPTY);
  return { thakali: raw.thakali || {}, thai: raw.thai || {}, bar: raw.bar || {}, spirits: raw.spirits || {} };
}
export async function writePrices(p: PriceOverrides) {
  // only real changes are kept, so the file stays small and honest
  const trim = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === "string" && v.trim()));
  const spirits = Object.fromEntries(
    Object.entries(p.spirits || {})
      .map(([n, cols]) => [n, Object.fromEntries(Object.entries(cols || {}).filter(([, v]) => typeof v === "string" && v.trim()))] as const)
      .filter(([, cols]) => Object.keys(cols).length),
  );
  await writeJson(PRICES_FILE, { thakali: trim(p.thakali || {}), thai: trim(p.thai || {}), bar: trim(p.bar || {}), spirits });
}

export const priceKey = (cat: string, item: string) => `${cat}/${item}`;

const overlay = (cats: Category[], o: Record<string, string>): Category[] =>
  cats.map((c) => ({ ...c, items: c.items.map((i) => ({ ...i, p: o[priceKey(c.id, i.n)] ?? i.p })) }));
const overlayBar = (lists: BarList[], o: Record<string, string>): BarList[] =>
  lists.map((c) => ({ ...c, items: c.items.map((i) => ({ ...i, p: o[priceKey(c.cat, i.n)] ?? i.p })) }));

/** Every menu with the staff's prices laid over the printed ones. */
export async function getMenus() {
  const o = await readPrices();
  return {
    thakali: overlay(THAKALI, o.thakali),
    thai: overlay(THAI, o.thai),
    bar: overlayBar(BAR_LISTS, o.bar),
    smoking: overlayBar([SMOKING], o.bar)[0],
    spirits: SPIRITS.map((s) => ({ ...s, ...(o.spirits[s.n] || {}) })),
    overrides: o,
  };
}

/** The pages that show any of this, for revalidation after a change. */
export const CONTENT_PATHS = ["/", "/gallery", "/thakali", "/thai", "/bar"];

/* the reservations */

/**
 * Reservation requests, on the server's disk rather than in whichever browser
 * happened to make them. They carry a guest's name, telephone number and
 * email address, so the file is written 0600 — readable by the application's
 * own account and nobody else's on a shared host.
 */
export async function readReservations(): Promise<Reservation[]> {
  const r = await readJson<{ items: Reservation[] }>(RESERVATIONS_FILE, { items: [] });
  return Array.isArray(r.items) ? r.items : [];
}
export async function writeReservations(items: Reservation[]) {
  await writeJson(RESERVATIONS_FILE, { items }, 0o600);
}
/** Newest first, as the staff panel lists them. */
export async function addReservation(r: Reservation): Promise<Reservation> {
  await writeReservations([r, ...(await readReservations())]);
  return r;
}
