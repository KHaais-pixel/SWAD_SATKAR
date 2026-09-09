/** axe audit across routes and states.  node scripts/test-a11y.mjs [baseUrl] */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
const base = process.argv[2] || "http://localhost:3123";
const b = await chromium.launch();
let total = 0;
const run = async (label, path, setup, opts = {}) => {
  const ctx = await b.newContext({ viewport: opts.viewport || { width: 1440, height: 900 }, reducedMotion: opts.reduced ? "reduce" : "no-preference" });
  const p = await ctx.newPage();
  await p.goto(base + path, { waitUntil: "domcontentloaded", timeout: 120000 });
  await p.waitForTimeout(1500);
  if (setup) await setup(p);
  // the audit reads colours, so nothing may be caught mid-reveal: let the reveals finish, then pin every step open
  await p.waitForTimeout(1600);
  await p.evaluate(() => { document.documentElement.classList.remove("motion"); document.querySelectorAll("[data-step]").forEach((el) => { el.style.opacity = "1"; el.style.transform = "none"; }); document.querySelectorAll("[data-line-inner]").forEach((el) => { el.style.transform = "none"; }); });
  await p.waitForTimeout(300);
  const results = await new AxeBuilder({ page: p }).exclude('iframe[title^="Map"]').withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  console.log(`== ${label}: ${results.violations.length} violation(s)`);
  for (const v of results.violations) {
    console.log(`  [${v.impact}] ${v.id}: ${v.help}`);
    for (const n of v.nodes.slice(0, 4)) console.log(`      ${n.target.join(" ")} — ${(n.failureSummary || "").split("\n").slice(1, 2).join(" ").slice(0, 160)}`);
  }
  total += results.violations.length;
  await ctx.close();
};
await run("home", "/", async (p) => { await p.evaluate(() => window.scrollTo(0, innerHeight)); await p.waitForTimeout(600); });
await run("story", "/story");
await run("thakali", "/thakali");
await run("thai", "/thai");
await run("bar", "/bar");
await run("gallery", "/gallery");
await run("gallery lightbox", "/gallery", async (p) => { await p.locator("button.gal-open").first().click(); await p.waitForTimeout(900); });
await run("book", "/book");
await run("book submitted", "/book", async (p) => {
  await p.fill('input[placeholder="Your full name"]', "Test Guest"); await p.fill('input[type="tel"]', "9800000000"); await p.fill('input[type="date"]', "2026-09-20");
  await p.getByRole("button", { name: "Book a Table" }).last().click(); await p.waitForTimeout(600);
});
await run("contact", "/contact");
await run("staff locked", "/staff");
const unlock = async (p) => { await p.fill("#staff-code", "swad2026"); await p.getByRole("button", { name: "Enter" }).click(); await p.waitForTimeout(500); };
await run("staff open", "/staff", unlock);
await run("staff gallery", "/staff", async (p) => { await unlock(p); await p.getByRole("tab", { name: "GALLERY" }).click(); await p.waitForTimeout(1200); });
await run("staff prices", "/staff", async (p) => { await unlock(p); await p.getByRole("tab", { name: "PRICES" }).click(); await p.waitForTimeout(900); });
await run("staff spirits", "/staff", async (p) => { await unlock(p); await p.getByRole("tab", { name: "PRICES" }).click(); await p.waitForTimeout(700); await p.getByRole("button", { name: "SPIRITS" }).click(); await p.waitForTimeout(400); });
await run("phone home, menu open", "/", async (p) => { await p.evaluate(() => window.scrollTo(0, innerHeight)); await p.waitForTimeout(600); await p.getByRole("button", { name: "Open menu" }).click(); await p.waitForTimeout(400); }, { viewport: { width: 360, height: 780 } });
await run("phone thakali", "/thakali", null, { viewport: { width: 360, height: 780 } });
await run("reduced motion home", "/", null, { reduced: true });
await b.close();
console.log(`\nTOTAL violations: ${total}`);
