/**
 * Screenshot harness for local review.
 *   node scripts/shots.mjs [baseUrl] [only]
 * Writes PNGs to ./shots. Not part of the app build.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.argv[2] || "http://localhost:3123";
const only = process.argv[3];
const outDir = "shots";
await mkdir(outDir, { recursive: true });

const shots = [
  { name: "01-hero", path: "/", vw: 1440, vh: 900, y: 0 },
  { name: "02-story", path: "/story", vw: 1440, vh: 900, sel: "#story", offset: -60 },
  { name: "03-plate-1", path: "/", vw: 1440, vh: 900, scrollFrac: 0.14 },
  { name: "04-plate-3", path: "/", vw: 1440, vh: 900, scrollFrac: 0.26 },
  { name: "05-menu-book", path: "/menu", vw: 1440, vh: 900, sel: "#menu", offset: 130 },
  { name: "06-bar", path: "/bar", vw: 1440, vh: 900, sel: "#bar", offset: -60 },
  { name: "08-reviews", path: "/", vw: 1440, vh: 900, sel: "#reviews", offset: -60 },
  { name: "09-visit", path: "/visit", vw: 1440, vh: 900, sel: "#visit", offset: -60 },
  { name: "10-hero-360", path: "/", vw: 360, vh: 780, y: 0 },
  { name: "11-menu-360", path: "/menu", vw: 360, vh: 780, sel: "#menu", offset: 80 },
  { name: "12-plate-360", path: "/", vw: 360, vh: 780, scrollFrac: 0.22 },
  { name: "13-menu-list", path: "/menu", vw: 1440, vh: 900, sel: "#list", offset: -60 },
  { name: "14-booking", path: "/?book=1", vw: 1440, vh: 900, y: 0, wait: 1800 },
  { name: "15-booking-360", path: "/?book=1", vw: 360, vh: 780, y: 0, wait: 1800 },
  { name: "16-reduced", path: "/", vw: 1440, vh: 900, scrollFrac: 0.2, reduced: true },
  { name: "17-hero-768", path: "/", vw: 768, vh: 1024, y: 0 },
];

const browser = await chromium.launch();
const errors = [];
for (const s of shots) {
  if (only && !s.name.includes(only)) continue;
  const ctx = await browser.newContext({
    viewport: { width: s.vw, height: s.vh },
    deviceScaleFactor: 1,
    reducedMotion: s.reduced ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${s.name}: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`${s.name} console: ${m.text().slice(0, 160)}`));
  await page.goto(base + s.path, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);
  try {
    if (s.sel) {
      const box = await page.locator(s.sel).boundingBox({ timeout: 8000 });
      if (box) await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), box.y + (s.offset || 0));
    } else if (s.scrollFrac !== undefined) {
      await page.evaluate((f) => window.scrollTo({ top: document.documentElement.scrollHeight * f, behavior: "instant" }), s.scrollFrac);
    } else {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), s.y || 0);
    }
  } catch (e) {
    errors.push(`${s.name}: ${e instanceof Error ? e.message.split("\n")[0] : e}`);
  }
  await page.waitForTimeout(s.wait || 1400);
  // Horizontal overflow check
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 0) errors.push(`${s.name}: horizontal overflow ${overflow}px`);
  await page.screenshot({ path: `${outDir}/${s.name}.png` });
  console.log("shot", s.name, overflow > 0 ? `OVERFLOW ${overflow}px` : "");
  await ctx.close();
}
await browser.close();
if (errors.length) {
  console.log("\n--- issues ---");
  for (const e of [...new Set(errors)]) console.log(e);
} else {
  console.log("\nno page errors, no horizontal overflow");
}
