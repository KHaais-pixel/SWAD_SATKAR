import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This machine keeps build artefacts and dependencies in "*.nosync" paths so
  // iCloud Drive leaves them alone; see the note at the end of README.md.
  distDir: ".next.nosync",
  images: {
    formats: ["image/avif", "image/webp"],
    // the default, and the cleaner encode the printed menu pages ask for
    qualities: [75, 88],
  },
  // The dependency tree is reached through a symlink here, which the output
  // file tracer cannot walk without exhausting macOS's per-process file limit.
  // Tracing only matters for `output: "standalone"` deploys.
  outputFileTracingExcludes: { "*": ["**"] },
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
