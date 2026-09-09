/** Walks every spread and flags any page whose content spills past its box. */
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

const check = () =>
  p.evaluate(() => {
    const bad = [];
    document.querySelectorAll('[aria-roledescription="menu book"] .paper-grain').forEach((face) => {
      if (face.closest(".menu-leaf")) return;
      const inner = face.querySelector(":scope > .relative");
      if (!inner) return;
      const last = inner.lastElementChild;
      const footTop = face.getBoundingClientRect().bottom - 64; // mountain band
      const items = inner.querySelectorAll("li, tbody tr");
      const spill = [...items].filter((el) => el.getBoundingClientRect().bottom > footTop);
      const title = inner.querySelector("h3")?.textContent ?? "?";
      if (spill.length) bad.push(`${title}: ${spill.length} row(s) under the footer`);
      if (last && last.getBoundingClientRect().bottom > face.getBoundingClientRect().bottom) bad.push(`${title}: page number below the card`);
    });
    return bad;
  });

const spreads = Number((await live()).match(/of (\d+)/)?.[1] ?? 0);
console.log("total pages:", spreads);
let problems = [];
for (let i = 0; i < 10; i++) {
  const found = await check();
  if (found.length) problems.push(`${(await live()).trim()} → ${found.join("; ")}`);
  await p.keyboard.press("ArrowRight");
  await p.waitForTimeout(1600);
}
console.log(problems.length ? "OVERFLOW:\n" + [...new Set(problems)].join("\n") : "every page fits inside its card");
await p.screenshot({ path: "shots/menu-last.png" });
await b.close();
