/** Chapter 04, the bar: three canvas scenes driven by scroll, pinned, reversible, finished states under reduced motion. */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const base = process.argv[2] || "http://localhost:3123";
const path = process.argv[3] || "/bar";
await mkdir("shots/bar", { recursive: true });
const b = await chromium.launch();
const painted = (p, sel) => p.evaluate((s) => { const c = document.querySelector(s); const x = c.getContext("2d"); const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4 * 97) if (d[i] + d[i + 1] + d[i + 2] > 60) n++; return +(n / (d.length / (4 * 97))).toFixed(3); }, sel);
const read = (p) => p.evaluate(() => ({
  hero: +document.querySelector(".bl-hero").dataset.t || 0,
  seq: +document.querySelector(".bl-stage-2").dataset.t, frame: document.querySelector(".bl-readout b").textContent, sub: document.querySelector(".bl-sub").textContent, mark: +getComputedStyle(document.querySelector(".bl-mark")).opacity,
  room: +document.querySelectorAll(".bl-stage")[1].dataset.t, kelvin: document.querySelector(".bl-kelvin b").textContent, service: document.querySelectorAll(".bl-kelvin b")[1].textContent, neon: document.querySelector(".bl-neon").style.clipPath,
}));
for (const [label, vp] of [["desktop", { width: 1440, height: 900 }], ["phone", { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.setDefaultTimeout(120000);
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errs.push(m.type() + ": " + m.text().slice(0, 140)));
  await p.goto(base + path, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(2600);
  const geo = await p.evaluate(() => { const sp = [...document.querySelectorAll(".barlab .pin-spacer")]; const top = document.querySelector(".barlab").getBoundingClientRect().top + scrollY; return { top, hero: document.querySelector(".bl-hero").offsetHeight, pins: sp.map((s) => ({ top: s.getBoundingClientRect().top + scrollY, span: s.offsetHeight - innerHeight })) }; });
  console.log(label, `pins: ${geo.pins.length}`, geo.pins.map((s) => `${(s.span / vp.height).toFixed(1)} viewports`).join(" · "));
  if (geo.pins.length !== 2) { console.log(errs.join(" | ")); await ctx.close(); continue; }
  const at = async (y, settle = 1300) => { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(settle); return read(p); };
  await at(geo.top, 2000); await p.screenshot({ path: `shots/bar/${label}-01-hero.png` });
  console.log("  hero canvases painted:", await painted(p, ".bl-back canvas"), "back ·", await painted(p, ".bl-front canvas"), "front");
  for (const f of [0, 0.5, 1]) { const r = await at(geo.pins[0].top + geo.pins[0].span * f); console.log(`  exhale ${f}: t=${r.seq} frame ${r.frame} "${r.sub}" mark ${r.mark.toFixed(2)}`); await p.screenshot({ path: `shots/bar/${label}-02-${f * 100}.png` }); }
  for (const f of [0, 0.5, 1]) { const r = await at(geo.pins[1].top + geo.pins[1].span * f); console.log(`  night ${f}: n=${r.room} ${r.kelvin} ${r.service} neon ${r.neon}`); await p.screenshot({ path: `shots/bar/${label}-03-${f * 100}.png` }); }
  const back = await at(geo.pins[1].top + geo.pins[1].span * 0.25); const fwd = await at(geo.pins[1].top + geo.pins[1].span); const again = await at(geo.pins[1].top + geo.pins[1].span * 0.25);
  console.log(`  reversible: ${back.room} → ${fwd.room} → ${again.room}`);
  console.log(errs.length ? "  ISSUES: " + [...new Set(errs)].join(" | ") : "  no errors");
  await ctx.close();
}
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }); const p = await ctx.newPage();
  await p.goto(base + path, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(2000);
  await p.evaluate(() => document.querySelector(".bl-stage-2").scrollIntoView()); await p.waitForTimeout(800);
  const r = await read(p);
  console.log("reduced motion:", JSON.stringify({ pins: await p.evaluate(() => document.querySelectorAll(".barlab .pin-spacer").length), seq: r.seq, mark: r.mark, room: r.room, kelvin: r.kelvin, neon: r.neon }));
  await p.screenshot({ path: "shots/bar/reduced.png" });
  await ctx.close();
}
await b.close();
