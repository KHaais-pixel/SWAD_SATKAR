import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.setDefaultTimeout(150000);
await p.goto(process.argv[2] || "http://localhost:3210", { waitUntil: "domcontentloaded", timeout: 400000 });
await p.waitForTimeout(8000);
const r = await p.evaluate(() => {
  const txt = document.body.innerText;
  const secs = [...document.querySelectorAll("main > section, main > * > section, main > div > section")].map((s) => ({ id: s.id, h: Math.round(s.getBoundingClientRect().height), heading: s.querySelector("h2,h1")?.textContent?.trim().slice(0, 60) }));
  return {
    em: (txt.match(/—/g) || []).length, en: (txt.match(/–/g) || []).length, dots: (txt.match(/·/g) || []).length,
    words: txt.split(/\s+/).length, sections: secs, docH: document.documentElement.scrollHeight,
    fonts: [...new Set([...document.querySelectorAll("h1,h2,h3,p,a,button")].map((e) => getComputedStyle(e).fontFamily.split(",")[0]))],
  };
});
console.log(JSON.stringify(r, null, 1));
const ids = ["story", "menu", "bar", "reviews", "visit"];
for (const id of ids) {
  await p.evaluate((i) => document.getElementById(i)?.scrollIntoView({ behavior: "instant", block: "start" }), id);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `shots/audit-${id}.png` });
}
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(800);
await p.screenshot({ path: "shots/audit-hero.png" });
await b.close();
