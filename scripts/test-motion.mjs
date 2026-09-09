/** The motion system: reveals complete, the hero scrubs, colours ease, the header knows where it is, cursor and tilt only for pointers, reduced motion shows all. */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3123";
const b = await chromium.launch();
const walk = async (p, vh) => { const h = await p.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y <= h; y += vh * 0.5) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(140); } };
const hidden = (p) => p.evaluate(() => [...document.querySelectorAll("[data-step], [data-line-inner]")].filter((el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return (+cs.opacity < 0.95 || (el.hasAttribute("data-line-inner") && cs.transform !== "none" && Math.abs(new DOMMatrix(cs.transform).m42) > 2)) && r.width > 0; }).map((el) => el.tagName + "." + (el.className || "").toString().slice(0, 30)));

// desktop
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 120)));
  await p.goto(base, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(2600);
  const start = await p.evaluate(() => ({ motion: document.documentElement.classList.contains("motion"), lenis: !!window.__lenis, cursor: !!document.querySelector(".cursor-ring[data-on]"), progress: document.querySelectorAll('nav[aria-label="Sections"] a').length, stepsHiddenAtTop: [...document.querySelectorAll("[data-step]")].filter((el) => +getComputedStyle(el).opacity < 0.05).length, heroTitleOpacity: +getComputedStyle(document.getElementById("hero-title")).opacity }));
  console.log("desktop start:", JSON.stringify(start));
  // hero scrub at half a viewport
  await p.evaluate(() => window.scrollTo(0, innerHeight * 0.5)); await p.waitForTimeout(900);
  const mid = await p.evaluate(() => { const t = document.getElementById("hero-title"); const cs = getComputedStyle(t); const img = t.closest("section").querySelector("div.absolute > div.absolute"); return { titleOpacity: +(+cs.opacity).toFixed(2), letterSpacing: cs.letterSpacing, titleY: Math.round(new DOMMatrix(cs.transform).m42), imgScale: +new DOMMatrix(getComputedStyle(img).transform).a.toFixed(3), navHidden: +getComputedStyle(document.querySelector("header")).opacity < 0.5 }; });
  console.log("hero at 50%:", JSON.stringify(mid));
  await walk(p, 900); await p.waitForTimeout(1500);
  const end = await p.evaluate(() => ({ mainBg: getComputedStyle(document.getElementById("main")).backgroundColor, navTheme: document.documentElement.dataset.navTheme, navActive: document.documentElement.dataset.navActive, active: document.querySelector('nav[aria-label="Sections"] a[aria-current]')?.textContent?.replace(/\s+/g, " ").trim() }));
  console.log("at bottom:", JSON.stringify(end), "· still hidden:", (await hidden(p)).slice(0, 6));
  // header over the dark Thakali section
  await p.evaluate(() => document.getElementById("thakali").scrollIntoView({ block: "start", behavior: "instant" })); await p.waitForTimeout(1200);
  const inThakali = await p.evaluate(() => ({ navTheme: document.documentElement.dataset.navTheme, headerBg: getComputedStyle(document.querySelector("header")).backgroundColor, onLink: document.querySelector('.nav-link[data-on="true"]')?.textContent, mainBg: getComputedStyle(document.getElementById("main")).backgroundColor }));
  console.log("in thakali:", JSON.stringify(inThakali));
  // cursor words + tilt
  const card = p.locator(".food-card").first(); await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
  const box = await card.boundingBox(); await p.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3); await p.waitForTimeout(700);
  const hover = await p.evaluate(() => { const ring = document.querySelector(".cursor-ring"); const card = document.querySelector(".food-card"); const m = new DOMMatrix(getComputedStyle(card).transform); return { ringState: ring.dataset.state, word: ring.textContent.trim(), tilted: m.is2D === false || Math.abs(m.m13) + Math.abs(m.m23) > 0.001, cardTransform: getComputedStyle(card).transform.slice(0, 40) }; });
  console.log("card hover:", JSON.stringify(hover));
  await p.locator('a[data-cursor="RESERVE"]').first().hover(); await p.waitForTimeout(600);
  console.log("book hover word:", await p.evaluate(() => document.querySelector(".cursor-ring").textContent.trim()));
  console.log(errs.length ? "ERRORS: " + errs.join(" | ") : "no errors");
  await ctx.close();
}
// phone: no cursor, no tilt, lighter movement, reveals still complete
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const p = await ctx.newPage();
  await p.goto(base, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(2200);
  await walk(p, 844); await p.waitForTimeout(1500);
  console.log("phone:", JSON.stringify(await p.evaluate(() => ({ cursor: !!document.querySelector(".cursor-ring[data-on]"), progress: !!document.querySelector('nav[aria-label="Sections"]') && getComputedStyle(document.querySelector('nav[aria-label="Sections"]')).display !== "none", overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }))), "· still hidden:", (await hidden(p)).slice(0, 6));
  await ctx.close();
}
// reduced motion: everything visible at once, no lenis, no cursor
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }); const p = await ctx.newPage();
  await p.goto(base, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(1500);
  console.log("reduced:", JSON.stringify(await p.evaluate(() => ({ motionClass: document.documentElement.classList.contains("motion"), lenis: !!window.__lenis, cursor: !!document.querySelector(".cursor-ring[data-on]"), hiddenSteps: [...document.querySelectorAll("[data-step]")].filter((el) => +getComputedStyle(el).opacity < 0.95).length }))));
  await ctx.close();
}
await b.close();
