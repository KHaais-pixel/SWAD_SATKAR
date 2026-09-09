import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();
for (const [label, tab] of [["reservations", null], ["service", "Service"], ["menu", "Menu"]]) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  await p.goto(base + "/admin", { waitUntil: "networkidle", timeout: 240000 });
  await p.waitForTimeout(2000);
  if (tab) { await p.getByRole("tab", { name: tab }).click(); await p.waitForTimeout(1200); }
  const r = await new AxeBuilder({ page: p }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]).analyze();
  console.log(`admin/${label}: ${r.violations.length} violation(s)`);
  for (const v of r.violations) {
    console.log(`  [${v.impact}] ${v.id}: ${v.help}`);
    for (const n of v.nodes.slice(0,2)) console.log(`      ${n.target.join(" ")}`);
  }
  await p.close();
}
await b.close();
