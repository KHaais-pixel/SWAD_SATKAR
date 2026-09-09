/**
 * Derives every logo asset the site needs from one source artwork.
 *
 *   node scripts/build-logo.mjs
 *
 * Source: public/brand/logo-source.png (the full plaque).
 * Outputs, all in public/brand:
 *   logo.webp          the whole plaque, for places with room
 *   logo-wordmark.webp the two name lines, for the header and tight spots
 *   logo-mark.webp     a square mark (the Himalaya), for avatars and tiles
 *   icon-512.png       app icon / apple-touch-icon
 *   favicon-32.png     browser tab
 *
 * Crops are fractions of the source, so re-exporting the artwork at another
 * size still works as long as the composition is unchanged.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = "public/brand/logo-source.png";
const OUT = "public/brand";

/** Deep navy of the plaque field, used to pad crops out to a square. */
const FIELD = { r: 0, g: 19, b: 49, alpha: 1 };

/** left, top, width, height as fractions of the source. */
const CROPS = {
  wordmark: { l: 0.085, t: 0.325, w: 0.83, h: 0.325 },
  mountain: { l: 0.225, t: 0.135, w: 0.55, h: 0.215 },
};

const box = (meta, c) => ({
  left: Math.round(meta.width * c.l),
  top: Math.round(meta.height * c.t),
  width: Math.round(meta.width * c.w),
  height: Math.round(meta.height * c.h),
});

await mkdir(OUT, { recursive: true });
const meta = await sharp(SRC).metadata();
const kb = (n) => `${Math.round(n / 1024)} kB`;

// 1. The whole plaque, capped at a sensible display width.
const full = await sharp(SRC).resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
await sharp(full).toFile(`${OUT}/logo.webp`);
console.log("logo.webp          ", kb(full.length));

// 2. The name lines on their own, for the header.
const wordmark = await sharp(SRC)
  .extract(box(meta, CROPS.wordmark))
  .resize({ width: 900, withoutEnlargement: true })
  .webp({ quality: 90 })
  .toBuffer();
await sharp(wordmark).toFile(`${OUT}/logo-wordmark.webp`);
console.log("logo-wordmark.webp ", kb(wordmark.length), JSON.stringify(box(meta, CROPS.wordmark)));

// 3. Square mark: the Himalaya, padded out with the plaque navy.
// Sharp applies `extend` after `resize`, so the padding to square has to
// happen in its own pass before the final resize.
const mBox = box(meta, CROPS.mountain);
const pad = Math.round((mBox.width - mBox.height) / 2);
const squared = await sharp(SRC)
  .extract(mBox)
  .extend({ top: pad, bottom: pad, background: FIELD })
  .png()
  .toBuffer();
const mark = await sharp(squared).resize(512, 512, { fit: "cover" }).png().toBuffer();
await sharp(mark).webp({ quality: 92 }).toFile(`${OUT}/logo-mark.webp`);
await sharp(mark).png().toFile(`${OUT}/icon-512.png`);
await sharp(mark).resize(32, 32).png().toFile(`${OUT}/favicon-32.png`);
console.log("logo-mark.webp + icons");
