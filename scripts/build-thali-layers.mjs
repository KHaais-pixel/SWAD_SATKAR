/**
 * Cuts the supplied thali layers out of their rendered checkerboards.
 *
 * The sources in assets/thali are JPEGs with a checkerboard painted where the
 * transparency should be. A pixel is background only if it is neutral grey,
 * the pixel one checker cell away along at least one axis differs by the
 * checker's contrast while the one two cells away matches, and it connects
 * to the image border. Bowls and rice fail the neighbour test and survive.
 * Writes public/thali/<layer>.webp (trimmed, with alpha) and the size table
 * in src/data/thali-layers.ts.
 *   node scripts/build-thali-layers.mjs
 */
import sharp from "sharp";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const srcDir = "assets/thali";
const outDir = "public/thali";
const LAYERS = [
  ["PLATE", "plate", "The steel thali"],
  ["rice_mound", "rice", "Steamed rice"],
  ["dal_bowl", "dal", "Black dal"],
  ["curry_bowl", "curry", "Curry with coriander"],
  ["green_vegetables", "greens", "Seasonal greens"],
  ["vegetable_side_dish", "vegetables", "Cauliflower and potato"],
  ["yellow_vegetable", "achar", "Bamboo shoot pickle"],
  ["cooked_vegetable", "gundruk", "Gundruk achar"],
  ["yogurt_bowl", "dahi", "Dahi"],
  ["food_item", "sweet", "The sweet"],
  ["food_components", "salad", "Lime, onion, chilli and tomato"],
];
const dist = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
await mkdir(outDir, { recursive: true });
const files = await readdir(srcDir);
const table = [];

