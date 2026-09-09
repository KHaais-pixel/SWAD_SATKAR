import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.setDefaultTimeout(180000);
const errs = [];
p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
p.on("console", (m) => m.type() === "error" && errs.push("console: " + m.text().slice(0, 180)));
await p.goto(base + "/menu", { waitUntil: "domcontentloaded", timeout: 400000 });
await p.waitForTimeout(8000);
const book = p.locator('[aria-roledescription="menu book"]');
await book.scrollIntoViewIfNeeded({ timeout: 150000 });
await p.waitForTimeout(3000);
const live = () => p.locator('[aria-live="polite"]').first().innerText();
console.log("pages:", (await live()).trim());
console.log("indicator dots:", await p.getByRole("tab").count());
await p.screenshot({ path: "shots/menu-01-cover.png" });
// Step through a few spreads
for (const [i, name] of [["1","menu-02"],["2","menu-03"],["3","menu-04"],["4","menu-05"]]) {
  await p.getByRole("button", { name: "Next page" }).first().click();
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `shots/${name}.png` });
  console.log(name, (await live()).trim());
}
// Jump to the spirits table
for (let i = 0; i < 4; i++) { await p.getByRole("button", { name: "Next page" }).first().click(); await p.waitForTimeout(1200); }
await p.screenshot({ path: "shots/menu-06-spirits.png" });
console.log("spirits spread:", (await live()).trim());
console.log(errs.length ? "ERRORS:\n" + [...new Set(errs)].slice(0,4).join("\n") : "no page errors");
await b.close();
