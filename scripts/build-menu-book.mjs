/**
 * Cuts the menu-board photographs into book pages.
 *
 *   node scripts/build-menu-book.mjs
 *
 * Each photograph is already an open spread, so the gap between its two
 * pages is found (the flattest column near the centre, which is the printed
 * margin), the spread is cropped symmetrically about it so both pages come
 * out the same width, and each page is written on its own. Nothing is
 * recomposed and no menu content is touched.
 *
 * Writes public/menu-book/w<size>/s<n>-<l|r>.webp and src/data/menu-book.ts.
 */
import sharp from "sharp";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const SPREADS = [
  { src: "public/photos/menu-board-1.jpg", left: "Cover", right: "Starters, soups and veg snacks" },
  { src: "public/photos/menu-board-2.jpg", left: "Thakali sets, dhido and rice", right: "Momo, noodles, pizza and burgers" },
  { src: "public/photos/menu-board-3.jpg", left: "Non-veg snacks", right: "Seafood and khaja sets" },
  { src: "public/photos/menu-board-4.jpg", left: "Thai food", right: "The bar menu" },
];
/**
 * One master per page, drawn at twice the photograph's own resolution and
 * sharpened after the enlargement, so the printed type has a clean edge to
 * it when a 2x screen asks for a big rendition. The image pipeline serves
 * each screen the width it needs from this.
 */
const SIZES = [{ w: 1800, h: 2488, quality: 86 }];
/** unsharp mask, tuned for small printed type: mostly on the edges, little on the flat paper */
const SHARPEN = { sigma: 1.3, m1: 0.6, m2: 2.6, x1: 2.5, y2: 12, y3: 20 };
const OUT = "public/menu-book";

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const seamOf = async (file) => {
  const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  let best = Math.round(W / 2), bestV = Infinity;
  for (let x = Math.round(W * 0.42); x < W * 0.58; x++) {
    let sum = 0;
    for (let y = 0; y < H; y++) sum += data[y * W + x];
    const m = sum / H;
    let v = 0;
    for (let y = 0; y < H; y++) { const d = data[y * W + x] - m; v += d * d; }
    const flat = Math.sqrt(v / H);
    if (flat < bestV) { bestV = flat; best = x; }
  }
  return { seam: best, W, H };
};

const pages = [];
for (let i = 0; i < SPREADS.length; i++) {
  const { src, left, right } = SPREADS[i];
  const { seam, W, H } = await seamOf(src);
  // symmetric about the seam, so both pages are the same width
  const half = Math.min(seam, W - seam);
  const x0 = seam - half;
  let bytes = 0;
  for (const s of SIZES) {
    for (const [side, offset] of [["l", x0], ["r", seam]]) {
      const out = join(OUT, `s${i}-${side}.webp`);
      const info = await sharp(src)
        .extract({ left: offset, top: 0, width: half, height: H })
        .resize(s.w, s.h, { fit: "cover", position: "centre", kernel: "lanczos3" })
        .sharpen(SHARPEN)
        .webp({ quality: s.quality, effort: 5 })
        .toFile(out);
      bytes += info.size;
    }
  }
  pages.push({ left, right });
  console.log(`spread ${i}: seam ${seam}/${W} (${((seam / W) * 100).toFixed(1)}%) · page ${half}×${H} · ${(bytes / 1024).toFixed(0)} kB`);
}

await writeFile(
  "src/data/menu-book.ts",
  `/** Written by scripts/build-menu-book.mjs. Hand edits are overwritten. */
export const SPREADS = ${JSON.stringify(pages, null, 2)};
export const PAGE_W = ${SIZES[0].w};
export const PAGE_H = ${SIZES[0].h};
/** A page of the printed menu: spread \`i\`, left or right. */
export const bookPage = (i: number, side: "l" | "r") => \`/menu-book/s\${i}-\${side}.webp\`;
/** A page is this many times as tall as it is wide. */
export const PAGE_RATIO = ${(SIZES[0].h / SIZES[0].w).toFixed(4)};
/** Viewports of scroll per page turn. */
export const TURN_SCROLL = 1.1;
`,
);
console.log("wrote src/data/menu-book.ts");
