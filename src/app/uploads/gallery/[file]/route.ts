import { promises as fs } from "node:fs";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A photograph the staff uploaded, read from disk on request. Nothing under
 * public/ can be added after the site is built, so uploads are served from
 * here; the image pipeline fetches them through this route like any other.
 * Every name is unique for life, so the file may be cached for as long as
 * anyone likes.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!/^[a-z0-9-]+\.webp$/.test(file)) return new Response("Not found", { status: 404 });
  try {
    const body = await fs.readFile(path.join(UPLOAD_DIR, file));
    return new Response(body, { headers: { "content-type": "image/webp", "content-length": String(body.length), "cache-control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
