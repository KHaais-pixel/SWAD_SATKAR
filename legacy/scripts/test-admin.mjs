/** Smoke test for the admin panel and its effect on the public site. */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const base = process.argv[2] || "http://localhost:3210";
await mkdir("shots", { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 950 }, acceptDownloads: true });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
p.on("console", (m) => m.type() === "error" && errs.push("console: " + m.text().slice(0, 160)));
const log = (...a) => console.log(...a);

// Seed one reservation through the public flow so the panel has data.
await p.goto(base + "/?book=1", { waitUntil: "networkidle", timeout: 240000 });
await p.getByRole("dialog").waitFor({ timeout: 60000 });
await p.getByRole("radio", { name: "4 guests" }).click();
await p.getByRole("button", { name: "Continue" }).click();
await p.waitForTimeout(400);
const days = p.locator('[role="gridcell"] button:not([disabled])');
await days.nth(3).click();
await p.getByRole("button", { name: "Continue" }).click();
await p.waitForTimeout(900);
await p.locator("fieldset button:not([disabled])").first().click();
await p.getByRole("button", { name: "Continue" }).click();
await p.waitForTimeout(400);
await p.getByRole("button", { name: /Continue|Skip/ }).click();
await p.waitForTimeout(400);
await p.getByLabel("Name").fill("Bikash Shrestha");
await p.getByLabel("Phone").fill("+977 9812345678");
await p.getByLabel("Email").fill("bikash@example.com");
await p.getByRole("button", { name: "Confirm reservation" }).click();
await p.waitForTimeout(2200);
const ref = (await p.getByRole("dialog").innerText()).match(/SS-[A-Z0-9]+/);
log("1. seeded booking:", ref ? ref[0] : "FAILED");

// Admin panel
await p.goto(base + "/admin", { waitUntil: "networkidle", timeout: 240000 });
await p.waitForTimeout(2500);
log("2. admin heading:", (await p.locator("h1").innerText()).trim());
await p.screenshot({ path: "shots/admin-01-reservations.png" });
const listed = await p.getByText("Bikash Shrestha").count();
log("3. booking visible in panel:", listed > 0);

// Seat it
await p.getByRole("button", { name: "Seat" }).first().click();
await p.waitForTimeout(900);
log("4. after Seat, status shown:", (await p.getByText("Seated").first().isVisible().catch(() => false)));

// CSV export
const [dl] = await Promise.all([
  p.waitForEvent("download", { timeout: 20000 }),
  p.getByRole("button", { name: "Export CSV" }).click(),
]);
log("5. csv filename:", dl.suggestedFilename());

// Service tab: close a date
await p.getByRole("tab", { name: "Service" }).click();
await p.waitForTimeout(900);
await p.screenshot({ path: "shots/admin-02-service.png" });
const openDay = p.locator('[role="gridcell"] button:not([disabled])[aria-pressed="false"]');
const dayLabel = await openDay.nth(6).getAttribute("aria-label");
await openDay.nth(6).click();
await p.waitForTimeout(700);
log("6. closed a date:", dayLabel?.split(",")[0]);
const chips = await p.locator("button", { hasText: /^\d+ \w+×?$/ }).count();
log("   closed-date chips:", await p.getByRole("button", { name: "Reopen this date" }).count() || chips);

// Menu tab: set a price
await p.getByRole("tab", { name: "Menu" }).click();
await p.waitForTimeout(900);
const priceInput = p.locator('input[type="number"]').first();
await priceInput.fill("450");
await p.waitForTimeout(700);
await p.screenshot({ path: "shots/admin-03-menu.png" });
log("7. set first dish price to 450");

// Public site should now show it
await p.goto(base + "/menu", { waitUntil: "networkidle", timeout: 240000 });
await p.waitForTimeout(2500);
const body = await p.locator("main").innerText();
log("8. public menu shows Rs 450:", body.includes("Rs 450"));
log("   public menu still shows 'Prices to be confirmed':", body.includes("Prices to be confirmed"));

// Booking calendar should now strike the closed date
await p.goto(base + "/?book=1", { waitUntil: "networkidle", timeout: 240000 });
await p.getByRole("dialog").waitFor({ timeout: 60000 });
await p.getByRole("radio", { name: "2 guests" }).click();
await p.getByRole("button", { name: "Continue" }).click();
await p.waitForTimeout(900);
const closedBtns = await p.locator('[role="gridcell"] button[aria-label*="closed"]').count();
log("9. dates marked closed in the guest calendar:", closedBtns);

console.log(errs.length ? "\nERRORS:\n" + [...new Set(errs)].slice(0, 5).join("\n") : "\nno errors");
await b.close();
