/** The menu arrival: pinned, the book flattens with scroll, and the first page turns near the end. */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();
for (const [label, vp, reduced] of [["desktop 1440", { width: 1440, height: 900 }, false], ["mobile 390", { width: 390, height: 844 }, false], ["reduced motion", { width: 1440, height: 900 }, true]]) {
  const ctx = await b.newContext({ viewport: vp, reducedMotion: reduced ? "reduce" : "no-preference" }); const p = await ctx.newPage(); p.setDefaultTimeout(150000);
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(base + "/menu", { waitUntil: "domcontentloaded", timeout: 400000 }); await p.waitForTimeout(10000);
  const geo = await p.evaluate(() => { const s = document.querySelector("#menu"); const sp = s?.closest(".pin-spacer"); return sp ? { top: sp.offsetTop, span: sp.getBoundingClientRect().height - innerHeight } : null; });
  if (!geo) { console.log(`${label}: not pinned (expected under reduced motion: ${reduced})`); await ctx.close(); continue; }
  const read = () => p.evaluate(() => { const st = document.querySelector("[data-book-stage]"); return { transform: getComputedStyle(st).transform.slice(0, 40), live: document.querySelector("#menu [aria-live]")?.textContent?.trim().slice(0, 40) }; });
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), geo.top); await p.waitForTimeout(1200); const start = await read();
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), geo.top + geo.span * 0.5); await p.waitForTimeout(1200); const mid = await read();
  // walk the pin in steps, as a hand would, so the book's queue turns page by page
  for (let k = 1; k <= 12; k++) { await p.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), geo.top + geo.span * (k / 12)); await p.waitForTimeout(450); }
  await p.waitForTimeout(6000); const end = await read();
  if (vp.width >= 1000) await p.screenshot({ path: "shots/menu-arrival-end.png" });
  for (let k = 11; k >= 0; k--) { await p.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), geo.top + geo.span * (k / 12)); await p.waitForTimeout(450); }
  await p.waitForTimeout(6000); const back = await read();
  console.log(`${label}: pinned ${(geo.span / vp.height).toFixed(1)} viewports · start "${start.live}" → end "${end.live}" → back "${back.live}" · transform changes: ${start.transform !== mid.transform && mid.transform !== end.transform}`);
  console.log(errs.length ? `  ERRORS: ${errs[0]}` : "  no page errors");
  await ctx.close();
}
await b.close();
