/**
 * The feel of a scrubbed section: slow scroll, fast scroll, stopping, reversing,
 * entering and leaving the pin. Reads the drawn frame off the canvas after
 * each step and reports monotonicity, biggest jump per step, and settling.
 */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();

const frameOf = (p, sel) => p.evaluate((s) => parseFloat(document.querySelector(`${s} canvas`)?.dataset.frame ?? "NaN"), sel);

const feel = async (p, sel, label) => {
  const geo = await p.evaluate((s) => {
    const sec = document.querySelector(s); const sp = sec?.closest(".pin-spacer");
    return sp ? { top: sp.offsetTop, span: sp.getBoundingClientRect().height - innerHeight } : null;
  }, sel);
  if (!geo) { console.log(`  ${label}: not pinned`); return; }
  const { top, span } = geo;
  const go = (y) => p.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
  // enter
  await go(Math.max(0, top - 400)); await p.waitForTimeout(700);
  // slow: 40 steps across the pin, 80 ms apart
  const slow = [];
  for (let i = 0; i <= 40; i++) { await go(top + (span * i) / 40); await p.waitForTimeout(80); slow.push(await frameOf(p, sel)); }
  const slowJumps = slow.slice(1).map((v, i) => v - slow[i]);
  const slowMono = slowJumps.every((d) => d >= -0.01 || d < -50);
  // settle: stop and watch the frame stop moving
  const settle = []; for (let i = 0; i < 12; i++) { await p.waitForTimeout(100); settle.push(await frameOf(p, sel)); }
  const settledAfter = settle.findIndex((v, i) => i > 0 && Math.abs(v - settle[i - 1]) < 0.02);
  const stillAtEnd = Math.abs(settle[settle.length - 1] - settle[settle.length - 2]) < 0.02;
  // after the idle delay the hero drifts on by itself; measure its pace over a second
  await go(top + span * 0.5); await p.waitForTimeout(2200); const d0 = await frameOf(p, sel); await p.waitForTimeout(1000); const d1 = await frameOf(p, sel);
  const driftPerSec = ((d1 - d0) % 100 + 100) % 100;
  // return to the end of the pin and let the scrub catch up before reversing
  await go(top + span); await p.waitForTimeout(1200);
  // reverse: 20 steps back to the start
  const back = []; for (let i = 20; i >= 0; i--) { await go(top + (span * i) / 20); await p.waitForTimeout(80); back.push(await frameOf(p, sel)); }
  const backMono = back.slice(1).every((v, i) => v - back[i] <= 0.01 || v - back[i] > 50);
  // fast: three big jumps
  const fast = []; for (const f of [0.35, 0.8, 1]) { await go(top + span * f); await p.waitForTimeout(250); fast.push(await frameOf(p, sel)); }
  await p.waitForTimeout(900); const fastFinal = await frameOf(p, sel);
  // leave: scroll past, section should release
  await go(top + span + 600); await p.waitForTimeout(600);
  const left = await p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return r.bottom < innerHeight; }, sel);
  console.log(`  ${label}: slow ${slow[0].toFixed(1)}→${slow[slow.length - 1].toFixed(1)} monotonic=${slowMono} maxStep=${Math.max(...slowJumps).toFixed(2)} · settled in ${settledAfter >= 0 ? settledAfter * 100 + "ms" : ">1.2s"} still=${stillAtEnd} idleDrift=${driftPerSec.toFixed(1)}f/s · reverse monotonic=${backMono} to ${back[back.length - 1].toFixed(1)} · fast ${fast.map((v) => v.toFixed(1)).join("→")} final ${fastFinal.toFixed(1)} · released=${left}`);
};

for (const [label, vp] of [["desktop 1440", { width: 1440, height: 900 }], ["mobile 390", { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.setDefaultTimeout(150000);
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(base, { waitUntil: "domcontentloaded", timeout: 400000 }); await p.waitForTimeout(10000);
  console.log(label);
  await feel(p, "[data-hero]", "hero");
  await feel(p, "#thali", "thali");
  console.log(errs.length ? `  ERRORS: ${errs[0]}` : "  no page errors");
  await ctx.close();
}
await b.close();
