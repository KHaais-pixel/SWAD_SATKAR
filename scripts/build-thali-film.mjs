/**
 * Turns the serving footage into the frame set the plate section scrubs.
 *
 *   node scripts/build-thali-film.mjs [source.mp4]
 *
 * The shot is top-down and the plate is centred, so each frame is cropped to
 * the centre square before scaling: no pixel is spent on the parts of the
 * table the panel never shows. Every source frame is kept (the footage is
 * 24fps and one continuous take), and the canvas blends between neighbours,
 * so the scrub is continuous rather than stepped.
 *
 * Writes public/thali-film/w<size>/f-###.webp, a poster for the still
 * version, and src/data/thali-film.ts.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readdir, rm, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const run = promisify(execFile);
const SRC = process.argv[2] || ".thali-tmp.nosync/film/source.mp4";
const TMP = ".thali-tmp.nosync/film/frames";
const OUT = "public/thali-film";
/** Wide screens and phones get their own set; nothing fetches both. */
const SIZES = [
  { w: 800, quality: 56 },
  { w: 460, quality: 58 },
];

await rm(TMP, { recursive: true, force: true });
await mkdir(TMP, { recursive: true });
await rm(OUT, { recursive: true, force: true });
for (const s of SIZES) await mkdir(join(OUT, `w${s.w}`), { recursive: true });

// centre square, full frame rate
await run("ffmpeg", ["-v", "error", "-i", SRC, "-vf", "crop=ih:ih:(iw-ih)/2:0,scale=1080:1080:flags=lanczos", "-q:v", "2", join(TMP, "f-%03d.png"), "-y"]);
const files = (await readdir(TMP)).filter((f) => f.endsWith(".png")).sort();
if (!files.length) throw new Error("ffmpeg produced no frames");

const totals = new Map(SIZES.map((s) => [s.w, 0]));
for (let i = 0; i < files.length; i++) {
  const src = join(TMP, files[i]);
  const name = `f-${String(i).padStart(3, "0")}.webp`;
  for (const s of SIZES) {
    const out = join(OUT, `w${s.w}`, name);
    await sharp(src).resize(s.w, s.w, { kernel: "lanczos3" }).webp({ quality: s.quality, effort: 5, smartSubsample: true }).toFile(out);
    totals.set(s.w, totals.get(s.w) + (await stat(out)).size);
  }
}
// the finished plate, for the still version; and the empty plate, which
// stands under the canvas until the frames arrive so nothing flips
await sharp(join(TMP, files[files.length - 1])).resize(1000, 1000, { kernel: "lanczos3" }).jpeg({ quality: 82, mozjpeg: true }).toFile(join(OUT, "poster.jpg"));
await sharp(join(TMP, files[0])).resize(1000, 1000, { kernel: "lanczos3" }).jpeg({ quality: 80, mozjpeg: true }).toFile(join(OUT, "first.jpg"));

await writeFile(
  "src/data/thali-film.ts",
  `/** Written by scripts/build-thali-film.mjs. Hand edits are overwritten. */
export const FILM_FRAMES = ${files.length};
export type FilmSize = ${SIZES.map((s) => s.w).join(" | ")};
export const filmFrame = (i: number, size: FilmSize) => \`/thali-film/w\${size}/f-\${String(i).padStart(3, "0")}.webp\`;
export const FILM_POSTER = "/thali-film/poster.jpg";\nexport const FILM_FIRST = "/thali-film/first.jpg";
/** Viewports of scroll the serving takes. */
export const FILM_SCROLL = 4;
`,
);
for (const s of SIZES) console.log(`w${s.w}: ${files.length} frames · ${(totals.get(s.w) / 1024 / 1024).toFixed(2)} MB · ${Math.round(totals.get(s.w) / files.length / 1024)} kB average`);
console.log("wrote src/data/thali-film.ts");
