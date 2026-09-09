/**
 * Builds the lounge hero's textures from the two renders in assets/lounge:
 *   hookah   cut from its backdrop (grown from the corners while neighbours stay
 *            alike and neutral), cropped, with a depth map
 *   bar      colour, a depth map, and a glow map (its bright parts, blurred)
 * Depth comes from .lounge-tmp.nosync/*-depth.png when scripts/lounge-depth.mjs
 * has run; otherwise a modelled fallback (a cylinder relief for the hookah,
 * painted planes for the bar). Writes public/lounge and src/data/lounge.ts.
 *   npm run lounge
 */
import sharp from "sharp";
import { existsSync } from "node:fs";
import { writeFile, mkdir } from "node:fs/promises";

const TMP = ".lounge-tmp.nosync";
const OUT = "public/lounge";
await mkdir(OUT, { recursive: true });
await mkdir(TMP, { recursive: true });

/* ------------------------------------------------------------- hookah cut */
const src = "assets/lounge/hookah.jpg";
const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;
const TOL = 13, SAT = 20;
const bg = new Uint8Array(W * H);
const queue = new Int32Array(W * H); let qh = 0, qt = 0;
const seed = (x, y) => { const i = y * W + x; if (!bg[i]) { bg[i] = 1; queue[qt++] = i; } };
// corners, top edge, inside the hose loop, and the floor inside the bottom coil
for (const [x, y] of [[2, 2], [W - 3, 2], [2, H - 3], [W - 3, H - 3], [W >> 1, 2], [Math.round(W * 0.35), Math.round(H * 0.67)], [Math.round(W * 0.5), Math.round(H * 0.905)]]) seed(x, y);
const diff = (a, b) => Math.abs(data[a * C] - data[b * C]) + Math.abs(data[a * C + 1] - data[b * C + 1]) + Math.abs(data[a * C + 2] - data[b * C + 2]);
const neutral = (j) => { const r = data[j * C], g = data[j * C + 1], b = data[j * C + 2]; return Math.max(r, g, b) - Math.min(r, g, b) < SAT; };
while (qh < qt) {
  const i = queue[qh++]; const x = i % W, y = (i / W) | 0;
  for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && !bg[j] && neutral(j) && diff(i, j) <= TOL) { bg[j] = 1; queue[qt++] = j; }
}
const obj = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) if (!bg[i]) obj[i] = 255;
// components: drop specks and the generator's mark in the corner
const label = new Int32Array(W * H); let next = 1; const sizes = [0], minX = [W];
for (let s = 0; s < W * H; s++) {
  if (!obj[s] || label[s]) continue; const id = next++; let size = 0, mx = W; let h = 0, t = 0; queue[t++] = s; label[s] = id;
  while (h < t) { const i = queue[h++]; size++; const x = i % W, y = (i / W) | 0; if (x < mx) mx = x;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && obj[j] && !label[j]) { label[j] = id; queue[t++] = j; } }
  sizes[id] = size; minX[id] = mx;
}
for (let i = 0; i < W * H; i++) if (obj[i] && (sizes[label[i]] < 200 || minX[label[i]] > W * 0.9)) obj[i] = 0;
let minx = W, maxx = 0, miny = H, maxy = 0;
for (let i = 0; i < W * H; i++) if (obj[i]) { const x = i % W, y = (i / W) | 0; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
const PAD = 48;
const crop = { left: Math.max(0, minx - PAD), top: Math.max(0, miny - PAD), width: Math.min(W, maxx + PAD) - Math.max(0, minx - PAD), height: Math.min(H, maxy + PAD) - Math.max(0, miny - PAD) };
console.log(`hookah: object x ${minx}-${maxx} y ${miny}-${maxy} · crop ${crop.width}x${crop.height}`);

// alpha: the mask, softened by a pixel so edges do not sizzle
const maskPng = await sharp(Buffer.from(obj), { raw: { width: W, height: H, channels: 1 } }).blur(0.7).png().toBuffer();
const rgba = await sharp(src).extract(crop).joinChannel(await sharp(maskPng).extract(crop).toBuffer()).png().toBuffer();
for (const h of [1536, 768]) await sharp(rgba).resize({ height: h }).webp({ quality: h > 1000 ? 88 : 84, alphaQuality: 90, effort: 6 }).toFile(`${OUT}/hookah-${h}.webp`);

/* ------------------------------------------------------------- hookah depth */
let hookahDepth;
if (existsSync(`${TMP}/hookah-depth.png`)) {
  hookahDepth = await sharp(`${TMP}/hookah-depth.png`).extract(crop).blur(1.2).toBuffer();
  console.log("hookah depth: from the model");
} else {
  // cylinder relief: across each row, every run of object pixels bulges toward the viewer
  const d = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    let x = 0;
    while (x < W) {
      if (!obj[y * W + x]) { x++; continue; }
      let e = x; while (e < W && obj[y * W + e]) e++;
      const cx = (x + e - 1) / 2, r = Math.max(1, (e - x) / 2);
      for (let k = x; k < e; k++) d[y * W + k] = Math.round(110 + 120 * Math.sqrt(Math.max(0, 1 - ((k - cx) / r) ** 2)));
      x = e;
    }
  }
  hookahDepth = await sharp(Buffer.from(d), { raw: { width: W, height: H, channels: 1 } }).extract(crop).blur(1.5).png().toBuffer();
  console.log("hookah depth: modelled relief (run scripts/lounge-depth.mjs for the real thing)");
}
// depth only matters inside the object: outside, hold the object's far value so the edge does not tear
await sharp(hookahDepth).resize({ height: 768 }).webp({ quality: 90, effort: 6 }).toFile(`${OUT}/hookah-depth.webp`);

