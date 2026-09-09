/** Interaction test for the menu book and booking flow. */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.argv[2] || "http://localhost:3123";
await mkdir("shots", { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text().slice(0, 140)));

const live = () => page.locator('[aria-live="polite"]').first().innerText();
const log = (...a) => console.log(...a);

await page.goto(base + "/menu", { waitUntil: "networkidle", timeout: 400000 });
const book = page.locator('[aria-roledescription="menu book"]');
await book.scrollIntoViewIfNeeded();
await page.waitForTimeout(900);

log("initial:", (await live()).trim());

// 1. Next button
await page.getByRole("button", { name: "Next page" }).first().click();
await page.waitForTimeout(1200);
log("after next:", (await live()).trim());

// 2. Mid-turn screenshot: click then capture at 400ms
await page.getByRole("button", { name: "Next page" }).first().click();
await page.waitForTimeout(380);
await page.screenshot({ path: "shots/20-mid-turn.png" });
const leaf = await page.evaluate(() => {
  const el = document.querySelector(".menu-leaf");
  if (!el) return null;
  const cs = getComputedStyle(el);
  const hl = el.querySelector(".leaf-highlight");
  return {
    transform: cs.transform.slice(0, 60),
    half: el.dataset.half,
    z: cs.zIndex,
    hlBg: hl ? getComputedStyle(hl).backgroundImage.slice(0, 90) : null,
  };
});
log("mid-turn leaf:", JSON.stringify(leaf));
await page.waitForTimeout(1200);
log("after 2nd next:", (await live()).trim());

// 3. Rapid clicks — must not corrupt state
const next = page.getByRole("button", { name: "Next page" }).first();
for (let i = 0; i < 6; i++) await next.click({ force: true, delay: 40 });
await page.waitForTimeout(9000);
log("after 6 rapid clicks:", (await live()).trim());
const leafCount = await page.locator(".menu-leaf").count();
log("leaves in DOM after settle:", leafCount);

// 4. Keyboard
await book.focus();
await page.keyboard.press("ArrowLeft");
await page.waitForTimeout(2500);
log("after ArrowLeft:", (await live()).trim());
await page.keyboard.press("ArrowRight");
await page.waitForTimeout(2500);
log("after ArrowRight:", (await live()).trim());

// 5. Drag past threshold
const box = await book.boundingBox();
await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2);
await page.mouse.down();
for (let i = 1; i <= 8; i++) await page.mouse.move(box.x + box.width * (0.9 - i * 0.08), box.y + box.height / 2, { steps: 2 });
await page.mouse.up();
await page.waitForTimeout(2500);
log("after drag forward:", (await live()).trim());

// 6. Drag below threshold springs back
const before = (await live()).trim();
await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2);
await page.mouse.down();
await page.mouse.move(box.x + box.width * 0.82, box.y + box.height / 2, { steps: 4 });
await page.mouse.up();
await page.waitForTimeout(2500);
log("after short drag (expect unchanged):", (await live()).trim(), before === (await live()).trim() ? "OK" : "CHANGED");

// 7. Indicator dots
const dots = await page.getByRole("tab").count();
log("indicator dots:", dots);

// 8. Plain menu present for assistive tech
const plainItems = await page.locator("#main").getByText("Mutton Thakali Set").count();
log("plain-menu occurrences of a dish name:", plainItems);

console.log(errors.length ? "\nERRORS:\n" + [...new Set(errors)].join("\n") : "\nno errors");
await browser.close();