for (const [key, slug, label] of LAYERS) {
  const file = files.find((f) => f.includes(key));
  if (!file) throw new Error(`no source for ${slug} (${key})`);
  const { data, info } = await sharp(path.join(srcDir, file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const px = (x, y) => { const o = (y * W + x) * 3; return [data[o], data[o + 1], data[o + 2]]; };
  const A = px(2, 2);
  const period = (get, n) => {
    const runs = []; let start = 0, wasA = true;
    for (let t = 1; t < n; t++) { const isA = dist(get(t), A) <= 40; if (isA !== wasA) { runs.push(t - start); start = t; wasA = isA; } }
    runs.sort((a, b) => a - b); return runs[Math.floor(runs.length / 2)];
  };
  const cellX = period((t) => px(t, 2), Math.min(W, 1400)), cellY = period((t) => px(2, t), Math.min(H, 1400));
  if (!cellX || !cellY) throw new Error(`${file}: no checkerboard found`);
  const B = px(cellX + Math.floor(cellX / 2), 2);
  const lo = Math.min(A[0], B[0]) - 12, hi = Math.max(A[0], B[0]) + 12;
  const lum = (c) => (c[0] + c[1] + c[2]) / 3;
  const neutral = (c) => Math.abs(c[0] - c[1]) < 16 && Math.abs(c[1] - c[2]) < 16;
  const contrast = Math.abs(lum(A) - lum(B));
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? null : px(x, y));
  const strict = new Uint8Array(W * H);
  const axes = [[cellX, 0], [0, cellY]];
  const agrees = (p, x, y, dx, dy) => {
    for (const sgn of [1, -1]) {
      const q = at(x + sgn * dx, y + sgn * dy), r = at(x + 2 * sgn * dx, y + 2 * sgn * dy);
      if (q) { const d = Math.abs(lum(p) - lum(q)); if (!neutral(q) || d < contrast * 0.5 || d > contrast * 1.6) return false; }
      if (r && (!neutral(r) || Math.abs(lum(p) - lum(r)) > 16)) return false;
    }
    return true;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = px(x, y); if (!neutral(p) || lum(p) < lo - 40) continue;
    if (axes.some(([dx, dy]) => agrees(p, x, y, dx, dy))) strict[y * W + x] = 1;
  }
  const soft = (x, y) => { const [r, g, b] = px(x, y); return Math.abs(r - g) < 14 && Math.abs(g - b) < 14 && r >= lo - 40 && r <= hi; };
  let cand = strict;
  for (let pass = 0; pass < 2; pass++) {
    const next = Uint8Array.from(cand);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (cand[i] || !soft(x, y)) continue;
      if ((x > 0 && cand[i - 1]) || (x < W - 1 && cand[i + 1]) || (y > 0 && cand[i - W]) || (y < H - 1 && cand[i + W])) next[i] = 1;
    }
    cand = next;
  }
  const bg = new Uint8Array(W * H); const stack = [];
  const push = (x, y) => { const i = y * W + x; if (cand[i] && !bg[i]) { bg[i] = 1; stack.push(i); } };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (stack.length) { const i = stack.pop(); const x = i % W, y = (i - x) / W; if (x > 0) push(x - 1, y); if (x < W - 1) push(x + 1, y); if (y > 0) push(x, y - 1); if (y < H - 1) push(x, y + 1); }
  const dropIslands = () => {
    const seen = new Uint8Array(W * H); const minArea = W * H * 0.01;
    for (let s0 = 0; s0 < W * H; s0++) {
      if (bg[s0] || seen[s0]) continue; const comp = [s0]; seen[s0] = 1;
      for (let k = 0; k < comp.length; k++) { const i = comp[k], x = i % W, y = (i - x) / W; for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && !bg[j] && !seen[j]) { seen[j] = 1; comp.push(j); } }
      if (comp.length < minArea) for (const i of comp) bg[i] = 1;
    }
  };
  dropIslands();
  const checkerLike = (i) => { const c = [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]]; return neutral(c) && lum(c) >= lo - 40 && lum(c) <= hi + 12; };
  let frontier = [];
  for (let i = 0; i < W * H; i++) { if (bg[i]) continue; const x = i % W, y = (i - x) / W; if ((x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || (y > 0 && bg[i - W]) || (y < H - 1 && bg[i + W])) frontier.push(i); }
  for (let depth = 0; depth < Math.max(cellX, cellY) && frontier.length; depth++) {
    const next = [];
    for (const i of frontier) { if (bg[i] || !checkerLike(i)) continue; bg[i] = 1; const x = i % W, y = (i - x) / W; if (x > 0 && !bg[i - 1]) next.push(i - 1); if (x < W - 1 && !bg[i + 1]) next.push(i + 1); if (y > 0 && !bg[i - W]) next.push(i - W); if (y < H - 1 && !bg[i + W]) next.push(i + W); }
    frontier = next;
  }
  dropIslands();
  // Checker cells that sat in a soft shadow break the alternation test and
  // survive as grey blocks along the edge. Grow the background into any
  // neutral grey pixel of checker luminance that touches it, until it meets
  // colour. Food is colour; the steel of a bowl is not, so bowls get only a
  // shallow pass.
  const BOWL = ["dal", "curry", "dahi", "sweet"].includes(slug);
  const greyish = (i) => { const c = [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]]; return Math.abs(c[0] - c[1]) < 18 && Math.abs(c[1] - c[2]) < 18 && lum(c) >= lo - 45 && lum(c) <= hi + 25; };
  // Bowls are steel, the same grey as the checker: only a shallow pass, and
  // what little remains sits on the steel plate where it cannot be seen.
  const growable = greyish;
  const COLOURFUL = !BOWL && slug !== "plate" && slug !== "rice";
  // A pocket of checker enclosed by food (between the lime and the onion) never
  // reaches the border. Any sizeable region that still reads as periodic is checker.
  if (COLOURFUL) {
    const seen = new Uint8Array(W * H);
    const isChecker = greyish;
    for (let s0 = 0; s0 < W * H; s0++) {
      if (bg[s0] || seen[s0] || !isChecker(s0)) continue;
      const comp = [s0]; seen[s0] = 1;
      for (let k = 0; k < comp.length; k++) { const i = comp[k], x = i % W, y = (i - x) / W; for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && !bg[j] && !seen[j] && greyish(j)) { seen[j] = 1; comp.push(j); } }
      if (comp.length > 40) for (const i of comp) bg[i] = 1;
    }
  }
  let edge = [];
  for (let i = 0; i < W * H; i++) { if (bg[i]) continue; const x = i % W, y = (i - x) / W; if ((x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || (y > 0 && bg[i - W]) || (y < H - 1 && bg[i + W])) edge.push(i); }
  for (let it = 0; it < (BOWL ? 3 : 120) && edge.length; it++) {
    const next = [];
    for (const i of edge) { if (bg[i] || !growable(i)) continue; bg[i] = 1; const x = i % W, y = (i - x) / W; if (x > 0 && !bg[i - 1]) next.push(i - 1); if (x < W - 1 && !bg[i + 1]) next.push(i + 1); if (y > 0 && !bg[i - W]) next.push(i - W); if (y < H - 1 && !bg[i + W]) next.push(i + W); }
    edge = next;
  }
  dropIslands();
  const alpha = Buffer.alloc(W * H, 255);
  for (let i = 0; i < W * H; i++) if (bg[i]) alpha[i] = 0;
  // The thali is a disc: its steel rim is the same grey as the checker and
  // gets bitten. Take the disc's extents from what survived and cut a clean
  // ellipse instead, a shade inside the bites' outer edge.
  if (slug === "plate") {
    let mnx = W, mny = H, mxx = 0, mxy = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (alpha[y * W + x]) { if (x < mnx) mnx = x; if (x > mxx) mxx = x; if (y < mny) mny = y; if (y > mxy) mxy = y; }
    const cx = (mnx + mxx) / 2, cy = (mny + mxy) / 2, rx = (mxx - mnx) / 2 - 2, ry = (mxy - mny) / 2 - 2;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
      alpha[y * W + x] = d <= 1 ? 255 : 0;
    }
    console.log(`  plate disc: centre ${cx.toFixed(0)},${cy.toFixed(0)} radii ${rx.toFixed(0)}×${ry.toFixed(0)}`);
  }
  const blurred = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } }).blur(slug === "plate" ? 1.2 : 1.0).toColourspace("b-w").raw().toBuffer({ resolveWithObject: true });
  if (blurred.info.channels !== 1) throw new Error("alpha channels");
  const softAlpha = blurred.data;
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (softAlpha[y * W + x] > 8) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  const pad = 6;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(W - 1, maxX + pad); maxY = Math.min(H - 1, maxY + pad);
  const rgba = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) { rgba[i * 4] = data[i * 3]; rgba[i * 4 + 1] = data[i * 3 + 1]; rgba[i * 4 + 2] = data[i * 3 + 2]; rgba[i * 4 + 3] = softAlpha[i]; }
  const outW = slug === "plate" ? 1400 : 900;
  const meta = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 }).resize({ width: outW, withoutEnlargement: true }).webp({ quality: 84, alphaQuality: 90, effort: 5 }).toFile(path.join(outDir, `${slug}.webp`));
  table.push({ id: slug, label, src: `/thali/${slug}.webp`, w: meta.width, h: meta.height });
  console.log(`${slug.padEnd(11)} cell ${cellX}×${cellY} · subject ${((bg.reduce((n, v) => n + (1 - v), 0) / (W * H)) * 100).toFixed(0)}% → ${meta.width}×${meta.height}, ${(meta.size / 1024).toFixed(0)} KB`);
}
await writeFile("src/data/thali-layers.ts", `/** Written by scripts/build-thali-layers.mjs. Hand edits are overwritten. */\nexport interface ThaliLayer { id: string; label: string; src: string; w: number; h: number }\nexport const THALI_LAYERS: ThaliLayer[] = ${JSON.stringify(table, null, 2)};\n`);
console.log("wrote src/data/thali-layers.ts");
