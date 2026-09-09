/** The printed menu as a book: pinned, turned by scroll, one leaf at a time, reversible, stacked under reduced motion. */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const base = process.argv[2] || "http://localhost:3123";
await mkdir("shots/menu-book", { recursive: true });
const b = await chromium.launch();
const leaves = (p) => p.evaluate(() => [...document.querySelectorAll("#menu-book [data-leaf]")].map((el) => {
  const m = new DOMMatrix(getComputedStyle(el).transform);
  // rotationY from the 3D matrix, signed
  const deg = Math.round((Math.atan2(-m.m31, m.m11) * 180) / Math.PI);
  return { k: +el.dataset.leaf, deg, z: +getComputedStyle(el).zIndex };
}));

for (const [label, vp] of [["desktop", { width: 1440, height: 900 }], ["phone", { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.setDefaultTimeout(120000);
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errs.push(m.type() + ": " + m.text().slice(0, 120)));
  await p.goto(base, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(2500);
  const geo = await p.evaluate(() => { const sp = document.getElementById("menu-book").closest(".pin-spacer"); return sp ? { top: sp.getBoundingClientRect().top + scrollY, span: sp.getBoundingClientRect().height - innerHeight } : null; });
  console.log(label, "pinned:", !!geo, geo ? `${(geo.span / vp.height).toFixed(1)} viewports` : "");
  if (!geo) { await ctx.close(); continue; }
  const at = async (f, settle = 950) => { await p.evaluate((y) => window.scrollTo(0, y), geo.top + geo.span * f); await p.waitForTimeout(settle); return leaves(p); };
  await at(0.5, 3000);
  for (const f of [0, 0.17, 0.33, 0.5, 0.67, 0.83, 1]) {
    const L = await at(f);
    console.log(`  ${f.toFixed(2)}: ${L.map((l) => `${l.k}:${l.deg}°`).join(" ")}`);
    await p.screenshot({ path: `shots/menu-book/${label}-${String(Math.round(f * 100)).padStart(3, "0")}.png` });
  }
  // one leaf at a time, and the stack order flips at the half turn
  const mid = await at(0.17);
  console.log(`  mid-turn z-order: ${mid.map((l) => `${l.k}:z${l.z}`).join(" ")}`);
  // fine walk: the angle must move smoothly and never jump
  const walk = [];
  for (let i = 0; i <= 30; i++) { const L = await at(i / 30, 240); walk.push(L.reduce((a, l) => a + Math.abs(l.deg), 0)); }
  const steps = walk.slice(1).map((v, i) => v - walk[i]);
  console.log(`  total turned angle ${walk[0]}° → ${walk[walk.length - 1]}° · biggest single step ${Math.max(...steps.map(Math.abs))}° · backwards ${steps.filter((s) => s < -2).length}`);
  const back = await at(0.33);
  console.log(`  back to 0.33: ${back.map((l) => `${l.k}:${l.deg}°`).join(" ")}`);
  console.log(errs.length ? "  ISSUES: " + [...new Set(errs)].join(" | ") : "  no errors");
  await ctx.close();
}
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }); const p = await ctx.newPage();
  await p.goto(base, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(1500);
  await p.evaluate(() => document.getElementById("menu-book").scrollIntoView()); await p.waitForTimeout(1200);
  console.log("reduced motion:", JSON.stringify(await p.evaluate(() => {
    const sec = document.getElementById("menu-book");
    return { pinned: !!sec.closest(".pin-spacer"), bookShown: getComputedStyle(sec.querySelector(".book-view")).display !== "none", spreadsShown: [...sec.querySelectorAll("img")].filter((i) => i.currentSrc.includes("menu-board") && getComputedStyle(i).display !== "none").length };
  })));
  await p.screenshot({ path: "shots/menu-book/reduced.png", fullPage: false });
  await ctx.close();
}
await b.close();
