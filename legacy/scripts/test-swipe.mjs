import { chromium, devices } from "playwright";
const base = process.argv[2] || "http://localhost:3124";
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices["Pixel 5"] });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.setDefaultTimeout(180000);
await p.goto(base + "/menu", { waitUntil: "domcontentloaded", timeout: 400000 });
await p.waitForTimeout(6000);
const book = p.locator('[aria-roledescription="menu book"]');
await book.scrollIntoViewIfNeeded({ timeout: 150000 });
await p.waitForTimeout(2500);
const live = () => p.locator('[aria-live="polite"]').first().innerText();
const box = await book.boundingBox();
console.log("mobile book box:", JSON.stringify({ w: Math.round(box.width), h: Math.round(box.height) }));
const before = (await live()).trim();

// Real touch swipe right-to-left
const y = box.y + box.height / 2;
await p.touchscreen.tap(box.x + box.width / 2, y); // ensure focus/no-op
await p.waitForTimeout(400);
const mid = (await live()).trim();
await ctx.newCDPSession(p).then(async (c) => {
  const x0 = box.x + box.width * 0.85;
  await c.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y }] });
  for (let i = 1; i <= 10; i++) {
    await c.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 - (box.width * 0.7 * i) / 10, y }] });
    await new Promise((r) => setTimeout(r, 25));
  }
  await c.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
});
await p.waitForTimeout(1600);
const after = (await live()).trim();
console.log("tap centre (should not turn):", before, "->", mid, before === mid ? "OK" : "CHANGED");
console.log("touch swipe:", mid, "->", after, mid !== after ? "TURNED" : "DID NOT TURN");
console.log(errs.length ? "ERRORS: " + errs.join(" | ") : "no errors");
await b.close();
