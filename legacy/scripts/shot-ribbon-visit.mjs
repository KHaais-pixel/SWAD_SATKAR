/** The ribbon must dim when a heading crosses it: shoot the visit heading crossing the band, like the user's screenshot. */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1052, height: 860 } })).newPage(); p.setDefaultTimeout(150000);
await p.goto(base + "/visit", { waitUntil: "domcontentloaded", timeout: 400000 }); await p.waitForTimeout(10000);
// put the visit heading where the band is
await p.evaluate(() => { const h = document.querySelector("#visit h2"); const y = h.getBoundingClientRect().top + scrollY - 90; window.scrollTo({ top: y, behavior: "instant" }); });
await p.waitForTimeout(1600);
const r = await p.evaluate(() => { const g = document.querySelector('[data-segment="bar"]'); const h = document.querySelector("#visit h2").getBoundingClientRect(); return { barOpacity: +(+getComputedStyle(g).opacity).toFixed(2), headingTop: Math.round(h.top) }; });
await p.screenshot({ path: "shots/ribbon-visit-heading.png" });
await p.evaluate(() => window.scrollBy({ top: 420, behavior: "instant" })); await p.waitForTimeout(1600);
const r2 = await p.evaluate(() => +(+getComputedStyle(document.querySelector('[data-segment="bar"]')).opacity).toFixed(2));
console.log(`heading in the band (top ${r.headingTop}px): ribbon opacity ${r.barOpacity} · heading scrolled past: opacity ${r2}`);
await b.close();
