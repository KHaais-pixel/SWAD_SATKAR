import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.setDefaultTimeout(150000);
let done = 0, failed = 0, first = 0, last = 0;
const t0 = Date.now();
p.on("response", (r) => {
  if (!r.url().includes("/thali/f-")) return;
  if (r.status() === 200) { done++; if (!first) first = Date.now() - t0; last = Date.now() - t0; }
  else failed++;
});
await p.goto(base, { waitUntil: "domcontentloaded", timeout: 400000 });
// wait until the loader clears or 90s
for (let i = 0; i < 90; i++) {
  const prog = await p.evaluate(() => {
    const el = document.querySelector("#thali canvas")?.parentElement?.querySelector("[style*='width']");
    return el ? el.getAttribute("style") : null;
  });
  if (prog && prog.includes("100%")) break;
  await p.waitForTimeout(1000);
}
console.log(`frames fetched: ${done}/80 · failed: ${failed} · first at ${first}ms · last at ${last}ms`);
const state = await p.evaluate(() => {
  const wrap = document.querySelector("#thali canvas")?.parentElement;
  const bar = wrap?.querySelector("[style*='width']");
  const overlay = wrap?.lastElementChild;
  return { barWidth: bar?.getAttribute("style"), overlayOpacity: overlay ? getComputedStyle(overlay).opacity : null };
});
console.log("loader:", JSON.stringify(state));
await b.close();
