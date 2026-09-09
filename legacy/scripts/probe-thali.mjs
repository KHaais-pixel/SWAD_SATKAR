import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const W = Number(process.argv[3] || 2000), H = Number(process.argv[4] || 1300);
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
p.setDefaultTimeout(150000);
await p.goto(base, { waitUntil: "domcontentloaded", timeout: 400000 });
await p.waitForTimeout(10000);
const geo = await p.evaluate(() => {
  const sec = document.querySelector("#thali");
  const col = sec.querySelector("[data-plate-shift]");
  const canvas = sec.querySelector("canvas");
  const parent = col?.parentElement;
  const r = (el) => { const b = el.getBoundingClientRect(); return { x: Math.round(b.x), w: Math.round(b.width), right: Math.round(b.right) }; };
  return {
    viewport: innerWidth,
    column: parent ? r(parent) : null,
    plateBox: col ? r(col) : null,
    canvasCss: canvas ? r(canvas) : null,
    canvasAttr: canvas ? `${canvas.width}x${canvas.height}` : null,
    overflowsColumn: col && parent ? r(col).w > r(parent).w : null,
  };
});
console.log("geometry:", JSON.stringify(geo, null, 1));

// scroll to the very end and see which frame is painted
const top = await p.evaluate(() => document.querySelector(".pin-spacer")?.offsetTop ?? 0);
const span = await p.evaluate(() => { const s = document.querySelector(".pin-spacer"); return s ? s.getBoundingClientRect().height - innerHeight : 0; });
await p.evaluate(([t, s]) => window.scrollTo({ top: t + s - 10, behavior: "instant" }), [top, span]);
await p.waitForTimeout(4000);
const end = await p.evaluate(() => ({
  live: document.querySelector('[aria-live="polite"]')?.textContent?.trim(),
  loaderVisible: (() => { const l = document.querySelector("#thali canvas")?.parentElement?.lastElementChild; return l ? getComputedStyle(l).opacity : null; })(),
}));
console.log("at the end:", JSON.stringify(end));
await p.screenshot({ path: "shots/thali-bug.png" });
await b.close();
