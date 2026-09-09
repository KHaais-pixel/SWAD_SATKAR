/** LCP / CLS sampling against a production server. */
import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:3124";
const browser = await chromium.launch();

for (const [label, opts] of [
  ["desktop 1440", { viewport: { width: 1440, height: 900 } }],
  ["mobile 390 (4x CPU throttle, Fast 3G)", { viewport: { width: 390, height: 844 }, throttle: true }],
]) {
  const ctx = await browser.newContext({ viewport: opts.viewport });
  const page = await ctx.newPage();
  const client = await page.context().newCDPSession(page);
  if (opts.throttle) {
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await client.send("Network.enable");
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    });
  }
  await page.goto(base, { waitUntil: "load" });
  await page.waitForTimeout(4000);
  const m = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let lcp = 0;
        let cls = 0;
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) lcp = Math.max(lcp, e.startTime);
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value;
        }).observe({ type: "layout-shift", buffered: true });
        setTimeout(() => {
          const nav = performance.getEntriesByType("navigation")[0];
          const paint = performance.getEntriesByType("paint");
          resolve({
            lcp: Math.round(lcp),
            cls: Math.round(cls * 1000) / 1000,
            fcp: Math.round(paint.find((p) => p.name === "first-contentful-paint")?.startTime || 0),
            domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
            transferKB: Math.round(performance.getEntriesByType("resource").reduce((a, r) => a + (r.transferSize || 0), 0) / 1024),
            requests: performance.getEntriesByType("resource").length,
          });
        }, 800);
      }),
  );
  console.log(label + ":", JSON.stringify(m));
  await ctx.close();
}
await browser.close();
