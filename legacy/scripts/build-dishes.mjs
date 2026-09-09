/**
 * Turns the supplied dish photos into cut-outs for the carousel.
 *
 * The source JPEGs carry a rendered checkerboard where transparency should be.
 * This keys that pattern out and nothing else: a pixel is background only if
 * it and its four checker-cell neighbours all show the colour the checkerboard
 * predicts at that position, and it is reachable from the image border. White
 * bowls and plates fail the neighbour test, so they stay intact.
 *
 *   node scripts/build-dishes.mjs ~/Downloads
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const srcDir = process.argv[2] || path.join(process.env.HOME, "Downloads");
const outDir = "public/dishes";
const dishes = [
  ["PIZZA", "pizza"],
  ["NOODEL", "noodles"],
  ["SOUP", "soup"],
  ["MOMO", "momo"],
  ["LAMB", "lamb"],
];
const TOL = 26; // per-channel tolerance for "matches the checker colour"
const OUT_W = 1400;

const dist = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));

await mkdir(outDir, { recursive: true });

for (const [file, slug] of dishes) {
  const src = path.join(srcDir, `${file}.jpeg`);
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const px = (x, y) => {
    const o = (y * W + x) * 3;
    return [data[o], data[o + 1], data[o + 2]];
  };

  // Checker geometry: the two colours from the top-left corner, and the cell
  // period measured separately along a row and a column, since the render was
  // not scaled uniformly and the cells are not square. No global phase is
  // assumed: a fractional period would drift across 2,700 pixels.
  const A = px(2, 2);
  const period = (get, n) => {
    const runs = [];
    let start = 0, wasA = true;
    for (let t = 1; t < n; t++) {
      const isA = dist(get(t), A) <= 40;
      if (isA !== wasA) { runs.push(t - start); start = t; wasA = isA; }
    }
    runs.sort((a, b) => a - b);
    return runs[Math.floor(runs.length / 2)];
  };
  const cellX = period((t) => px(t, 2), Math.min(W, 1400));
  const cellY = period((t) => px(2, t), Math.min(H, 1400));
  if (!cellX || !cellY) throw new Error(`${file}: no checkerboard found`);
  const B = px(cellX + Math.floor(cellX / 2), 2);
  const lo = Math.min(A[0], B[0]) - 12, hi = Math.max(A[0], B[0]) + 12;

  const lum = (c) => (c[0] + c[1] + c[2]) / 3;
  const neutral = (c) => Math.abs(c[0] - c[1]) < 16 && Math.abs(c[1] - c[2]) < 16;
  const contrast = Math.abs(lum(A) - lum(B));
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? null : px(x, y));
  // Strict background, judged relative to its own neighbourhood so a vignette
  // across the checkerboard cannot break it: neutral grey, the pixel one cell
  // away in each direction differs by about the checker contrast, and the
  // pixel two cells away matches. A white bowl fails the first test because
  // its interior is white in every direction.
  // A pixel counts as checker when at least one full axis agrees: the pixel a
  // cell away on both sides differs by the checker contrast, and the pixel two
  // cells away matches. One axis is enough, so the last cell beside a dish is
  // still recognised; a white rim fails because its own tangent is white too.
  const strict = new Uint8Array(W * H);
  const axes = [[cellX, 0], [0, cellY]];
  const agrees = (p, x, y, dx, dy) => {
    for (const sgn of [1, -1]) {
      const q = at(x + sgn * dx, y + sgn * dy);
      const r = at(x + 2 * sgn * dx, y + 2 * sgn * dy);
      if (q) {
        const d = Math.abs(lum(p) - lum(q));
        if (!neutral(q) || d < contrast * 0.5 || d > contrast * 1.6) return false;
      }
      if (r && (!neutral(r) || Math.abs(lum(p) - lum(r)) > 16)) return false;
    }
    return true;
  };
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const p = px(x, y);
      if (!neutral(p) || lum(p) < lo - 40) continue;
      if (axes.some(([dx, dy]) => agrees(p, x, y, dx, dy))) strict[y * W + x] = 1;
    }
  // Cell boundaries ring in JPEG, so allow neutral in-range pixels that sit
  // within two pixels of strict background. That is also the only leak a white
  // rim can suffer: two pixels, which the edge blur hides.
  const soft = (x, y) => {
    const [r, g, b] = px(x, y);
    return Math.abs(r - g) < 14 && Math.abs(g - b) < 14 && r >= lo - 40 && r <= hi;
  };
  let cand = strict;
  for (let pass = 0; pass < 2; pass++) {
    const next = Uint8Array.from(cand);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (cand[i] || !soft(x, y)) continue;
        if ((x > 0 && cand[i - 1]) || (x < W - 1 && cand[i + 1]) || (y > 0 && cand[i - W]) || (y < H - 1 && cand[i + W])) next[i] = 1;
      }
    cand = next;
  }

  // Only what connects to the border is background.
  const bg = new Uint8Array(W * H);
  const stack = [];
  const push = (x, y) => {
    const i = y * W + x;
    if (cand[i] && !bg[i]) { bg[i] = 1; stack.push(i); }
  };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (stack.length) {
    const i = stack.pop();
    const x = i % W, y = (i - x) / W;
    if (x > 0) push(x - 1, y);
    if (x < W - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < H - 1) push(x, y + 1);
  }

  // Foreground islands smaller than 1.5% of the frame are watermarks and
  // stray checker, not food. Label them and hand them to the background.
  const dropIslands = () => {
    const seen = new Uint8Array(W * H);
    const minArea = W * H * 0.015;
    for (let s0 = 0; s0 < W * H; s0++) {
      if (bg[s0] || seen[s0]) continue;
      const comp = [s0]; seen[s0] = 1;
      for (let k = 0; k < comp.length; k++) {
        const i = comp[k], x = i % W, y = (i - x) / W;
        const nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
        for (const j of nb) if (j >= 0 && !bg[j] && !seen[j]) { seen[j] = 1; comp.push(j); }
      }
      if (comp.length < minArea) for (const i of comp) bg[i] = 1;
    }
  };
  dropIslands();

  // What is left touching the background is a fringe of checker no wider than
  // one cell, plus the thin connector lines of the watermark. Peel the edge
  // inward one cell deep, but only through checker-coloured pixels, so the
  // pizza crust, the sauce and the noodles are never touched. A white rim can
  // give up at most one cell, which on a smooth plate edge is invisible.
  const checkerLike = (i) => {
    const c = [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
    return neutral(c) && lum(c) >= lo - 40 && lum(c) <= hi + 12;
  };
  let frontier = [];
  for (let i = 0; i < W * H; i++) {
    if (bg[i]) continue;
    const x = i % W, y = (i - x) / W;
    if ((x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || (y > 0 && bg[i - W]) || (y < H - 1 && bg[i + W])) frontier.push(i);
  }
  for (let depth = 0; depth < Math.max(cellX, cellY) && frontier.length; depth++) {
    const next = [];
    for (const i of frontier) {
      if (bg[i] || !checkerLike(i)) continue;
      bg[i] = 1;
      const x = i % W, y = (i - x) / W;
      if (x > 0 && !bg[i - 1]) next.push(i - 1);
      if (x < W - 1 && !bg[i + 1]) next.push(i + 1);
      if (y > 0 && !bg[i - W]) next.push(i - W);
      if (y < H - 1 && !bg[i + W]) next.push(i + W);
    }
    frontier = next;
  }
  dropIslands();

  // Alpha: foreground opaque, edge blurred a touch so the cut-out sits naturally.
  const alpha = Buffer.alloc(W * H, 255);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (bg[i]) alpha[i] = 0;
    }
  const blurred = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } }).blur(0.8).toColourspace("b-w").raw().toBuffer({ resolveWithObject: true });
  const softAlpha = blurred.data;
  if (blurred.info.channels !== 1) throw new Error(`${file}: alpha came back with ${blurred.info.channels} channels`);
  let full = 0; for (let i = 0; i < softAlpha.length; i++) if (softAlpha[i] === 255) full++;
  console.log(`  alpha: ${(full / softAlpha.length * 100).toFixed(0)}% fully opaque before encode`);

  // Bounding box of the subject, with a little air around it.
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (softAlpha[y * W + x] > 8) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  const pad = 24;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(W - 1, maxX + pad); maxY = Math.min(H - 1, maxY + pad);

  const rgba = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    rgba[i * 4] = data[i * 3]; rgba[i * 4 + 1] = data[i * 3 + 1]; rgba[i * 4 + 2] = data[i * 3 + 2]; rgba[i * 4 + 3] = softAlpha[i];
  }
  const out = path.join(outDir, `${slug}.webp`);
  const meta = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .resize({ width: OUT_W, withoutEnlargement: true })
    .webp({ quality: 84, alphaQuality: 90, effort: 4 })
    .toFile(out);
  const kept = bg.reduce((n, v) => n + (1 - v), 0) / (W * H);
  console.log(`${slug}: cell ${cellX}×${cellY}px, subject ${(kept * 100).toFixed(0)}% of frame → ${meta.width}×${meta.height}, ${(meta.size / 1024).toFixed(0)} KB`);
}
