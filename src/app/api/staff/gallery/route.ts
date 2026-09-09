import { promises as fs } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { CONTENT_PATHS, UPLOAD_DIR, getGallery, isHouse, readHidden, readUploads, writeHidden, writeUploads, type Uploaded } from "@/lib/content";
import { authorised, unauthorised } from "@/lib/staff-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 20 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/avif", "image/tiff"]);
const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const revalidate = () => CONTENT_PATHS.forEach((p) => revalidatePath(p));

/** Everything in the gallery as visitors see it, plus how many house photographs are put away. */
export async function GET(req: Request) {
  if (!authorised(req)) return unauthorised();
  return Response.json({ items: await getGallery(), uploads: await readUploads(), hidden: (await readHidden()).length });
}

/** One photograph in: resized to a sensible master, written as webp, and added to the list. */
export async function POST(req: Request) {
  if (!authorised(req)) return unauthorised();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Choose a photograph" }, { status: 400 });
  if (!TYPES.has(file.type)) return Response.json({ error: "That is not a photograph we can use (JPEG, PNG, WebP or HEIC)" }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ error: "That file is over 20 MB" }, { status: 413 });
  const album = clean(form.get("album"), 40) || "The House";
  const tag = (clean(form.get("tag"), 40) || album).toUpperCase();
  const note = clean(form.get("note"), 90);

  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const out = path.join(UPLOAD_DIR, `${id}.webp`);
  let info;
  try {
    info = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: 2200, height: 2200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84, effort: 4 })
      .toFile(out);
  } catch {
    return Response.json({ error: "That file could not be read as a photograph" }, { status: 422 });
  }
  const item: Uploaded = { id, src: `/uploads/gallery/${id}.webp`, alt: note || tag, w: info.width, h: info.height, tag, note, album, created: new Date().toISOString() };
  await writeUploads([...(await readUploads()), item]);
  revalidate();
  return Response.json({ item }, { status: 201 });
}

/**
 * One photograph out. An upload goes for good, file and entry; a house
 * photograph (by src) is put away, and can be brought back with PUT.
 */
export async function DELETE(req: Request) {
  if (!authorised(req)) return unauthorised();
  const url = new URL(req.url);
  const src = url.searchParams.get("src");
  if (src) {
    if (!isHouse(src)) return Response.json({ error: "Not a house photograph" }, { status: 404 });
    await writeHidden([...(await readHidden()), src]);
    revalidate();
    return Response.json({ ok: true, hidden: (await readHidden()).length });
  }
  const id = url.searchParams.get("id") || "";
  if (!/^[a-z0-9-]+$/.test(id)) return Response.json({ error: "Which photograph?" }, { status: 400 });
  const items = await readUploads();
  if (!items.some((i) => i.id === id)) return Response.json({ error: "Already gone" }, { status: 404 });
  await writeUploads(items.filter((i) => i.id !== id));
  await fs.rm(path.join(UPLOAD_DIR, `${id}.webp`), { force: true });
  revalidate();
  return Response.json({ ok: true });
}

/** Bring every house photograph back. */
export async function PUT(req: Request) {
  if (!authorised(req)) return unauthorised();
  await writeHidden([]);
  revalidate();
  return Response.json({ items: await getGallery(), hidden: 0 });
}
