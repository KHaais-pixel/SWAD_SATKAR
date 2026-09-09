/** The story by scroll: the slats, the rooms and the dusk all driven by scroll, and at rest under reduced motion. */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const base = process.argv[2] || "http://localhost:3123";
await mkdir("shots/story", { recursive: true });
const b = await chromium.launch();
const read = (p) => p.evaluate(() => {
  return {
    heroWord: +getComputedStyle(document.querySelector(".st-h1 .st-w")).opacity, marqueeX: Math.round(new DOMMatrix(getComputedStyle(document.querySelector(".st-mtrack")).transform).m41),
    storyLit: [...document.querySelectorAll(".st-big .st-w")].filter((w) => +getComputedStyle(w).opacity > 0.9).length, storyWords: document.querySelectorAll(".st-big .st-w").length,
    reveal: +document.querySelector(".st-reveal").dataset.t, clip: getComputedStyle(document.querySelector(".st-frame")).clipPath,
    rooms: +document.querySelector(".st-rooms").dataset.t, railX: Math.round(new DOMMatrix(getComputedStyle(document.querySelector(".st-rtrack")).transform).m41),
    dusk: +document.querySelector(".st-dusk").dataset.t, night: +(+getComputedStyle(document.querySelector(".st-night")).opacity).toFixed(2), filter: getComputedStyle(document.querySelector(".st-dshot")).filter.slice(0, 40), nightWords: +(+getComputedStyle(document.querySelector(".st-two")).opacity).toFixed(2),
    counts: [...document.querySelectorAll(".st-n")].map((n) => n.textContent).join(" "),
  };
});
for (const [label, vp] of [["desktop", { width: 1440, height: 900 }], ["phone", { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.setDefaultTimeout(120000);
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errs.push(m.type() + ": " + m.text().slice(0, 140)));
  await p.goto(base + "/story", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(2800);
  const top = async (sel) => p.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);
  const at = async (y, settle = 1300) => { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(settle); return read(p); };
  const pins = await p.evaluate(() => [...document.querySelectorAll(".story-scenes .pin-spacer")].map((s) => ({ top: s.getBoundingClientRect().top + scrollY, span: s.offsetHeight - innerHeight })));
  console.log(label, `pins: ${pins.length}`, pins.map((s) => `${(s.span / vp.height).toFixed(1)} viewports`).join(" · "));
  if (pins.length !== 1) { console.log(errs.join(" | ")); await ctx.close(); continue; }
  let r = await at(0, 2000); await p.screenshot({ path: `shots/story/${label}-hero.png` });
  console.log(`  hero: word opacity ${r.heroWord} · marquee x ${r.marqueeX}`);
  r = await at(vp.height * 0.5); console.log(`  hero at half: word opacity ${r.heroWord} · marquee x ${r.marqueeX}`);
  const st = await top(".st-big"); r = await at(st - vp.height * 0.6); console.log(`  story words lit ${r.storyLit}/${r.storyWords} as the line passes`);
  const rv = await top(".st-reveal"); const rvH = await p.evaluate(() => document.querySelector(".st-reveal").offsetHeight);
  for (const f of [0, 0.5, 1]) { r = await at(rv + (rvH - vp.height) * f); console.log(`  slats ${f}: t=${r.reveal} clip ${r.clip}`); if (f === 0.5) await p.screenshot({ path: `shots/story/${label}-slats.png` }); }
  for (const f of [0, 0.5, 1]) { r = await at(pins[0].top + pins[0].span * f); console.log(`  rooms ${f}: t=${r.rooms} rail x ${r.railX}`); if (f === 0.5) await p.screenshot({ path: `shots/story/${label}-rooms.png` }); }
  const du = await top(".st-dusk"); const duH = await p.evaluate(() => document.querySelector(".st-dusk").offsetHeight);
  for (const f of [0, 0.5, 1]) { r = await at(du + (duH - vp.height) * f); console.log(`  dusk ${f}: t=${r.dusk} night ${r.night} words ${r.nightWords} · ${r.filter}`); if (f === 1) await p.screenshot({ path: `shots/story/${label}-dusk.png` }); }
  const fa = await top(".st-facts"); r = await at(fa - vp.height * 0.3, 1500); console.log(`  counts: ${r.counts}`);
  const backTo = await at(pins[0].top + pins[0].span * 0.5); console.log(`  back to rooms 0.5: rail x ${backTo.railX}`);
  console.log(errs.length ? "  ISSUES: " + [...new Set(errs)].join(" | ") : "  no errors");
  await ctx.close();
}
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }); const p = await ctx.newPage();
  await p.goto(base + "/story", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(2000);
  await p.evaluate(() => document.querySelector(".st-facts").scrollIntoView()); await p.waitForTimeout(800);
  const r = await read(p);
  console.log("reduced motion:", JSON.stringify({ pins: await p.evaluate(() => document.querySelectorAll(".story-scenes .pin-spacer").length), storyLit: `${r.storyLit}/${r.storyWords}`, clip: r.clip, night: r.night, counts: r.counts, pageHeight: await p.evaluate(() => document.body.scrollHeight) }));
  await ctx.close();
}
await b.close();
