/** Locates any remaining dash and dot characters in the live text, and shoots the page on a phone. */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.setDefaultTimeout(150000);
await p.goto(base, { waitUntil: "domcontentloaded", timeout: 400000 });
await p.waitForTimeout(8000);
const r = await p.evaluate(() => {
  const t = document.body.innerText;
  const ctx = (ch) => [...t.matchAll(new RegExp(ch, "g"))].map((m) => t.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\n/g, " "));
  return { em: ctx("—"), en: ctx("–"), dots: ctx("·"), words: t.split(/\s+/).length };
});
console.log(`words ${r.words} · em ${r.em.length} · en ${r.en.length} · dots ${r.dots.length}`);
for (const c of [...r.em, ...r.en, ...r.dots]) console.log("   ", JSON.stringify(c));
await p.close();
const m = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
m.setDefaultTimeout(150000);
await m.goto(base, { waitUntil: "domcontentloaded", timeout: 400000 });
await m.waitForTimeout(8000);
await m.screenshot({ path: "shots/audit-m-hero.png" });
for (const id of ["story", "bar", "reviews", "visit"]) {
  await m.evaluate((i) => document.getElementById(i)?.scrollIntoView({ behavior: "instant", block: "start" }), id);
  await m.waitForTimeout(1500);
  await m.screenshot({ path: `shots/audit-m-${id}.png` });
}
console.log("mobile overflow:", await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
await b.close();
