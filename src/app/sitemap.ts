import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ["/", "/story", "/thakali", "/thai", "/bar", "/gallery", "/book", "/contact"].map((path) => ({
    url: new URL(path, site.siteUrl).toString(),
    lastModified: now,
    changeFrequency: path === "/thakali" || path === "/thai" || path === "/bar" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
