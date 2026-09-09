import type { Metadata, Viewport } from "next";
import "./globals.css";
import { bodoni, cormorant, karla, spaceMono } from "./fonts";
import { site } from "@/data/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { JsonLd } from "@/components/JsonLd";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl),
  title: { default: `${site.name}: Thakali, Thai and Bar, Lalitpur`, template: `%s | ${site.name}` },
  description: `${site.tagline} Thakali sets, Thai food and a bar under one roof in Lalitpur. ${site.hours.daily}.`,
  openGraph: { type: "website", siteName: site.name, title: `${site.name}: Thakali, Thai and Bar`, description: site.tagline, locale: "en_NP", images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Swad Satkar at dusk" }] },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
  icons: { icon: [{ url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" }, { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" }], apple: [{ url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" }] },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#0e2a4a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={cn(bodoni.variable, cormorant.variable, karla.variable, spaceMono.variable)}>
      <body>
        <Header />
        <main id="main" className="min-h-[100svh] overflow-x-clip bg-cream">{children}</main>
        <Footer />
        <MotionRoot />
        <JsonLd />
      </body>
    </html>
  );
}
