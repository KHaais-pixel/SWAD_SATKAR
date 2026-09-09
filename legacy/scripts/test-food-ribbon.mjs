/** The food ribbon: one segment per page, on its own stretch and nowhere else; none on the home page. */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();
const state = (p) => p.evaluate(() => {
  const out = { present: !!document.querySelector("[data-food-ribbon]") };
  for (const id of ["story", "menu", "bar"]) {
    const g = document.querySelector(`[data-segment="${id}"]`); const r = document.querySelector(`[data-reveal="${id}"]`);
    out[id] = g ? { op: +(+getComputedStyle(g).opacity).toFixed(2), win: +(parseFloat(r.style.strokeDasharray) || 0).toFixed(2) } : null;
  }
  const h = document.querySelector("main h1, main h2"); const rect = h?.getBoundingClientRect();
  out.headingAbove = rect ? !document.querySelector("[data-food-ribbon]")?.contains(document.elementFromPoint(rect.left + 8, rect.top + rect.height / 2)) : null;
  return out;
});
const at = async (p, sel, frac) => {
  const y = await p.evaluate(([s, f]) => { const el = document.querySelector(s); const sp = el.closest(".pin-spacer") ?? el; const r = sp.getBoundingClientRect(); const top = r.top + scrollY; return top + (r.height - innerHeight) * f; }, [sel, frac]);
  await p.evaluate((v) => window.scrollTo({ top: Math.max(0, v), behavior: "instant" }), y); await p.waitForTimeout(1400);
  return state(p);
};
const bottom = async (p) => { await p.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" })); await p.waitForTimeout(1400); return state(p); };
const f = (s) => `story ${s.story ? `${s.story.op}/${s.story.win}` : "-"} · menu ${s.menu ? `${s.menu.op}/${s.menu.win}` : "-"} · bar ${s.bar ? `${s.bar.op}/${s.bar.win}` : "-"}`;
for (const [label, vp] of [["desktop 1440", { width: 1440, height: 900 }], ["mobile 390", { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.setDefaultTimeout(150000);
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  console.log(label);
  await p.goto(base, { waitUntil: "domcontentloaded", timeout: 400000 }); await p.waitForTimeout(6000);
  console.log(`  home:         ribbon present=${(await state(p)).present}`);
  await p.goto(base + "/story", { waitUntil: "domcontentloaded", timeout: 400000 }); await p.waitForTimeout(6000);
  const s0 = await state(p); const s1 = await at(p, "#story", 0.5); if (vp.width >= 1000) await p.screenshot({ path: "shots/ribbon-story.png" }); const s2 = await bottom(p);
  console.log(`  story top:    ${f(s0)}  headingAbove=${s0.headingAbove}\n  story mid:    ${f(s1)}\n  story end:    ${f(s2)}`);
  await p.goto(base + "/menu", { waitUntil: "domcontentloaded", timeout: 400000 }); await p.waitForTimeout(8000);
  const m0 = await state(p); const m1 = await at(p, "#menu", 0.4); if (vp.width >= 1000) await p.screenshot({ path: "shots/ribbon-menu.png" }); const m2 = await at(p, "#list", 0.2);
  console.log(`  menu top:     ${f(m0)}  headingAbove=${m0.headingAbove}\n  menu mid:     ${f(m1)}  headingAbove=${m1.headingAbove}\n  menu list:    ${f(m2)}`);
  await p.goto(base + "/bar", { waitUntil: "domcontentloaded", timeout: 400000 }); await p.waitForTimeout(6000);
  const b0 = await state(p); const b1 = await at(p, "#bar", 0.6); if (vp.width >= 1000) await p.screenshot({ path: "shots/ribbon-bar.png" }); const b2 = await bottom(p); if (vp.width >= 1000) await p.screenshot({ path: "shots/ribbon-footer.png" });
  console.log(`  bar top:      ${f(b0)}  headingAbove=${b0.headingAbove}\n  bar mid:      ${f(b1)}\n  bar footer:   ${f(b2)}`);
  console.log(errs.length ? `  ERRORS: ${errs[0]}` : "  no page errors");
  await ctx.close();
}
await b.close();
