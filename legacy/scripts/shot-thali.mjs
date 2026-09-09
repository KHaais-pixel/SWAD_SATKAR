/** Walks the scroll-driven serving sequence and captures each course. */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.setDefaultTimeout(180000);
const errs = [];
p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
p.on("console", (m) => m.type() === "error" && errs.push("console: " + m.text().slice(0, 160)));
await p.goto(base, { waitUntil: "domcontentloaded", timeout: 400000 });
await p.waitForTimeout(11000);

const info = await p.evaluate(() => {
  const sec = document.querySelector("#thali");
  const spacer = sec?.closest(".pin-spacer");
  const c = document.querySelector("#thali canvas");
  return {
    pinned: !!spacer,
    viewports: spacer ? +(spacer.getBoundingClientRect().height / innerHeight).toFixed(1) : 0,
    canvas: c ? `${c.width}x${c.height}` : "none",
  };
});
console.log("section:", JSON.stringify(info));

const top = await p.evaluate(() => document.querySelector("#thali")?.closest(".pin-spacer")?.offsetTop ?? 0);
const span = await p.evaluate(() => {
  const s = document.querySelector("#thali")?.closest(".pin-spacer");
  return s ? s.getBoundingClientRect().height - innerHeight : 0;
});

for (let i = 0; i < 7; i++) {
  const frac = i === 0 ? 0.01 : (i + 0.45) / 7;
  await p.evaluate(([t, f]) => window.scrollTo({ top: t + f, behavior: "instant" }), [top, span * frac]);
  await p.waitForTimeout(1600);
  const live = await p.evaluate(() => document.querySelector('[aria-live="polite"]')?.textContent?.trim());
  console.log(`stage ${i + 1}: "${live}"`);
  await p.screenshot({ path: `shots/thali-0${i + 1}.png` });
}

// reverse
await p.evaluate(([t]) => window.scrollTo({ top: t + 30, behavior: "instant" }), [top]);
await p.waitForTimeout(2200);
const back = await p.evaluate(() => document.querySelector('[aria-live="polite"]')?.textContent?.trim());
console.log("after scrolling back:", `"${back}"`);
console.log(errs.length ? "ERRORS:\n" + [...new Set(errs)].slice(0, 4).join("\n") : "no page errors");
await b.close();
