import type { NextConfig } from "next";

/**
 * This machine keeps build artefacts and dependencies in "*.nosync" paths so
 * iCloud Drive leaves them alone (see the note at the end of README.md), and
 * reaches node_modules through a symlink the output file tracer cannot walk
 * without exhausting macOS's per-process file limit. Neither is true of a
 * build server, and both settings break one: Vercel looks for ".next", and it
 * needs the trace to decide what goes into each serverless function.
 */
const local = !process.env.VERCEL && !process.env.CI;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: local ? ".next.nosync" : ".next",
  images: {
    formats: ["image/avif", "image/webp"],
    // the default, and the cleaner encode the printed menu pages ask for
    qualities: [75, 88],
  },
  ...(local ? { outputFileTracingExcludes: { "*": ["**"] } } : {}),
  // the old addresses still land somewhere sensible
  async redirects() {
    return [
      { source: "/menu", destination: "/thakali", permanent: true },
      { source: "/visit", destination: "/contact", permanent: true },
      { source: "/reserve", destination: "/book", permanent: true },
      { source: "/admin", destination: "/staff", permanent: true },
    ];
  },
};

export default nextConfig;
