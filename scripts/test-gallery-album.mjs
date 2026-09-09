/** The gallery page, the visitors' view: albums, the masonry, the viewer, and nothing to add or delete. */
import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";
const base = process.argv[2] || "http://localhost:3123";
await mkdir("shots/gallery-album", { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); p.setDefaultTimeout(120000);
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => (m.type() === "error" || m.type() === "warning") && !/401/.test(m.text()) && errs.push(m.type() + ": " + m.text().slice(0, 140)));
const state = () => p.evaluate(() => ({
  tiles: document.querySelectorAll(".gal-tile").length, cols: document.querySelectorAll(".gal-col").length,
  chips: [...document.querySelectorAll(".gal-chip")].map((c) => c.textContent), count: document.querySelector(".gal-side b").textContent,
}));
await p.goto(base + "/gallery", { waitUntil: "networkidle" }); await p.waitForTimeout(1200);
let s = await state();
console.log(`tiles ${s.tiles} in ${s.cols} columns · header ${s.count} · chips: ${s.chips.join(" | ")}`);
await p.screenshot({ path: "shots/gallery-album/grid.png" });
// an album chip filters
await p.getByRole("button", { name: /^The Table/ }).click(); await p.waitForTimeout(700);
console.log("The Table:", (await state()).tiles, "tiles");
await p.getByRole("button", { name: /^All/ }).click(); await p.waitForTimeout(500);
// the viewer grows from the tile
await p.locator(".gal-open").nth(1).click(); await p.waitForTimeout(900);
const lb = await p.evaluate(() => { const st = document.querySelector(".gal-stage").getBoundingClientRect(); return { open: document.querySelector(".gal-lb").classList.contains("on"), count: document.querySelector(".gal-meta .count").textContent, stage: `${Math.round(st.width)}×${Math.round(st.height)} at ${Math.round(st.left)},${Math.round(st.top)}`, focus: document.activeElement.getAttribute("aria-label") }; });
console.log("viewer:", JSON.stringify(lb));
await p.screenshot({ path: "shots/gallery-album/viewer.png" });
await p.keyboard.press("ArrowRight"); await p.waitForTimeout(700);
console.log("after →:", await p.evaluate(() => document.querySelector(".gal-meta .count").textContent));
await p.keyboard.press("Escape"); await p.waitForTimeout(800);
console.log("closed:", await p.evaluate(() => !document.querySelector(".gal-lb").classList.contains("on") && document.body.style.overflow === ""));
// no owner controls for visitors
console.log("owner controls on the page:", await p.evaluate(() => document.querySelectorAll(".gal-owner, .gal-del, .gal-panel, #gal-code").length));
console.log(errs.length ? "ISSUES: " + [...new Set(errs)].join(" | ") : "no errors");
// phone: one column
const m = await b.newContext({ viewport: { width: 390, height: 844 } }); const mp = await m.newPage(); await mp.goto(base + "/gallery", { waitUntil: "networkidle" }); await mp.waitForTimeout(800);
console.log("phone columns:", await mp.evaluate(() => document.querySelectorAll(".gal-col").length), "· overflow:", await mp.evaluate(() => document.documentElement.scrollWidth - innerWidth));
await mp.screenshot({ path: "shots/gallery-album/phone.png" }); await m.close();
await b.close();
