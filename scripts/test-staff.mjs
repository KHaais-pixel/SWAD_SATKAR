/** The staff panel's gallery and prices: an upload reaches the gallery, a price reaches the menu, and both can be undone.  node scripts/test-staff.mjs [baseUrl] */
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
const base = process.argv[2] || "http://localhost:3123";
const CODE = process.env.STAFF_PASSCODE || "swad2026";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 140)));

const reelCount = async (path) => { const q = await ctx.newPage(); await q.goto(base + path, { waitUntil: "domcontentloaded" }); await q.waitForSelector(".gal-tile", { timeout: 20000 }); await q.waitForTimeout(400); const n = await q.evaluate(() => ({ figs: document.querySelectorAll(".gal-tile").length, last: [...document.querySelectorAll(".gal-cap .al")].pop()?.textContent })); await q.close(); return n; };
const priceOf = async (path, item) => { const q = await ctx.newPage(); await q.goto(base + path, { waitUntil: "domcontentloaded" }); const v = await q.evaluate((n) => { const li = [...document.querySelectorAll("li")].find((l) => l.querySelector("p")?.textContent === n); return li?.querySelector("span.font-mono")?.textContent; }, item); await q.close(); return v; };

// the wrong code is refused by the server, whatever the browser says
const bad = await p.request.get(base + "/api/staff/gallery", { headers: { "x-staff-code": "nope" } });
console.log("wrong passcode:", bad.status());

await p.goto(base + "/staff", { waitUntil: "networkidle" }); await p.waitForTimeout(600);
await p.fill("#staff-code", CODE); await p.getByRole("button", { name: "Enter" }).click(); await p.waitForSelector("[role=tab]");
console.log("tabs:", await p.evaluate(() => [...document.querySelectorAll('[role=tab]')].map((t) => t.textContent).join(" · ")));

/* gallery */
await p.getByRole("tab", { name: "GALLERY" }).click(); await p.waitForTimeout(800);
const before = await reelCount("/gallery");
await p.setInputFiles("#g-file", { name: "terrace.jpg", mimeType: "image/jpeg", buffer: await readFile("public/photos/mixed-grill.jpg") });
await p.fill("#g-album", "Nights"); await p.fill("#g-note", "Added by the test");
await p.getByRole("button", { name: "Add to the gallery" }).click();
await p.waitForSelector("[role=status]", { timeout: 30000 });
console.log("upload:", await p.locator("[role=status]").textContent());
const after = await reelCount("/gallery");
console.log(`gallery: ${before.figs} → ${after.figs} tiles (last album "${after.last}")`);
const upload = await p.evaluate(() => { const i = [...document.querySelectorAll("img")].find((i) => (i.getAttribute("src") || "").includes("uploads%2Fgallery")); return i ? decodeURIComponent(new URL(i.getAttribute("src"), location.href).searchParams.get("url")) : ""; });
console.log("panel shows the upload:", upload || "NO");
await p.waitForTimeout(600); const delBtn = p.getByRole("button", { name: /^Delete Added by the test/ }); await delBtn.click();
const sure = p.getByRole("button", { name: /^Confirm: delete/ }); await sure.waitFor({ timeout: 4000 }); console.log("first click:", await sure.textContent()); await sure.click(); await p.waitForTimeout(1200);
const gone = await reelCount("/gallery");
console.log(`removed: gallery back to ${gone.figs} · file answers ${(await p.request.get(base + upload)).status()} · list: ${(await readFile("content/gallery.json", "utf8")).replace(/\s+/g, "")}`);

// a house photograph put away from the panel, then the set restored
await p.getByRole("button", { name: /^Put away/ }).first().click(); const sureP = p.getByRole("button", { name: /^Confirm: put away/ }); await sureP.waitFor({ timeout: 4000 }); await sureP.click(); await p.waitForTimeout(1200);
const fewer = await reelCount("/gallery"); console.log(`put away from the panel: gallery shows ${fewer.figs} · status: ${await p.locator("[role=status]").textContent()}`);
await p.getByRole("button", { name: "Restore the house set" }).click(); await p.waitForTimeout(1200);
console.log(`restored: gallery shows ${(await reelCount("/gallery")).figs} · file: ${(await readFile("content/gallery.json", "utf8")).replace(/\s+/g, "")}`);

/* prices */
await p.getByRole("tab", { name: "PRICES" }).click(); await p.waitForTimeout(800);
const printed = await priceOf("/thakali", "Veg Thakali Set");
const box = p.getByLabel("Price for Veg Thakali Set");
await box.fill("475/-");
console.log("changed note:", await p.locator("text=CHANGED FROM PRINTED").textContent());
await p.getByRole("button", { name: "Save" }).click(); await p.waitForSelector("[role=status]", { timeout: 15000 });
const live = await priceOf("/thakali", "Veg Thakali Set");
console.log(`price: printed ${printed} → live ${live}`);
await p.locator('button[title="Printed: 450/-"]').click(); await p.getByRole("button", { name: "Save" }).click(); await p.waitForTimeout(1200);
console.log(`restored: ${await priceOf("/thakali", "Veg Thakali Set")} · file: ${(await readFile("content/prices.json", "utf8")).replace(/\s+/g, "")}`);
// spirits too
await p.getByRole("button", { name: "SPIRITS" }).click(); await p.waitForTimeout(300);
await p.getByLabel("Roku, b").fill("12500"); await p.getByRole("button", { name: "Save" }).click(); await p.waitForTimeout(1200);
const q = await ctx.newPage(); await q.goto(base + "/bar", { waitUntil: "domcontentloaded" });
console.log("spirit on /bar:", await q.evaluate(() => [...document.querySelectorAll("tr")].find((r) => r.textContent.startsWith("Roku"))?.querySelectorAll("td")[0].textContent)); await q.close();
await p.getByLabel("Roku, b").fill(""); await p.getByRole("button", { name: "Save" }).click(); await p.waitForTimeout(1200);
console.log("spirits file after restore:", (await readFile("content/prices.json", "utf8")).replace(/\s+/g, ""));
console.log(errs.length ? "ISSUES: " + [...new Set(errs)].join(" | ") : "no errors");
await b.close();
