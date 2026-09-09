/** The served plate: pinned, scrubbed by scroll, blended between frames, reversible, still under reduced motion. */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const base = process.argv[2] || "http://localhost:3123";
await mkdir("shots/thali", { recursive: true });
const b = await chromium.launch();
const read = (p) => p.evaluate(() => { const c = document.querySelector("#experience canvas"); return c ? { frame: +c.dataset.frame, blend: +c.dataset.blend } : null; });

for (const [label, vp] of [["desktop", { width: 1440, height: 900 }], ["phone", { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.setDefaultTimeout(120000);
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errs.push(m.type() + ": " + m.text().slice(0, 120)));
  await p.goto(base, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(2500);
  const geo = await p.evaluate(() => { const sp = document.getElementById("experience").closest(".pin-spacer"); return sp ? { top: sp.getBoundingClientRect().top + scrollY, span: sp.getBoundingClientRect().height - innerHeight } : null; });
  console.log(label, "pinned:", !!geo, geo ? `${(geo.span / vp.height).toFixed(1)} viewports` : "");
  if (!geo) { await ctx.close(); continue; }
  const at = async (f, settle = 900) => { await p.evaluate((y) => window.scrollTo(0, y), geo.top + geo.span * f); await p.waitForTimeout(settle); return read(p); };
  // let the frames arrive
  await at(0.5, 1000); await p.waitForFunction(() => { const c = document.querySelector("#experience canvas"); return c && c.dataset.frame > 100; }, { timeout: 120000 }).catch(() => {});
  await p.waitForTimeout(6000);
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    const r = await at(f);
    console.log(`  ${f.toFixed(2)}: frame ${r.frame?.toFixed(1)} of 239`);
    if (vp.width > 1000 || f === 1) await p.screenshot({ path: `shots/thali/${label}-${String(Math.round(f * 100)).padStart(3, "0")}.png` });
  }
  // walk in fine steps: the frame must move smoothly, never jump or stall
  const walk = [];
  for (let i = 0; i <= 40; i++) { const r = await at(i / 40, 260); walk.push(r.frame); }
  const steps = walk.slice(1).map((v, i) => v - walk[i]);
  const back = steps.filter((s) => s < -0.5).length, stalls = steps.filter((s) => Math.abs(s) < 0.5).length;
  console.log(`  40-step walk: frames ${walk[0].toFixed(1)} → ${walk[walk.length - 1].toFixed(1)} · step median ${steps.slice().sort((a, c) => a - c)[Math.floor(steps.length / 2)].toFixed(1)} · backwards ${back} · stalls ${stalls}`);
  const blends = [];
  for (let i = 0; i < 12; i++) { const r = await at(0.4 + i * 0.005, 240); blends.push(r.blend); }
  console.log(`  sub-frame blend across a fifth of a frame: ${blends.map((v) => v.toFixed(2)).join(" ")}`);
  const rev = await at(0.25); console.log(`  back to 0.25: frame ${rev.frame.toFixed(1)}`);
  const copy = await p.evaluate(() => ({ first: +getComputedStyle(document.querySelector("#experience h2").closest("div")).opacity, last: +getComputedStyle(document.querySelector("#experience h2").closest("div").nextElementSibling).opacity }));
  const end = await at(1); const copyEnd = await p.evaluate(() => ({ first: +getComputedStyle(document.querySelector("#experience h2").closest("div")).opacity, last: +getComputedStyle(document.querySelector("#experience h2").closest("div").nextElementSibling).opacity }));
  console.log(`  copy at 0.25 ${JSON.stringify(copy)} · at 1.00 ${JSON.stringify(copyEnd)} · last frame ${end.frame.toFixed(1)}`);
  console.log(errs.length ? "  ISSUES: " + [...new Set(errs)].join(" | ") : "  no errors");
  await ctx.close();
}
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }); const p = await ctx.newPage();
  await p.goto(base, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(1500);
  await p.evaluate(() => document.getElementById("experience").scrollIntoView()); await p.waitForTimeout(1200);
  const r = await p.evaluate(() => { const sec = document.getElementById("experience"); const imgs = [...sec.querySelectorAll("img")].map((i) => ({ src: i.currentSrc.split("/").pop(), shown: getComputedStyle(i).display !== "none" })); return { pinned: !!sec.closest(".pin-spacer"), canvasShown: getComputedStyle(sec.querySelector("canvas").parentElement).display !== "none", imgs }; });
  console.log("reduced motion:", JSON.stringify(r));
  await p.screenshot({ path: "shots/thali/reduced.png" });
  await ctx.close();
}
await b.close();
