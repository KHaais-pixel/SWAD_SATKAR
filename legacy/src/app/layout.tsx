import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { display, body, devanagari } from "./fonts";
import { restaurant } from "@/data/restaurant";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { BookingProvider } from "@/components/booking/BookingProvider";
import { JsonLd } from "@/components/JsonLd";
import { cn } from "@/lib/cn";
import { tokens } from "@/lib/tokens";

export const metadata: Metadata = {
  metadataBase: new URL(restaurant.siteUrl),
  title: {
    default: `${restaurant.name}: Thai, Thakali and Bar, Lalitpur`,
    template: `%s | ${restaurant.name}`,
  },
  description: `${restaurant.tagline} Rated ${restaurant.rating.value} on Google. Bhanimandal Marg, Lalitpur.`,
  openGraph: {
    type: "website",
    siteName: restaurant.name,
    title: `${restaurant.name}: Thai, Thakali and Bar`,
    description: restaurant.tagline,
    locale: "en_NP",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Swad Satkar: Thai, Thakali and Bar" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: tokens.ink,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="en" data-scroll-behavior="smooth" className={cn(display.variable, body.variable, devanagari.variable)}>
      <head>
        <script
          // Runs before first paint: only a first, direct load of the home page
          // gets the loading screen; repeat views and every other page skip it.
          dangerouslySetInnerHTML={{
            __html:
              "try{var h=location.pathname==='/',l=sessionStorage.getItem('swadsatkar:loaded')==='1';document.documentElement.classList.add(h&&!l?'is-loading':'is-loaded')}catch(e){document.documentElement.classList.add(location.pathname==='/'?'is-loading':'is-loaded')}",
          }}
        />
      </head>
      <body>
        <Suspense fallback={null}>
          <BookingProvider>
            <SmoothScroll />
            {children}
          </BookingProvider>
        </Suspense>
        <JsonLd />
      </body>
    </html>
  );
}
