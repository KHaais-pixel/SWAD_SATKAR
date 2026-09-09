/**
 * Subsets the three self-hosted fonts.
 *
 *   node scripts/subset-fonts.mjs
 *
 * Latin faces keep printable ASCII, Latin-1 letters and the punctuation the
 * site uses, so new English copy needs no re-run. The Devanagari face carries
 * only the fixed brand and section marks — if you add new Devanagari text,
 * add it to DEVANAGARI_TEXT below and re-run.
 *
 * Originals are kept as *.full.woff2 next to the subsets.
 */
import subsetFont from "subset-font";
import { readFile, writeFile, stat, access } from "node:fs/promises";
import { join } from "node:path";

const DIR = "src/fonts";

const PUNCTUATION = "“”‘’‚„…–—·•†‡′″€₹£¥©®™→←↑↓×÷±≈≤≥°\xa0";

const LATIN = [
  // printable ASCII
  ...Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)),
  // Latin-1 letters and common accents used in menu/loan words
  ...", ¡¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝßàáâãäåæçèéêëìíîïñòóôõöøùúûüýÿ",
  // punctuation, currency, arrows and marks the design uses
  ...PUNCTUATION,
].join("");

const DEVANAGARI_TEXT = [
  "स्वाद सत्कार", // wordmark
  "मेनु", // menu
  "कथा", // story
  "थकाली", // thakali
  "साझा", // shared
  "बार", // bar
  "भेट", // visit
  "तस्बिर", // photos
].join("");

const jobs = [
  {
    file: "Fraunces-latin.woff2",
    text: LATIN,
    // Only the slice of the design space the site actually uses.
    variationAxes: { opsz: { min: 24, max: 144 }, wght: { min: 400, max: 600 }, SOFT: { min: 30, max: 60 } },
  },
  { file: "Inter-latin.woff2", text: LATIN, variationAxes: { wght: { min: 300, max: 700 } } },
  { file: "NotoSerifDevanagari.woff2", text: DEVANAGARI_TEXT + " ", variationAxes: { wght: 400 } },
];

const kb = (n) => `${Math.round(n / 1024)} kB`;

for (const job of jobs) {
  const path = join(DIR, job.file);
  const fullPath = path.replace(/\.woff2$/, ".full.woff2");
  let source;
  try {
    await access(fullPath);
    source = await readFile(fullPath); // already subset once; re-subset the original
  } catch {
    source = await readFile(path);
    await writeFile(fullPath, source);
  }
  const before = (await stat(path)).size;
  const out = await subsetFont(source, job.text, {
    targetFormat: "woff2",
    ...(job.variationAxes ? { variationAxes: job.variationAxes } : {}),
  });
  await writeFile(path, out);
  console.log(`${job.file}: ${kb(before)} -> ${kb(out.length)}`);
}
