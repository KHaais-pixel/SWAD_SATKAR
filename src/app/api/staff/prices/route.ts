import { revalidatePath } from "next/cache";
import { CONTENT_PATHS, getMenus, writePrices, type PriceOverrides } from "@/lib/content";
import { authorised, unauthorised } from "@/lib/staff-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The menus as the site shows them now, and the changes on top of the printed prices. */
export async function GET(req: Request) {
  if (!authorised(req)) return unauthorised();
  return Response.json(await getMenus());
}

/** The full set of changes, replacing what was there. An empty set restores every printed price. */
export async function PUT(req: Request) {
  if (!authorised(req)) return unauthorised();
  let body: Partial<PriceOverrides>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Nothing to save" }, { status: 400 });
  }
  const ok = (o: unknown) => !o || (typeof o === "object" && Object.values(o as object).every((v) => typeof v === "string" && v.length <= 24));
  if (!ok(body.thakali) || !ok(body.thai) || !ok(body.bar)) return Response.json({ error: "A price is too long" }, { status: 400 });
  await writePrices({ thakali: body.thakali || {}, thai: body.thai || {}, bar: body.bar || {}, spirits: body.spirits || {} });
  CONTENT_PATHS.forEach((p) => revalidatePath(p));
  return Response.json(await getMenus());
}
