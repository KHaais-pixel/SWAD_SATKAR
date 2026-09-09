/** The loading screen: present at first paint, gone within the ceiling, scroll locked while up, once per visit. */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); p.setDefaultTimeout(150000);
await p.goto(base, { waitUntil: "domcontentloaded", timeout: 400000 });
const early = await p.evaluate(() => ({ loader: !!document.querySelector("[data-loader]") && getComputedStyle(document.querySelector("[data-loader]")).display !== "none", locked: document.documentElement.classList.contains("is-loading") }));
const t0 = Date.now(); let gone = null;
for (let i = 0; i < 80; i++) { await p.waitForTimeout(100); const g = await p.evaluate(() => { const l = document.querySelector("[data-loader]"); return !l || getComputedStyle(l).opacity === "0" || getComputedStyle(l).display === "none"; }); if (g) { gone = Date.now() - t0; break; } }
const afterState = await p.evaluate(() => ({ locked: document.documentElement.classList.contains("is-loading"), seen: sessionStorage.getItem("swadsatkar:loaded"), heroVisible: !!document.querySelector("h1") }));
await p.goto(base, { waitUntil: "domcontentloaded", timeout: 400000 }); await p.waitForTimeout(300);
const second = await p.evaluate(() => { const l = document.querySelector("[data-loader]"); return !!l && getComputedStyle(l).display !== "none"; });
console.log(`first visit: loader=${early.loader} locked=${early.locked} · gone after ${gone ?? ">6000"}ms · unlocked=${!afterState.locked} remembered=${afterState.seen === "1"} · second visit shows loader=${second}`);
await b.close();
