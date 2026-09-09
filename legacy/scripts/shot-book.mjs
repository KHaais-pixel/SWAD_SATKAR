import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(base, { waitUntil: "networkidle", timeout: 300000 });
await p.waitForTimeout(2500);
const book = p.locator('[aria-roledescription="menu book"]');
await book.scrollIntoViewIfNeeded({ timeout: 60000 });
await p.waitForTimeout(2500);
await p.screenshot({ path: "shots/blue-06-book.png" });
console.log("book shot");
// mid-turn
await p.getByRole("button", { name: "Next page" }).first().click();
await p.waitForTimeout(400);
await p.screenshot({ path: "shots/blue-07-turn.png" });
console.log("mid-turn shot");
await p.waitForTimeout(1500);
// booking modal
await p.goto(base + "/?book=1", { waitUntil: "networkidle", timeout: 180000 });
await p.waitForTimeout(3000);
await p.screenshot({ path: "shots/blue-08-booking.png" });
console.log("booking shot");
await b.close();
