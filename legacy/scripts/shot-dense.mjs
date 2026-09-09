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
const shots = { 1: "menu-veg", 6: "menu-spirits", 7: "menu-tea" };
for (let i = 1; i <= 8; i++) {
  await p.keyboard.press("ArrowRight");
  await p.waitForTimeout(1600);
  if (shots[i]) {
    await p.screenshot({ path: `shots/${shots[i]}.png` });
    console.log(shots[i], "=", (await live()).trim());
  }
}
// Detect content overflowing its page box
const overflow = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll('[aria-roledescription="menu book"] .paper-grain').forEach((face, i) => {
    const inner = face.querySelector(":scope > .relative");
    if (!inner) return;
    const fb = face.getBoundingClientRect();
    const ib = inner.getBoundingClientRect();
    if (inner.scrollHeight > inner.clientHeight + 2) out.push(`face ${i}: content ${inner.scrollHeight} > box ${inner.clientHeight}`);
    if (ib.bottom > fb.bottom + 2) out.push(`face ${i}: bottom overflow ${Math.round(ib.bottom - fb.bottom)}px`);
  });
  return out;
});
console.log(overflow.length ? "OVERFLOW:\n" + overflow.join("\n") : "no page overflow");
await b.close();
