/**
 * Full-page screenshots of every route, desktop and phone, plus page errors,
 * console noise and horizontal overflow.  node scripts/shots.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const base = process.argv[2] || "http://localhost:3123";
const routes = ["/", "/story", "/thakali", "/thai", "/bar", "/gallery", "/book", "/contact", "/staff"];
await mkdir("shots", { recursive: true });
const b = await chromium.launch();
const issues = [];
for (const [label, vp] of [["desktop", { width: 1440, height: 900 }], ["phone", { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => issues.push(`${label} pageerror: ${e.message}`));
  p.on("console", (m) => (m.type() === "error" || m.type() === "warning") && issues.push(`${label} ${m.type()}: ${m.text().slice(0, 140)}`));
  for (const r of routes) {
    await p.goto(base + r, { waitUntil: "domcontentloaded", timeout: 120000 });
    await p.waitForTimeout(1500);
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += vp.height * 0.7) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(120); }
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(600);
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 0) issues.push(`${label} ${r}: horizontal overflow ${overflow}px`);
    const name = r === "/" ? "home" : r.slice(1);
    await p.screenshot({ path: `shots/${label}-${name}.png`, fullPage: true });
    console.log(`${label} ${r} · ${h}px${overflow > 0 ? ` · OVERFLOW ${overflow}px` : ""}`);
  }
  await ctx.close();
}
await b.close();
console.log(issues.length ? "\n--- issues ---\n" + [...new Set(issues)].join("\n") : "\nno page errors, no console noise, no horizontal overflow");
