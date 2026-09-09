/** Checks the dish carousel: pin, centring at every snap, emphasis, and the static fallback. */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();

const centring = async (p) =>
  p.evaluate(() => {
    const sec = document.querySelector("#dishes");
    const cards = [...sec.querySelectorAll("[data-card]")];
    const mid = innerWidth / 2;
    const rows = cards.map((c) => {
      const r = c.getBoundingClientRect();
      const m = getComputedStyle(c).transform;
      const scale = m && m !== "none" ? +m.match(/matrix\(([^,]+)/)[1] : 1;
      return { i: +c.dataset.card, off: Math.round(r.left + r.width / 2 - mid), scale: +scale.toFixed(2), opacity: +getComputedStyle(c).opacity, filter: getComputedStyle(c).filter, visible: r.right > 0 && r.left < innerWidth };
    });
    const centre = rows.reduce((a, r) => (Math.abs(r.off) < Math.abs(a.off) ? r : a));
    return { centre: centre.i, off: centre.off, scale: centre.scale, opacity: centre.opacity, visibleCount: rows.filter((r) => r.visible).length, neighbour: rows[centre.i + 1] ?? rows[centre.i - 1] };
  });

const run = async (label, viewport, reduced = false) => {
  const ctx = await b.newContext({ viewport, reducedMotion: reduced ? "reduce" : "no-preference" });
  const p = await ctx.newPage();
  p.setDefaultTimeout(150000);
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(base, { waitUntil: "domcontentloaded", timeout: 400000 });
  await p.waitForTimeout(9000);
  const info = await p.evaluate(() => {
    const sec = document.querySelector("#dishes");
    const spacer = sec?.closest(".pin-spacer");
    return { pinned: !!spacer, viewports: spacer ? +(spacer.getBoundingClientRect().height / innerHeight).toFixed(1) : 0, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  // Bring the section into view first: its images are lazy on purpose.
  await p.evaluate(() => document.querySelector("#dishes")?.scrollIntoView({ behavior: "instant", block: "start" }));
  await p.waitForTimeout(2500);
  const imgs = await p.evaluate(() =>
    [...document.querySelectorAll("#dishes img")].map((i) => ({ ok: i.complete && i.naturalWidth > 0, src: i.currentSrc.slice(-60) })),
  );
  const broken = imgs.filter((i) => !i.ok);
  console.log(`${label}: ${JSON.stringify(info)} · images ${imgs.length - broken.length}/${imgs.length} painted${broken.length ? " BROKEN: " + broken.map((b) => b.src).join(", ") : ""}`);
  if (!info.pinned) { await ctx.close(); return; }
  const { top, span } = await p.evaluate(() => { const s = document.querySelector("#dishes").closest(".pin-spacer"); return { top: s.offsetTop, span: s.getBoundingClientRect().height - innerHeight }; });
  const n = 5;
  for (let i = 0; i < n; i++) {
    await p.evaluate(([t, s, f]) => window.scrollTo({ top: t + s * f, behavior: "instant" }), [top, span, i / (n - 1)]);
    await p.waitForTimeout(1600);
    const c = await centring(p);
    const live = await p.evaluate(() => document.querySelector('#dishes [aria-live="polite"]')?.textContent?.trim());
    console.log(`  snap ${i}: centre=${c.centre} off=${c.off}px scale=${c.scale} opacity=${c.opacity} visible=${c.visibleCount} neighbour=${JSON.stringify(c.neighbour && { scale: c.neighbour.scale, opacity: c.neighbour.opacity, filter: c.neighbour.filter })} · "${live}"`);
    if (i === 2 && viewport.width >= 1000) await p.screenshot({ path: `shots/dishes-${viewport.width}.png` });
  }
  // half-way between two snaps: both should share emphasis
  await p.evaluate(([t, s]) => window.scrollTo({ top: t + s * 0.375, behavior: "instant" }), [top, span]);
  await p.waitForTimeout(500);
  const mid = await centring(p);
  console.log(`  between 1 and 2: centre=${mid.centre} off=${mid.off}px scale=${mid.scale} neighbourScale=${mid.neighbour?.scale}`);
  if (viewport.width >= 1000) await p.screenshot({ path: `shots/dishes-between.png` });
  console.log(errs.length ? `  ERRORS: ${errs[0]}` : "  no page errors");
  await ctx.close();
};

await run("desktop 1440", { width: 1440, height: 900 });
await run("mobile 390", { width: 390, height: 844 });
await run("reduced motion", { width: 1440, height: 900 }, true);
await b.close();
