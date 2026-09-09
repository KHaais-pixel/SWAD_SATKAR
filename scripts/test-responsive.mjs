/**
 * Every route at every width that matters: does anything spill sideways, is
 * anything too small to tap, is any text below a readable size, and does any
 * element run past the edge of the screen.
 *
 *   node scripts/test-responsive.mjs [baseUrl]
 */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3123";
const ROUTES = ["/", "/story", "/thakali", "/thai", "/bar", "/gallery", "/book", "/contact", "/staff"];
const WIDTHS = [320, 360, 390, 414, 480, 600, 768, 900, 1024, 1280, 1440, 1920];
const b = await chromium.launch();

const audit = (p) => p.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const out = { overflow: document.documentElement.scrollWidth - vw, wide: [], small: [], tiny: [], clipped: [] };
  const name = (el) => {
    const id = el.id ? `#${el.id}` : "";
    const cls = typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
    return (el.tagName.toLowerCase() + id + cls).slice(0, 72);
  };
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    // something reaching past the right edge, ignoring what is deliberately
    // moved off screen by a transform (the reels and the marquee)
    const moved = cs.transform !== "none" || el.closest("[style*='translate']");
    if (!moved && r.right > vw + 1.5 && r.width <= vw * 1.5 && out.wide.length < 6) {
      if (!el.closest(".gal-lb, .st-rtrack, .st-mtrack, .book, .bl-layer, .pin-spacer [style*='transform']")) out.wide.push(`${name(el)} right=${Math.round(r.right)}`);
    }
    // anything you tap should be big enough to hit
    const tappable = el.matches("a[href], button, input, select, [role=button], [role=tab]") && !el.closest("[aria-hidden=true]");
    if (tappable && r.width > 0 && (r.width < 24 || r.height < 24) && out.small.length < 6) out.small.push(`${name(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    // text nobody can read
    const text = el.children.length === 0 && el.textContent.trim().length > 2;
    if (text && parseFloat(cs.fontSize) < 10 && out.tiny.length < 6) out.tiny.push(`${name(el)} ${cs.fontSize}`);
  }
  return out;
});

let problems = 0;
for (const route of ROUTES) {
  const lines = [];
  for (const width of WIDTHS) {
    const ctx = await b.newContext({ viewport: { width, height: 860 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage(); p.setDefaultTimeout(60000);
    const errs = [];
    p.on("pageerror", (e) => errs.push(e.message.slice(0, 90)));
    await p.goto(base + route, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(1800);
    const a = await audit(p);
    // and again after a scroll, since pinned scenes only lay out once reached
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45));
    await p.waitForTimeout(1200);
    const b2 = await audit(p);
    const bad = [];
    const of = Math.max(a.overflow, b2.overflow);
    if (of > 1) bad.push(`overflow ${of}px`);
    const wide = [...new Set([...a.wide, ...b2.wide])];
    const small = [...new Set([...a.small, ...b2.small])];
    const tiny = [...new Set([...a.tiny, ...b2.tiny])];
    if (wide.length) bad.push(`past the edge: ${wide.join(" | ")}`);
    if (small.length) bad.push(`too small to tap: ${small.join(" | ")}`);
    if (tiny.length) bad.push(`text under 10px: ${tiny.join(" | ")}`);
    if (errs.length) bad.push(`errors: ${[...new Set(errs)].join(" | ")}`);
    if (bad.length) { lines.push(`   ${String(width).padStart(4)}  ${bad.join("\n         ")}`); problems++; }
    await ctx.close();
  }
  console.log(`${route}${lines.length ? "" : "  ✓ clean at every width"}`);
  lines.forEach((l) => console.log(l));
}
console.log(`\n${problems ? problems + " width/route combinations need work" : "every route clean at every width"}`);
await b.close();
