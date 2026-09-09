/** Viewport frames of the home page mid-scroll, with the cursor over a plate, for a look at the motion. */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3123";
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(base, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(2800);
const shots = [["00-hero", 0], ["01-hero-45", 0.45 * 900], ["02-story", "#story"], ["03-thakali", "#thakali"], ["04-bar", "#bar"], ["05-kitchen", "#signatures"], ["06-experience", "#experience"], ["07-reservations", "#reservations"]];
for (const [name, at] of shots) {
  if (typeof at === "number") await p.evaluate((y) => window.scrollTo(0, y), at);
  else await p.evaluate((sel) => { const el = document.querySelector(sel); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 60); }, at);
  await p.waitForTimeout(1900);
  if (name === "05-kitchen") { await p.locator("#signatures a").first().hover(); await p.waitForTimeout(600); }
  if (name === "07-reservations") { await p.locator('#reservations a[data-cursor="RESERVE"]').hover(); await p.waitForTimeout(600); }
  await p.screenshot({ path: `shots/motion-${name}.png` });
}
await b.close(); console.log("motion frames");
