/**
 * Cuts the serving sequence in `public/thali` from the source footage.
 *
 *   node scripts/build-thali-frames.mjs /path/to/serving.mp4
 *
 * The video is cropped square to the plate, sampled at 8 frames a second and
 * written as WebP. Needs ffmpeg on PATH. Re-run after replacing the footage,
 * then check the frame numbers in `src/data/thali.ts` still match the courses.
 */
import { execFile } from "node:child_process";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { join } from "node:path";
import sharp from "sharp";

const run = promisify(execFile);

const SRC = process.argv[2];
if (!SRC) {
  console.error("usage: node scripts/build-thali-frames.mjs <video>");
  process.exit(1);
}

const TMP = ".thali-tmp.nosync";
const OUT = "public/thali";
/** Square crop around the plate in the 1280x720 source, then the export size. */
const CROP = "crop=720:720:280:0";
const SIZE = 720;
const FPS = 10;

await rm(TMP, { recursive: true, force: true });
await mkdir(TMP, { recursive: true });
await mkdir(OUT, { recursive: true });

await run("ffmpeg", ["-v", "error", "-i", SRC, "-vf", `${CROP},scale=${SIZE}:${SIZE},fps=${FPS}`, "-q:v", "2", join(TMP, "f-%03d.png"), "-y"]);

const files = (await readdir(TMP)).filter((f) => f.endsWith(".png")).sort();
let total = 0;
for (let i = 0; i < files.length; i++) {
  const buf = await sharp(join(TMP, files[i])).resize(SIZE, SIZE, { kernel: "lanczos3" }).sharpen({ sigma: 0.6, m1: 0.4, m2: 0.8 }).webp({ quality: 68, effort: 6, smartSubsample: true }).toBuffer();
  await writeFile(join(OUT, `f-${String(i).padStart(3, "0")}.webp`), buf);
  total += buf.length;
}
await rm(TMP, { recursive: true, force: true });

console.log(`${files.length} frames · ${(total / 1024 / 1024).toFixed(2)} MB · ${Math.round(total / files.length / 1024)} kB average`);
console.log(`Set FRAME_COUNT to ${files.length} in src/data/thali.ts if it changed.`);
