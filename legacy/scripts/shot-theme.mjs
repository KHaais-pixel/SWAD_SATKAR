import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const base = process.argv[2] || "http://localhost:3210";
await mkdir("shots", { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto(base, { waitUntil: "networkidle", timeout: 180000 });
await p.waitForTimeout(2500);
await p.screenshot({ path: "shots/blue-01-hero.png" });
console.log("hero shot");
const bg = await p.evaluate(() => {
  const cs = getComputedStyle(document.body);
  const root = getComputedStyle(document.documentElement);
  return { body: cs.backgroundColor, azure: root.getPropertyValue("--azure").trim(), ink: root.getPropertyValue("--ink").trim(), paper: root.getPropertyValue("--paper").trim() };
});
console.log("tokens live:", JSON.stringify(bg));
for (const [name, sel, path] of [["blue-02-story", "#story", "/story"], ["blue-03-menu", "#menu", "/menu"], ["blue-04-bar", "#bar", "/bar"], ["blue-05-visit", "#visit", "/visit"]]) {
  try {
    await p.goto(base + path, { waitUntil: "networkidle", timeout: 180000 });
    await p.waitForTimeout(2500);
    const box = await p.locator(sel).boundingBox({ timeout: 20000 });
    if (box) await p.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), box.y + (sel === "#menu" ? 130 : -60));
    await p.waitForTimeout(2000);
    await p.screenshot({ path: `shots/${name}.png` });
    console.log(name);
  } catch (e) { console.log(name, "skipped:", String(e).split("\n")[0].slice(0, 60)); }
}
console.log(errs.length ? "ERRORS: " + [...new Set(errs)].join(" | ") : "no page errors");
await b.close();
