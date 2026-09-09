/** Multi-page checks: direct loads, client-side navigation, loader gating, header on phones. */
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3210";
const b = await chromium.launch();
for (const [label, vp] of [["desktop 1440", { width: 1440, height: 900 }], ["mobile 390", { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage(); p.setDefaultTimeout(120000);
  const errs = []; p.on("pageerror", (e) => errs.push("pageerror " + e.message)); p.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errs.push(m.type() + " " + m.text().slice(0, 140)));
  console.log(label);
  // direct load of an inner page: no loader, scrollable, one h1, current page marked
  await p.goto(base + "/menu", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(7000);
  const direct = await p.evaluate(() => ({ html: document.documentElement.className.split(" ").filter((c) => c.startsWith("is-")).join(","), loader: !!document.querySelector("[data-loader]"), overflow: getComputedStyle(document.documentElement).overflowY, h1: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim().slice(0, 30)), current: document.querySelector('header [aria-current="page"]')?.textContent, headerH: document.querySelector("header").getBoundingClientRect().height, mainTop: document.querySelector("main").getBoundingClientRect().top, firstText: document.querySelector("main h1").getBoundingClientRect().top, pinned: document.querySelectorAll(".pin-spacer").length, title: document.title }));
  console.log("  /menu direct:", JSON.stringify(direct));
  await p.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" })); await p.waitForTimeout(600);
  console.log("  scrolled to:", await p.evaluate(() => Math.round(scrollY)));
  if (vp.width < 1000) await p.screenshot({ path: "shots/page-menu-mobile.png" }); else await p.screenshot({ path: "shots/page-menu-top.png" });
  // client-side navigation through the header
  for (const [name, path, h1] of [["Story", "/story", "Bangkok"], ["Bar", "/bar", "Timur"], ["Visit", "/visit", "Bhanimandal"], ["Menu", "/menu", "Open the book"]]) {
    await p.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" })); await p.waitForTimeout(400);
    if (vp.width < 768) { await p.getByRole("button", { name: "Open pages" }).click(); await p.waitForTimeout(300); }
    await p.locator("header nav").getByRole("link", { name }).click(); await p.waitForURL("**" + path, { timeout: 60000 }); await p.waitForTimeout(3500);
    const r = await p.evaluate(() => ({ panelOpen: !!document.querySelector("#site-pages"), y: Math.round(scrollY), h1: document.querySelector("h1")?.textContent.trim().slice(0, 24), current: document.querySelector('header [aria-current="page"]')?.textContent, pins: document.querySelectorAll(".pin-spacer").length, ribbon: !!document.querySelector("[data-food-ribbon]"), loading: document.documentElement.classList.contains("is-loading"), lenis: !!window.__lenis, docH: document.documentElement.scrollHeight }));
    console.log(`  → ${path}: panelClosed=${!r.panelOpen} y=${r.y} h1="${r.h1}" (${r.h1?.startsWith(h1) ? "ok" : "WRONG"}) current=${r.current} pins=${r.pins} ribbon=${r.ribbon} loading=${r.loading} lenis=${r.lenis} docH=${r.docH}`);
    if (vp.width >= 1000 && path !== "/menu") await p.screenshot({ path: `shots/page${path.replace("/", "-")}.png` });
  }
  // home via the mark: arriving from another page must not show the loading screen
  await p.locator("header").getByRole("link", { name: /swad satkar/i }).first().click(); await p.waitForURL(base + "/", { timeout: 60000 }); await p.waitForTimeout(2500);
  const home = await p.evaluate(() => ({ y: Math.round(scrollY), loader: (() => { const l = document.querySelector("[data-loader]"); return l ? getComputedStyle(l).display : "none"; })(), loading: document.documentElement.classList.contains("is-loading"), hero: !!document.querySelector("[data-hero] canvas"), lounge: document.querySelector("[data-hero]")?.dataset.lounge, current: document.querySelector('header [aria-current="page"]')?.textContent ?? null }));
  console.log("  → / :", JSON.stringify(home));
  // hard load of home still shows the loader once
  await ctx.clearCookies(); await p.evaluate(() => sessionStorage.clear());
  await p.goto(base + "/", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(300);
  const hard = await p.evaluate(() => ({ loading: document.documentElement.classList.contains("is-loading"), loaderShown: (() => { const l = document.querySelector("[data-loader]"); return l ? getComputedStyle(l).display !== "none" && getComputedStyle(l).opacity : "absent"; })() }));
  await p.waitForTimeout(4500);
  const after = await p.evaluate(() => ({ loading: document.documentElement.classList.contains("is-loading"), loader: !!document.querySelector("[data-loader]") }));
  console.log("  home hard load: at 300ms", JSON.stringify(hard), "· at 4.8s", JSON.stringify(after));
  // hero CTA to the menu page: it appears at the end of the lounge, so walk there first
  await p.evaluate(() => { const sp = document.querySelector("[data-hero]").closest(".pin-spacer"); window.scrollTo({ top: sp ? sp.offsetTop + sp.getBoundingClientRect().height - innerHeight : 0, behavior: "instant" }); }); await p.waitForTimeout(1800);
  await p.getByRole("link", { name: "See the Menu" }).click(); await p.waitForURL("**/menu", { timeout: 60000 }); await p.waitForTimeout(2000);
  console.log("  See the Menu →", p.url().replace(base, ""), "y=", await p.evaluate(() => Math.round(scrollY)));
  // in-page list link under the book
  await p.locator("main").getByRole("link", { name: "Read it as a list" }).click(); await p.waitForTimeout(2500);
  const list = await p.evaluate(() => { const r = document.querySelector("#list").getBoundingClientRect(); return { top: Math.round(r.top), hash: location.hash }; });
  console.log("  Read it as a list →", JSON.stringify(list));
  if (vp.width < 1000) { await p.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" })); await p.waitForTimeout(800); }
  console.log(errs.length ? "  ISSUES:\n    " + [...new Set(errs)].join("\n    ") : "  no page errors, no console warnings");
  await ctx.close();
}
await b.close();
