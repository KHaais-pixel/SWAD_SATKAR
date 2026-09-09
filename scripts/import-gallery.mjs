/**
 * Put a batch of photographs into the gallery through the staff API, the same
 * way the panel does: each one is resized, written as WebP into
 * content/uploads/gallery/ and listed in content/gallery.json, so it can be
 * deleted again from the staff panel.
 *
 *   node scripts/import-gallery.mjs [baseUrl]
 *
 * The list below is the batch. Notes describe what is in the shot; no dish
 * names or prices are invented.
 */
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const base = process.argv[2] || "http://localhost:3123";
const CODE = process.env.STAFF_PASSCODE || "swad2026";
const DL = "/Users/kharuhangrai/Downloads";

const BATCH = [
  ["5357d401-effb-4324-b768-82dabce5cce8.JPG", "The Table", "A set plate: rice, dal, curry, greens, achar and papad"],
  ["af8e3cc5-8411-4ac9-be82-1dcc943bad3c.JPG", "The Table", "Curry and rice, in the bowl"],
  ["4fffa301-11ae-4bc0-b220-3a42a4a7baf5.JPG", "The Table", "A set plate with dal, curry, dahi and pickles"],
  ["9347223e-28d8-4657-b8a7-1e9119f3b7b8.JPG", "The Table", "Fried noodles with egg and vegetables"],
  ["7f480c9b-141b-4ed0-9090-5cb960059668.JPG", "The Table", "Spaghetti under tomato sauce"],
  ["9737e695-46b3-4cd8-9d60-854849b97434.JPG", "The Table", "A whole fish off the grill, with vegetables and sauce"],
  ["104fdbcc-4332-495a-89cf-27a74e332400.JPG", "The Table", "Grilled wings with salad and green chutney"],
  ["0fe331c9-51ef-4650-b93a-1597e30a66d3.JPG", "The Table", "Two plates off the grill, with onion and chutney"],
  ["83ab0f2e-0b82-4347-a675-19c18a46ae89.JPG", "The Table", "A salad with chicken, olives and cheese"],
  ["5890e2fb-084f-4990-bee9-495969ea8312.JPG", "The Table", "Potato, fried and tossed, with spring onion"],
  ["6185e742-c995-4cc4-9275-38309dcfdd9f.JPG", "The Table", "Potato with fried garlic and dried chilli"],
  ["c452723e-6cd4-412b-aae0-c1865bf61fb1.JPG", "Our Team", "The team at the bar, after service"],
  ["71a56e07-186b-4d73-b025-c74dd26b3ed7.JPG", "Our Team", "The kitchen in whites, the floor in blue"],
  ["0e32311d-410d-494e-a8aa-4402d15e533b.JPG", "Our Team", "Fruit carving, set up for a birthday in the house"],
  // e9cbad81 is the same photograph as the house "mixed grill plate", so it is not imported again
];

// start from a clean set: every previous import goes, so a half-finished run
// can never leave a photograph wearing another one's caption
const before = await (await fetch(`${base}/api/staff/gallery`, { headers: { "x-staff-code": CODE }, cache: "no-store" })).json();
for (const it of before.uploads) {
  await fetch(`${base}/api/staff/gallery?id=${encodeURIComponent(it.id)}`, { method: "DELETE", headers: { "x-staff-code": CODE } });
}
let left = (await (await fetch(`${base}/api/staff/gallery`, { headers: { "x-staff-code": CODE }, cache: "no-store" })).json()).uploads;
for (const it of left) await fetch(`${base}/api/staff/gallery?id=${encodeURIComponent(it.id)}`, { method: "DELETE", headers: { "x-staff-code": CODE } });
left = (await (await fetch(`${base}/api/staff/gallery`, { headers: { "x-staff-code": CODE }, cache: "no-store" })).json()).uploads;
if (left.length) { console.error(`could not clear ${left.length} earlier uploads; stopping rather than importing on top of them`); process.exit(1); }
if (before.uploads.length) console.log(`cleared ${before.uploads.length} earlier uploads\n`);

let added = 0, failed = 0;
for (const [file, album, note] of BATCH) {
  const bytes = await readFile(`${DL}/${file}`);
  const fd = new FormData();
  fd.append("file", new Blob([bytes], { type: "image/jpeg" }), basename(file));
  fd.append("album", album);
  fd.append("tag", album);
  fd.append("note", note);
  let ok = false;
  // one retry: a write that lands while another request is reading can 500
  for (let attempt = 0; attempt < 2 && !ok; attempt++) {
    const r = await fetch(`${base}/api/staff/gallery`, { method: "POST", headers: { "x-staff-code": CODE }, body: fd });
    const j = await r.json().catch(() => ({}));
    if (r.ok) { ok = true; added++; console.log(`  + ${album.padEnd(9)} ${String(j.item.w).padStart(4)}x${j.item.h}  ${note}`); }
    else if (attempt) { failed++; console.log(`  ! ${file}: ${j.error || r.status}`); }
  }
}
const list = await (await fetch(`${base}/api/staff/gallery`, { headers: { "x-staff-code": CODE }, cache: "no-store" })).json();
console.log(`\nadded ${added}, failed ${failed} · gallery now holds ${list.items.length} photographs`);
const byAlbum = {};
list.items.forEach((i) => { byAlbum[i.album || "Untitled"] = (byAlbum[i.album || "Untitled"] || 0) + 1; });
console.log(Object.entries(byAlbum).map(([a, n]) => `${a}: ${n}`).join(" · "));
