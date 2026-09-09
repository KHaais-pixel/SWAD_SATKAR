/**
 * Cuts the landing-page footage into a frame sequence for scroll scrubbing.
 *
 * Two sizes are written so phones do not pay for desktop frames:
 *   public/hero/w1600/f-000.webp …   (desktop, 1600x900)
 *   public/hero/w960/f-000.webp …    (phones, 960x540)
 *   public/hero/film-1280.mp4, film-960.mp4   (the film, for idle playback)
 *
 * The source carries a small generator mark in the bottom-right corner; a
 * soft corner shadow is laid over every frame so it never shows.
 *
 *   node scripts/build-hero-frames.mjs /path/to/footage.mp4
 */
import { execFile } from "node:child_process";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";

const run = promisify(execFile);
const SRC = process.argv[2];
if (!SRC) throw new Error("usage: node scripts/build-hero-frames.mjs <video>");
const TMP = ".hero-tmp.nosync";
const FPS = 10;
const SIZES = [
  { dir: "public/hero/w1600", w: 1600, h: 900, q: 66 },
  { dir: "public/hero/w960", w: 960, h: 540, q: 62 },
];

await rm(TMP, { recursive: true, force: true });
await mkdir(TMP, { recursive: true });
await run("ffmpeg", ["-v", "error", "-i", SRC, "-vf", `scale=1600:900:flags=lanczos,fps=${FPS}`, "-q:v", "2", join(TMP, "f-%03d.png"), "-y"]);
const files = (await readdir(TMP)).filter((f) => f.endsWith(".png")).sort();

/** A soft shadow centred on the generator mark, sized for a 1600x900 frame. */
const corner = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">
    <defs>
      <radialGradient id="g" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#04141f" stop-opacity="0.98"/><stop offset="0.45" stop-color="#04141f" stop-opacity="0.92"/><stop offset="1" stop-color="#04141f" stop-opacity="0"/></radialGradient>
      <radialGradient id="c" cx="100%" cy="100%" r="30%"><stop offset="0" stop-color="#04141f" stop-opacity="0.7"/><stop offset="1" stop-color="#04141f" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#c)"/>
    <ellipse cx="1465" cy="752" rx="150" ry="112" fill="url(#g)"/>
  </svg>`,
);

for (const s of SIZES) {
  await rm(s.dir, { recursive: true, force: true });
  await mkdir(s.dir, { recursive: true });
}
let total = 0;
for (let i = 0; i < files.length; i++) {
  const base = sharp(join(TMP, files[i])).composite([{ input: corner, top: 0, left: 0 }]);
  const master = await base.png().toBuffer();
  for (const s of SIZES) {
    const buf = await sharp(master).resize(s.w, s.h, { kernel: "lanczos3" }).sharpen({ sigma: 0.6, m1: 0.4, m2: 0.8 }).linear(1.06, -7.7).modulate({ saturation: 1.04 }).webp({ quality: s.q, effort: 6, smartSubsample: true }).toBuffer();
    await writeFile(join(s.dir, `f-${String(i).padStart(3, "0")}.webp`), buf);
    if (s.w === 1600) total += buf.length;
  }
}
// The film itself, for idle playback: same look as the frames, no audio,
// keyframes every second so seeking to any scroll position is quick.
for (const f of [
  { out: "public/hero/film-1280.mp4", w: 1280, h: 720, crf: 23 },
  { out: "public/hero/film-960.mp4", w: 960, h: 540, crf: 24 },
]) {
  await run("ffmpeg", ["-v", "error", "-i", SRC, "-an", "-vf", `scale=${f.w}:${f.h}:flags=lanczos,eq=contrast=1.06:saturation=1.04,format=yuv420p`, "-c:v", "libx264", "-preset", "slow", "-crf", String(f.crf), "-g", "24", "-keyint_min", "24", "-movflags", "+faststart", f.out, "-y"]);
}
await rm(TMP, { recursive: true, force: true });
console.log(`${files.length} frames · desktop set ${(total / 1024 / 1024).toFixed(2)} MB`);
