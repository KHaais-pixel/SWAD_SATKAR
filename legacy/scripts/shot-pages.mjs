/** Screenshots of the phone header with the pages panel open, and the home page top. */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); p.setDefaultTimeout(120000);
await p.goto(base + "/bar", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(6000);
await p.getByRole("button", { name: "Open pages" }).click(); await p.waitForTimeout(600);
await p.screenshot({ path: "shots/pages-panel-mobile.png" });
const tree = await p.evaluate(() => [...document.querySelectorAll("#site-pages a")].map((a) => `${a.textContent.trim()}${a.getAttribute("aria-current") ? " (current)" : ""}`));
console.log("panel:", tree.join(" · "));
await p.keyboard.press("Escape"); await p.waitForTimeout(300);
console.log("after Escape, panel present:", await p.evaluate(() => !!document.querySelector("#site-pages")), "· focus on:", await p.evaluate(() => document.activeElement?.getAttribute("aria-label")));
await b.close();
