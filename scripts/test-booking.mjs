/** The request flow end to end: type (focus must survive every keystroke), submit, see it in the staff panel, change its status, export. */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3123";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errs.push(m.type() + ": " + m.text().slice(0, 120)));
await p.goto(base + "/book", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(1200);
const name = p.locator('input[placeholder="Your full name"]');
await name.click(); await p.keyboard.type("Anjali Gurung", { delay: 30 });
console.log("typed name:", await name.inputValue(), "· still focused:", await name.evaluate((el) => document.activeElement === el));
await p.locator('input[type="tel"]').fill("9841234567");
await p.locator('input[type="email"]').fill("anjali@example.com");
await p.locator('input[type="date"]').fill("2026-09-20");
await p.selectOption("select >> nth=0", "8:00 PM"); await p.selectOption("select >> nth=1", "4 guests"); await p.selectOption("select >> nth=2", "Terrace / hookah");
await p.locator("textarea").fill("Birthday, one high chair please.");
await p.getByRole("button", { name: "Book a Table" }).last().click(); await p.waitForTimeout(800);
const status = await p.getByRole("status").innerText();
const ref = (status.match(/SS-\d{4}/) || [])[0];
console.log("submitted:", status.includes("Request received") ? "received" : "NOT received", "· ref", ref, "· shows guests/seating:", status.includes("4 guests") && status.includes("Terrace / hookah"));
const stored = await p.evaluate(() => JSON.parse(localStorage.getItem("swadsatkar.reservations") || "[]"));
console.log("stored:", stored.length, stored[0]?.status, stored[0]?.name);
// the staff panel, same browser
await p.goto(base + "/staff", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(800);
await p.fill("#staff-code", "wrong"); await p.getByRole("button", { name: "Enter" }).click(); await p.waitForTimeout(300);
console.log("wrong code shows error:", await p.getByRole("alert").count());
await p.fill("#staff-code", "swad2026"); await p.getByRole("button", { name: "Enter" }).click(); await p.waitForTimeout(500);
const card = p.locator("article").first();
console.log("panel row:", (await card.innerText()).replace(/\s+/g, " ").slice(0, 160));
await card.getByRole("button", { name: "CONFIRM" }).click(); await p.waitForTimeout(300);
console.log("after confirm:", await card.locator("span").first().innerText(), "· pending filter hides it:", await (async () => { await p.getByRole("button", { name: "PENDING" }).click(); await p.waitForTimeout(300); return (await p.locator("article").count()) === 0; })());
await p.getByRole("button", { name: "ALL" }).click();
const [dl] = await Promise.all([p.waitForEvent("download"), p.getByRole("button", { name: "EXPORT CSV" }).click()]);
console.log("csv:", dl.suggestedFilename());
// phone menu
await p.setViewportSize({ width: 390, height: 844 }); await p.goto(base + "/story", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(800);
await p.getByRole("button", { name: "Open menu" }).click(); await p.waitForTimeout(400);
await p.locator("#site-menu").getByRole("link", { name: "Bar" }).click(); await p.waitForURL("**/bar"); await p.waitForTimeout(600);
console.log("phone menu → /bar, menu closed:", await p.locator("#site-menu").count() === 0, "· h1:", await p.locator("h1").innerText());
// old addresses
for (const r of ["/menu", "/visit", "/reserve", "/admin"]) { await p.goto(base + r, { waitUntil: "domcontentloaded" }); console.log(r, "→", new URL(p.url()).pathname); }
console.log(errs.length ? "ISSUES:\n  " + [...new Set(errs)].join("\n  ") : "no page errors, no console noise");
await b.close();
