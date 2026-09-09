/** Accessibility + reduced-motion audit. */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const base = process.argv[2] || "http://localhost:3123";
const browser = await chromium.launch();

const run = async (label, setup, opts = {}) => {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1440, height: 900 }, reducedMotion: opts.reduced ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  await page.goto(base + (opts.path || "/"), { waitUntil: "domcontentloaded", timeout: 400000 });
  await page.waitForTimeout(9000);
  if (setup) await setup(page);
  // The embedded Google map brings its own controls; they are Google's to fix.
  const results = await new AxeBuilder({ page }).exclude('iframe[title^="Map"]').withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const violations = results.violations.filter((v) => v.impact !== "minor" || true);
  console.log(`\n== ${label}: ${violations.length} violation(s)`);
  for (const v of violations) {
    console.log(`  [${v.impact}] ${v.id}: ${v.help}`);
    for (const n of v.nodes.slice(0, 3)) console.log(`      ${n.target.join(" ")} — ${(n.failureSummary || "").split("\n").slice(1, 3).join(" / ").slice(0, 150)}`);
  }
  await ctx.close();
  return violations.length;
};

let total = 0;
total += await run("home (top)", null);
total += await run("home (rating)", async (p) => {
  await p.locator("#reviews").scrollIntoViewIfNeeded();
  await p.waitForTimeout(800);
});
total += await run("menu (book)", async (p) => {
  await p.locator('[aria-roledescription="menu book"]').scrollIntoViewIfNeeded();
  await p.waitForTimeout(800);
}, { path: "/menu" });
total += await run("menu (list)", async (p) => {
  await p.locator("#list").scrollIntoViewIfNeeded();
  await p.waitForTimeout(800);
}, { path: "/menu" });
total += await run("story", null, { path: "/story" });
total += await run("bar", null, { path: "/bar" });
total += await run("visit", null, { path: "/visit" });
total += await run("mobile 360 home", null, { viewport: { width: 360, height: 780 } });
total += await run("mobile 360 menu", null, { viewport: { width: 360, height: 780 }, path: "/menu" });
total += await run("mobile 360 visit", null, { viewport: { width: 360, height: 780 }, path: "/visit" });
total += await run("mobile 360 pages open", async (p) => {
  await p.getByRole("button", { name: "Open pages" }).click();
  await p.waitForTimeout(400);
}, { viewport: { width: 360, height: 780 } });
total += await run("reduced motion", null, { reduced: true });

// Reduced-motion behaviour checks
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
await page.goto(base + "/menu", { waitUntil: "networkidle" });
await page.waitForTimeout(9000);
const rm = await page.evaluate(() => ({
  lenis: document.documentElement.classList.contains("lenis"),
  pinSpacers: document.querySelectorAll(".pin-spacer").length,
  marqueeAnimation: (() => {
    const el = document.querySelector(".animate-marquee");
    return el ? getComputedStyle(el).animationName : "none";
  })(),
  leaf: document.querySelectorAll(".menu-leaf").length,
}));
console.log("\n== reduced-motion behaviour:", JSON.stringify(rm));
// Turn a page under reduced motion: should cross-fade, no 3D leaf
await page.locator('[aria-roledescription="menu book"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
await page.getByRole("button", { name: "Next page" }).first().click();
await page.waitForTimeout(500);
const after = await page.evaluate(() => ({
  leaf: document.querySelectorAll(".menu-leaf").length,
  live: document.querySelector('[aria-live="polite"]')?.textContent?.trim(),
}));
console.log("   after next under reduced motion:", JSON.stringify(after));
await browser.close();
console.log(`\nTOTAL violations: ${total}`);
