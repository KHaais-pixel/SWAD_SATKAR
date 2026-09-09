/** The lounge hero at points along its timeline, both viewports; page errors and console noise. */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const base = process.argv[2] || "http://localhost:3210";
const stops = (process.argv[3] || "0,0.1,0.25,0.4,0.5,0.6,0.66,0.72,0.8,0.9,1").split(",").map(Number);
await mkdir("shots/lounge", { recursive: true });
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const [label, vp] of [["desktop", { width: 1440, height: 900 }], ["phone", { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 }); const p = await ctx.newPage(); p.setDefaultTimeout(120000);
  const errs = []; p.on("pageerror", (e) => errs.push("pageerror " + e.message)); p.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errs.push(m.type() + " " + m.text().slice(0, 140)));
  await p.goto(base, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(7000);
  const info = await p.evaluate(() => { const s = document.querySelector("[data-hero]"); const sp = s.closest(".pin-spacer"); return { mode: s.dataset.lounge, pinned: !!sp, span: sp ? sp.getBoundingClientRect().height - innerHeight : 0, top: sp ? sp.offsetTop : 0, loaderGone: !document.querySelector("[data-loader]") }; });
  console.log(label, JSON.stringify(info));
  for (const f of stops) {
    await p.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), info.top + info.span * f); await p.waitForTimeout(1500);
    const copy = await p.evaluate(() => [...document.querySelectorAll("[data-copy]")].map((e) => `${e.dataset.copy}:${(+getComputedStyle(e).opacity).toFixed(2)}`).join(" "));
    await p.screenshot({ path: `shots/lounge/${label}-${String(Math.round(f * 100)).padStart(3, "0")}.png` });
    console.log(`  ${f}: ${copy}`);
  }
  // reverse: back to the start must restore the first state
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), info.top); await p.waitForTimeout(1800);
  console.log("  back at 0:", await p.evaluate(() => [...document.querySelectorAll("[data-copy]")].map((e) => `${e.dataset.copy}:${(+getComputedStyle(e).opacity).toFixed(2)}`).join(" ")));
  console.log(errs.length ? "  ISSUES:\n    " + [...new Set(errs)].join("\n    ") : "  clean");
  await ctx.close();
}
await b.close();
