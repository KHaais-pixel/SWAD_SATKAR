/** Console warnings and errors on a direct phone load of each page. */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();
for (const path of (process.argv[3] ? process.argv[3].split(",") : ["/", "/menu", "/story", "/bar", "/visit"])) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
  const out = []; p.on("console", (m) => (m.type() === "warning" || m.type() === "error") && out.push(m.type() + ": " + m.text().slice(0, 100))); p.on("pageerror", (e) => out.push("pageerror: " + e.message));
  await p.goto(base + path, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(8000);
  await p.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight * 0.5, behavior: "instant" })); await p.waitForTimeout(2500);
  console.log(path, "→", out.length ? out : "clean");
  await ctx.close();
}
await b.close();
