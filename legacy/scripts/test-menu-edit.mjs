/** Proves the admin panel can rename, reprice, add and remove dishes, and
 *  that each change reaches the public menu. */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 950 } });
const p = await ctx.newPage();
p.setDefaultTimeout(120000);
const errs = [];
p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
p.on("console", (m) => m.type() === "error" && errs.push("console: " + m.text().slice(0, 160)));
const log = (...a) => console.log(...a);

await p.goto(base + "/admin", { waitUntil: "domcontentloaded", timeout: 400000 });
await p.waitForTimeout(6000);
await p.getByRole("tab", { name: "Menu" }).click();
await p.waitForTimeout(2500);

// Narrow to one page so the DOM stays small
await p.locator("select").selectOption("thakali");
await p.waitForTimeout(1200);
log("1. filtered to Thakali page");

// Rename a dish
const nameInput = p.getByLabel("Name of Mutton Thakali Set");
await nameInput.fill("Mutton Thakali Special");
await nameInput.press("Enter");
await p.waitForTimeout(900);
log("2. renamed Mutton Thakali Set");

// Change its price
const priceInput = p.getByLabel("Price of Mutton Thakali Special");
await priceInput.fill("725");
await priceInput.press("Enter");
await p.waitForTimeout(900);
log("3. repriced to 725");

// Add a dish
await p.getByRole("button", { name: /Add a dish to Dhido Set/ }).click();
await p.waitForTimeout(500);
await p.getByPlaceholder("e.g. Chicken Sekuwa").fill("Buff Dhido Set");
await p.locator('form input[type="number"]').first().fill("640");
await p.getByRole("button", { name: "Add dish" }).click();
await p.waitForTimeout(1200);
log("4. added Buff Dhido Set at 640");

// Remove a dish
await p.getByRole("button", { name: "Remove Veg Thakali Set" }).click();
await p.waitForTimeout(1000);
const removedChip = await p.getByRole("button", { name: /Put back on the menu/ }).count();
log("5. removed Veg Thakali Set · restore chips:", removedChip);

// Edit a variant price on a table-priced group
await p.locator("select").selectOption("rice-momo");
await p.waitForTimeout(1200);
const jhol = p.getByLabel("Jhol price for Chicken Momo");
await jhol.fill("315");
await jhol.press("Enter");
await p.waitForTimeout(900);
log("6. set Chicken Momo Jhol to 315");

await p.screenshot({ path: "shots/admin-04-menu-edit.png" });

// Now check the public menu reflects everything
await p.goto(base + "/menu", { waitUntil: "domcontentloaded", timeout: 400000 });
await p.waitForTimeout(6000);
const body = await p.locator("main").innerText();
const checks = {
  "renamed dish shows": body.includes("Mutton Thakali Special"),
  "old name gone": !body.includes("Mutton Thakali Set"),
  "new price shows": body.includes("Rs 725"),
  "added dish shows": body.includes("Buff Dhido Set"),
  "added price shows": body.includes("Rs 640"),
  "removed dish gone": !body.includes("Veg Thakali Set"),
  "variant price shows": body.includes("315"),
};
for (const [k, v] of Object.entries(checks)) log(`   ${v ? "PASS" : "FAIL"}  ${k}`);

// Reset returns to the printed card
await p.goto(base + "/admin", { waitUntil: "domcontentloaded", timeout: 400000 });
await p.waitForTimeout(5000);
await p.getByRole("tab", { name: "Menu" }).click();
await p.waitForTimeout(1500);
await p.getByRole("button", { name: "Reset to printed menu" }).click();
await p.waitForTimeout(400);
await p.getByRole("button", { name: "Discard" }).click();
await p.waitForTimeout(1500);
await p.goto(base + "/menu", { waitUntil: "domcontentloaded", timeout: 400000 });
await p.waitForTimeout(5000);
const after = await p.locator("main").innerText();
log("7. after reset, printed menu restored:", after.includes("Mutton Thakali Set") && !after.includes("Buff Dhido Set"));

console.log(errs.length ? "\nERRORS:\n" + [...new Set(errs)].slice(0, 5).join("\n") : "\nno errors");
await b.close();
