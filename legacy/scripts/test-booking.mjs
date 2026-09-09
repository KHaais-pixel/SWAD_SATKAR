/** End-to-end test of the reservation flow. */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";

const base = process.argv[2] || "http://localhost:3123";
await mkdir("shots", { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text().slice(0, 140)));
const log = (...a) => console.log(...a);

await page.goto(base + "/?book=1", { waitUntil: "networkidle", timeout: 180000 });
const dialog = page.getByRole("dialog");
await dialog.waitFor();
log("1. modal open:", await dialog.isVisible());

// Step 1: party
await page.getByRole("radio", { name: "4 guests" }).click();
await page.getByRole("button", { name: "Continue" }).click();
await page.waitForTimeout(500);

// Step 2: date — pick the first enabled day at least 3 days out
const days = page.locator('[role="gridcell"] button:not([disabled])');
const n = await days.count();
await days.nth(Math.min(4, n - 1)).click();
const chosenDate = await days.nth(Math.min(4, n - 1)).getAttribute("aria-label");
log("2. date chosen:", chosenDate);
await page.getByRole("button", { name: "Continue" }).click();
await page.waitForTimeout(900);

// Step 3: time
await page.waitForSelector("fieldset");
const slots = page.locator('fieldset button:not([disabled])');
log("3. bookable slots:", await slots.count());
await slots.first().click();
const chosenTime = await slots.first().getAttribute("aria-label");
log("   time chosen:", chosenTime);
await page.screenshot({ path: "shots/21-booking-time.png" });
await page.getByRole("button", { name: "Continue" }).click();
await page.waitForTimeout(500);

// Step 4: occasion
await page.getByRole("radio", { name: "Birthday" }).click();
await page.getByRole("radio", { name: "Terrace" }).click();
await page.getByRole("button", { name: /Continue|Skip/ }).click();
await page.waitForTimeout(500);

// Step 5: details — validation first
await page.getByRole("button", { name: "Confirm reservation" }).click();
await page.waitForTimeout(600);
const alerts = await page.getByRole("alert").count();
log("4. validation errors shown on empty submit:", alerts);

await page.getByLabel("Name").fill("Anjali Gurung");
await page.getByLabel("Phone").fill("+977 9801234567");
await page.getByLabel("Email").fill("anjali@example.com");
await page.getByLabel(/Notes/).fill("One high chair please.");

// Refresh mid-booking to prove the draft persists
await page.waitForTimeout(400);
await page.reload({ waitUntil: "networkidle", timeout: 180000 });
await page.waitForTimeout(1200);
const resumeVisible = await page.getByRole("button", { name: "Continue" }).first().isVisible().catch(() => false);
const resumeText = await page.getByRole("dialog").innerText().catch(() => "");
log("5. after refresh, resume offered:", /Continue your reservation/.test(resumeText));
await page.screenshot({ path: "shots/22-booking-resume.png" });
await page.getByRole("button", { name: "Continue" }).first().click();
await page.waitForTimeout(700);
log("   resumed on step:", (await page.getByRole("dialog").innerText()).split("\n")[0]);

// Details again (form values are restored from the draft)
await page.waitForTimeout(400);
const nameVal = await page.getByLabel("Name").inputValue().catch(() => "(no name field)");
log("   restored name:", nameVal);
if (!nameVal || nameVal === "(no name field)") {
  await page.getByLabel("Name").fill("Anjali Gurung");
  await page.getByLabel("Phone").fill("+977 9801234567");
  await page.getByLabel("Email").fill("anjali@example.com");
}
await page.getByRole("button", { name: "Confirm reservation" }).click();
await page.waitForTimeout(2000);

const confirmText = await page.getByRole("dialog").innerText();
const ref = confirmText.match(/SS-[A-Z0-9]+/);
log("6. reference code:", ref ? ref[0] : "NOT FOUND");
await page.screenshot({ path: "shots/23-booking-confirmed.png" });

// .ics download
const [dl] = await Promise.all([
  page.waitForEvent("download", { timeout: 15000 }),
  page.getByRole("button", { name: "Add to calendar" }).click(),
]);
const p = await dl.path();
const ics = readFileSync(p, "utf8");
log("7. ics filename:", dl.suggestedFilename());
log("   ics valid:", ics.startsWith("BEGIN:VCALENDAR") && ics.includes("END:VCALENDAR") && /DTSTART;TZID=Asia\/Kathmandu:\d{8}T\d{6}/.test(ics));
log("   ics summary line:", (ics.split("\r\n").find((l) => l.startsWith("SUMMARY")) || "").slice(0, 60));

// My reservations + cancel
await page.getByRole("button", { name: "My reservations" }).click();
await page.waitForTimeout(600);
const mine = await page.getByRole("dialog").innerText();
log("8. my reservations lists the code:", ref ? mine.includes(ref[0]) : false);
await page.getByRole("button", { name: "Cancel" }).first().click();
await page.waitForTimeout(900);
log("   after cancel, shows cancelled:", (await page.getByRole("dialog").innerText()).includes("cancelled"));

console.log(errors.length ? "\nERRORS:\n" + [...new Set(errors)].join("\n") : "\nno errors");
await browser.close();
