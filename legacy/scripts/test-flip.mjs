/** Samples the turning leaf to prove no mirrored face is ever visible. */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.setDefaultTimeout(180000);
await p.goto(base + "/menu", { waitUntil: "domcontentloaded", timeout: 400000 });
await p.waitForTimeout(8000);
const book = p.locator('[aria-roledescription="menu book"]');
await book.scrollIntoViewIfNeeded({ timeout: 150000 });
await p.waitForTimeout(2500);

const probe = () =>
  p.evaluate(() => {
    const leaf = document.querySelector(".menu-leaf");
    if (!leaf) return null;
    const cs = getComputedStyle(leaf);
    const m = new DOMMatrixReadOnly(cs.transform);
    const rot = Math.round((Math.asin(Math.max(-1, Math.min(1, m.m13))) * 180) / Math.PI);
    const faces = [...leaf.children].map((f) => {
      const fs = getComputedStyle(f);
      const fm = new DOMMatrixReadOnly(fs.transform);
      // Combined determinant of the 2D part: negative means mirrored on screen.
      const combined = m.multiply(fm);
      const det = combined.a * combined.d - combined.b * combined.c;
      return {
        backface: fs.backfaceVisibility,
        mirrored: det < 0,
        visible: fs.visibility !== "hidden" && Number(fs.opacity) > 0,
      };
    });
    return { rot, leafStyle: cs.transformStyle, filter: cs.filter, faces };
  });

await p.getByRole("button", { name: "Next page" }).first().click();
const samples = [];
for (let i = 0; i < 9; i++) {
  await p.waitForTimeout(100);
  const s = await probe();
  if (s) samples.push(s);
  if (i === 4) await p.screenshot({ path: "shots/flip-midturn.png" });
}
console.log("leaf transform-style:", samples[0]?.leafStyle, "| filter:", samples[0]?.filter);
let bad = 0;
for (const s of samples) {
  const shownMirrored = s.faces.some((f) => f.mirrored && f.backface !== "hidden");
  if (shownMirrored) bad++;
  console.log(
    `rot ${String(s.rot).padStart(4)}°  faces: ` +
      s.faces.map((f) => `${f.mirrored ? "mirrored" : "upright"}/${f.backface}`).join("  "),
  );
}
console.log(bad ? `\nFAIL: ${bad} frames could show a mirrored face` : "\nPASS: every mirrored face is backface-hidden");
await b.close();
