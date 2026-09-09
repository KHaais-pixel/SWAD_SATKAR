import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3124";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto(base + "/menu", { waitUntil: "networkidle" });
const book = p.locator('[aria-roledescription="menu book"]');
await book.scrollIntoViewIfNeeded();
await p.waitForTimeout(800);

// Sample the leaf across a whole turn
await p.getByRole("button", { name: "Next page" }).first().click();
const frames = [];
for (let i = 0; i < 9; i++) {
  await p.waitForTimeout(100);
  const f = await p.evaluate(() => {
    const el = document.querySelector(".menu-leaf");
    if (!el) return null;
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    const hl = el.querySelector(".leaf-highlight");
    const bg = hl ? getComputedStyle(hl).backgroundImage : "";
    const stop = bg.match(/rgba\(255, 246, 226, ([\d.]+)\)/);
    const pos = bg.match(/rgba\(255, 246, 226, [\d.]+\) ([-\d.]+)%/);
    const shadow = document.querySelectorAll('[class*="z-\\[3\\]"]');
    return {
      rotY: Math.round(Math.asin(Math.max(-1, Math.min(1, m.m13))) * 180 / Math.PI),
      m11: Number(m.m11.toFixed(2)),
      z: getComputedStyle(el).zIndex,
      half: el.dataset.half,
      hlAlpha: stop ? Number(stop[1]) : null,
      hlPos: pos ? Number(pos[1]) : null,
      shadowOpacity: shadow.length ? Number(getComputedStyle(shadow[0]).opacity).toFixed(2) : null,
    };
  });
  if (f) frames.push(f);
}
console.log("frames during one turn:");
for (const f of frames) console.log("  ", JSON.stringify(f));
await p.waitForTimeout(1200);

// Drag forward from a mid page
await p.getByRole("button", { name: "Previous page" }).first().click();
await p.waitForTimeout(1300);
const before = (await p.locator('[aria-live="polite"]').first().innerText()).trim();
const box = await book.boundingBox();
await p.mouse.move(box.x + box.width * 0.92, box.y + box.height / 2);
await p.mouse.down();
for (let i = 1; i <= 10; i++) await p.mouse.move(box.x + box.width * (0.92 - i * 0.075), box.y + box.height / 2, { steps: 2 });
await p.mouse.up();
await p.waitForTimeout(1500);
const after = (await p.locator('[aria-live="polite"]').first().innerText()).trim();
console.log("drag test:", before, "->", after, before !== after ? "TURNED" : "DID NOT TURN");

// Touch swipe on mobile layout
await p.setViewportSize({ width: 390, height: 800 });
await p.waitForTimeout(900);
await book.scrollIntoViewIfNeeded();
await p.waitForTimeout(600);
const mb = await book.boundingBox();
const beforeM = (await p.locator('[aria-live="polite"]').first().innerText()).trim();
await p.mouse.move(mb.x + mb.width * 0.85, mb.y + mb.height / 2);
await p.mouse.down();
for (let i = 1; i <= 10; i++) await p.mouse.move(mb.x + mb.width * (0.85 - i * 0.07), mb.y + mb.height / 2, { steps: 2 });
await p.mouse.up();
await p.waitForTimeout(1500);
const afterM = (await p.locator('[aria-live="polite"]').first().innerText()).trim();
console.log("mobile swipe:", beforeM, "->", afterM, beforeM !== afterM ? "TURNED" : "DID NOT TURN");
console.log(errs.length ? "ERRORS: " + errs.join(" | ") : "no errors");
await b.close();
