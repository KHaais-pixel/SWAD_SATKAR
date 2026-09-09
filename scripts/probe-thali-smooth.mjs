/** Drives a continuous scroll through the pin and records what the canvas drew each frame. */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3123";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.setDefaultTimeout(120000);
await p.goto(base, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(2500);
const geo = await p.evaluate(() => { const sp = document.getElementById("experience").closest(".pin-spacer"); return { top: sp.getBoundingClientRect().top + scrollY, span: sp.getBoundingClientRect().height - innerHeight }; });
// wait for every frame to be in
await p.evaluate((y) => window.scrollTo(0, y), geo.top + geo.span * 0.5);
await p.waitForFunction(() => !document.querySelector("#experience canvas")?.parentElement?.querySelector('[aria-hidden="true"] span span')?.style.width.startsWith("9") , {}, { timeout: 5000 }).catch(() => {});
await p.waitForTimeout(20000);
await p.evaluate((y) => window.scrollTo(0, y), geo.top); await p.waitForTimeout(1500);

const res = await p.evaluate(async ({ top, span, seconds }) => {
  const canvas = document.querySelector("#experience canvas");
  const samples = []; const gaps = []; const wanted = [];
  let last = performance.now();
  const t0 = performance.now();
  // Lenis animates window.scrollTo, so drive the wheel the way a hand would
  await new Promise((done) => {
    const step = () => {
      const now = performance.now();
      const k = Math.min(1, (now - t0) / (seconds * 1000));
      const y = top + span * k;
      if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
      gaps.push(now - last); last = now;
      samples.push(+canvas.dataset.frame);
      wanted.push(Math.max(0, Math.min(1, (scrollY - top) / span)) * 239);
      if (k < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });
  return { samples, gaps, wanted };
}, { top: geo.top, span: geo.span, seconds: 6 });

const d = res.samples.slice(1).map((v, i) => v - res.samples[i]).filter((v) => Number.isFinite(v));
const sorted = [...d].sort((a, c) => a - c);
const pct = (q) => sorted[Math.floor(sorted.length * q)];
const gaps = [...res.gaps].sort((a, c) => a - c);
const gp = (q) => gaps[Math.floor(gaps.length * q)];
console.log("continuous scroll through the pin, 6s");
console.log(`  render frames: ${res.samples.length} · display interval median ${gp(0.5).toFixed(1)}ms p95 ${gp(0.95).toFixed(1)}ms · over 33ms: ${res.gaps.filter((g) => g > 33).length}`);
console.log(`  drawn position: ${res.samples[0].toFixed(1)} → ${res.samples[res.samples.length - 1].toFixed(1)} of 239`);
console.log(`  per-render advance: median ${pct(0.5).toFixed(3)} frames · p95 ${pct(0.95).toFixed(3)} · max ${Math.max(...d).toFixed(3)} · backwards ${d.filter((v) => v < -0.01).length} · stalled ${d.filter((v) => Math.abs(v) < 0.0005).length}`);
console.log(`  sub-frame renders (advance under one whole frame): ${(d.filter((v) => Math.abs(v) < 1).length / d.length * 100).toFixed(0)}%`);
const lag = res.samples.map((v, i) => res.wanted[i] - v).slice(30);
const ls = [...lag].sort((a, c) => a - c);
console.log(`  scroll reached frame ${res.wanted[res.wanted.length - 1].toFixed(1)}; drawn trails it by ${ls[Math.floor(ls.length / 2)].toFixed(1)} frames (median), settling to 0 when the hand stops`);
await b.close();
