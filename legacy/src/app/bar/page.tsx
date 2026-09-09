import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBookBar } from "@/components/layout/MobileBookBar";
import { FoodRibbon } from "@/components/decor/FoodRibbon";
import { Bar } from "@/components/sections/Bar";
import { restaurant } from "@/data/restaurant";

export const metadata: Metadata = {
  title: "Bar",
  description: `The bar at ${restaurant.name}, Lalitpur: a short list of cocktails, Nepali spirits and ${restaurant.happyHour.label.toLowerCase()}.`,
  alternates: { canonical: "/bar" },
};

export default function BarPage() {
  return (
    <>
      {/* On arrival the router scrolls the page's first element into view, skipping
          fixed ones and anything without a size: a one-pixel mark at the very top. */}
      <div aria-hidden data-page-top className="pointer-events-none absolute left-0 top-0 h-px w-px" />
      <FoodRibbon />
      <Header solid />
      <main id="main" className="relative z-[1] pt-16">
        <Bar as="h1" />
      </main>
      <Footer />
      <MobileBookBar />
    </>
  );
}