/* ------------------------------------------------------------- bar */
const bar = "assets/lounge/bar.jpg";
const bm = await sharp(bar).metadata();
for (const h of [2048, 1024]) await sharp(bar).resize({ height: h }).webp({ quality: h > 1500 ? 86 : 82, effort: 6 }).toFile(`${OUT}/bar-${h}.webp`);
// glow: what is bright, blurred wide, for the bloom pass
await sharp(bar).resize({ height: 512 }).linear(2.2, -255 * 1.0).blur(18).webp({ quality: 80 }).toFile(`${OUT}/bar-glow.webp`);
if (existsSync(`${TMP}/bar-depth.png`)) {
  // kept sharp: a soft depth edge smears the picture when the camera moves, a hard one only nudges it
  await sharp(`${TMP}/bar-depth.png`).resize({ height: 1024 }).webp({ quality: 92, effort: 6 }).toFile(`${OUT}/bar-depth.webp`);
  console.log("bar depth: from the model");
} else {
  // painted planes: wall far, shelf unit mid, bottles a little nearer, counter and fridges near
  const sv = `<svg width="${bm.width}" height="${bm.height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#303030"/>
    <rect x="0" y="40" width="1640" height="1440" fill="#7a7a7a"/>
    <rect x="60" y="360" width="1560" height="300" fill="#8c8c8c"/>
    <rect x="60" y="1000" width="1560" height="360" fill="#8c8c8c"/>
    <rect x="0" y="1420" width="1792" height="980" fill="#b8b8b8"/>
    <rect x="1000" y="1300" width="700" height="180" fill="#c8c8c8"/>
  </svg>`;
  await sharp(Buffer.from(sv)).blur(24).resize({ height: 1024 }).webp({ quality: 90 }).toFile(`${OUT}/bar-depth.webp`);
  console.log("bar depth: painted planes (run scripts/lounge-depth.mjs for the real thing)");
}
// a still for reduced motion and for the first paint
await sharp(bar).resize({ height: 1400 }).jpeg({ quality: 78, mozjpeg: true }).toFile(`${OUT}/poster.jpg`);

/* ------------------------------------------------------------- data */
const uv = (x, y) => ({ x: +((x - crop.left) / crop.width).toFixed(4), y: +((y - crop.top) / crop.height).toFixed(4) });
const ts = `/** Written by scripts/build-lounge.mjs. Hand edits are overwritten. */
export const HOOKAH = {
  /** width / height of the cut-out texture */
  aspect: ${(crop.width / crop.height).toFixed(4)},
  /** points on the object, as texture coordinates (0..1, y down) */
  collar: ${JSON.stringify(uv(1390, 880))},
  tray: ${JSON.stringify(uv(1390, 340))},
  base: ${JSON.stringify(uv(1390, 1440))},
  loop: ${JSON.stringify(uv(830, 900))},
} as const;
export const BAR = { aspect: ${(bm.width / bm.height).toFixed(4)} } as const;
`;
await writeFile("src/data/lounge.ts", ts);
const { execSync } = await import("node:child_process");
console.log(execSync(`du -sh ${OUT}/* | sed 's|${OUT}/||'`).toString().trim().split("\n").join(" · "));
