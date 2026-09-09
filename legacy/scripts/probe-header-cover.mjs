/** On phones the header has two rows: does it cover any pinned section's heading? */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); p.setDefaultTimeout(120000);
const probe = (sel, title) => p.evaluate(([s, t]) => { const h = document.querySelector(t).getBoundingClientRect(); const hd = document.querySelector("header").getBoundingClientRect(); const eb = document.querySelector(s + " .eyebrow")?.getBoundingClientRect(); return { headerBottom: Math.round(hd.bottom), eyebrowTop: eb ? Math.round(eb.top) : null, headingTop: Math.round(h.top), covered: (eb ? eb.top : h.top) < hd.bottom }; }, [sel, title]);
const pinTop = (sel) => p.evaluate((s) => { const sp = document.querySelector(s).closest(".pin-spacer") ?? document.querySelector(s); return sp.getBoundingClientRect().top + scrollY; }, sel);
await p.goto(base, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(9000);
for (const [sel, title] of [["#thali", "#thali-title"], ["#dishes", "#dishes-title"], ["#reviews", "#reviews-title"]]) {
  const top = await pinTop(sel); await p.evaluate((y) => window.scrollTo({ top: y + 200, behavior: "instant" }), top); await p.waitForTimeout(1500);
  console.log("home", sel, JSON.stringify(await probe(sel, title)));
  if (sel === "#thali") await p.screenshot({ path: "shots/mobile-thali-pin.png" });
}
await p.goto(base + "/menu", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(9000);
const top = await pinTop("#menu"); await p.evaluate((y) => window.scrollTo({ top: y + 200, behavior: "instant" }), top); await p.waitForTimeout(1500);
console.log("menu", "#menu", JSON.stringify(await probe("#menu", "#menu-title")));
await p.screenshot({ path: "shots/mobile-menu-pin.png" });
await b.close();
