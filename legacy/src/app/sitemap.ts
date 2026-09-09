import type { MetadataRoute } from "next";
import { restaurant } from "@/data/restaurant";

/** The public pages. The admin panel is deliberately not listed. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ["/", "/menu", "/story", "/bar", "/visit", "/reserve"].map((path) => ({
    url: new URL(path, restaurant.siteUrl).toString(),
    lastModified: now,
    changeFrequency: path === "/menu" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
