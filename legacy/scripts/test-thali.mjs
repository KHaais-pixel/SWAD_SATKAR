/** Checks the serving scrub at desktop, mobile and under reduced motion. */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();

const probe = async (label, opts) => {
  const ctx = await b.newContext({
    viewport: opts.viewport,
    reducedMotion: opts.reduced ? "reduce" : "no-preference",
  });
  const p = await ctx.newPage();
  p.setDefaultTimeout(150000);
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(base, { waitUntil: "domcontentloaded", timeout: 400000 });
  await p.waitForTimeout(9000);
  const r = await p.evaluate(() => {
    const sec = document.querySelector("#thali");
    const spacer = sec?.closest(".pin-spacer");
    const canvas = sec?.querySelector("canvas");
    const img = sec?.querySelector("img");
    const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return {
      pinned: !!spacer,
      viewports: spacer ? +(spacer.getBoundingClientRect().height / innerHeight).toFixed(1) : 0,
      canvas: !!canvas,
      staticImage: !!img,
      overflow,
    };
  });
  console.log(`${label}: ${JSON.stringify(r)}${errs.length ? " ERRORS: " + errs[0] : ""}`);
  if (opts.shot) await p.screenshot({ path: `shots/${opts.shot}.png` });
  await ctx.close();
  return r;
};

await probe("desktop 1440", { viewport: { width: 1440, height: 900 } });
await probe("mobile 390", { viewport: { width: 390, height: 844 }, shot: "thali-mobile" });
await probe("mobile 360", { viewport: { width: 360, height: 780 } });
await probe("reduced motion", { viewport: { width: 1440, height: 900 }, reduced: true, shot: "thali-reduced" });
await b.close();
