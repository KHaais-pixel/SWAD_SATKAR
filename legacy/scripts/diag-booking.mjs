import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = [];
p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
p.on("console", (m) => m.type() === "error" && errs.push("console: " + m.text().slice(0, 200)));
await p.goto(base, { waitUntil: "networkidle", timeout: 180000 });
await p.waitForTimeout(3000);

const btns = await p.evaluate(() =>
  [...document.querySelectorAll("button")]
    .filter((x) => /book a table|^book$/i.test(x.textContent.trim()))
    .map((x) => ({ text: x.textContent.trim().slice(0, 20), where: x.closest("header") ? "header" : x.closest("footer") ? "footer" : "body", disabled: x.disabled, visible: x.offsetParent !== null })));
console.log("book buttons found:", JSON.stringify(btns));

// Click the hero one
const hero = p.locator("section#main, section").first();
const heroBtn = p.getByRole("button", { name: "Book a Table" }).first();
console.log("hero button count:", await p.getByRole("button", { name: "Book a Table" }).count());
await heroBtn.click({ timeout: 15000 }).catch((e) => console.log("CLICK FAILED:", String(e).split("\n")[0]));
await p.waitForTimeout(2500);
const dialogCount = await p.getByRole("dialog").count();
console.log("dialog after hero click:", dialogCount);
if (dialogCount) console.log("dialog title:", (await p.getByRole("dialog").innerText()).split("\n")[0]);

// Try the header one
if (!dialogCount) {
  const hdr = p.locator("header").getByRole("button").first();
  await hdr.click({ timeout: 10000 }).catch((e) => console.log("HEADER CLICK FAILED:", String(e).split("\n")[0]));
  await p.waitForTimeout(2500);
  console.log("dialog after header click:", await p.getByRole("dialog").count());
}

// Deep link
await p.goto(base + "/?book=1", { waitUntil: "networkidle", timeout: 120000 });
await p.waitForTimeout(3000);
console.log("dialog via ?book=1:", await p.getByRole("dialog").count());

console.log(errs.length ? "ERRORS:\n" + [...new Set(errs)].slice(0, 6).join("\n") : "no errors");
await b.close();
