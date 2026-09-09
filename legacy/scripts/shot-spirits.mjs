import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.setDefaultTimeout(180000);
await p.goto(base, { waitUntil: "domcontentloaded", timeout: 400000 });
await p.waitForTimeout(8000);
const book = p.locator('[aria-roledescription="menu book"]');
await book.scrollIntoViewIfNeeded({ timeout: 150000 });
await p.waitForTimeout(2500);
const live = () => p.locator('[aria-live="polite"]').first().innerText();
await book.focus();
// Arrow through to the spirits spread, waiting for each turn to finish.
for (let i = 0; i < 6; i++) {
  await p.keyboard.press("ArrowRight");
  await p.waitForTimeout(1500);
}
console.log("spread:", (await live()).trim());
await p.screenshot({ path: "shots/menu-06-spirits.png" });
await b.close();
