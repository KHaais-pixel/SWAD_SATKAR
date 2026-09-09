import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBookBar } from "@/components/layout/MobileBookBar";
import { FoodRibbon } from "@/components/decor/FoodRibbon";
import { Story } from "@/components/sections/Story";
import { restaurant } from "@/data/restaurant";

export const metadata: Metadata = {
  title: "Story",
  description: `Two kitchens under one roof at ${restaurant.name}: Thai on one side, Thakali on the other.`,
  alternates: { canonical: "/story" },
};

export default function StoryPage() {
  return (
    <>
      {/* On arrival the router scrolls the page's first element into view, skipping
          fixed ones and anything without a size: a one-pixel mark at the very top. */}
      <div aria-hidden data-page-top className="pointer-events-none absolute left-0 top-0 h-px w-px" />
      <FoodRibbon />
      <Header solid />
      <main id="main" className="relative z-[1] pt-16">
        <Story as="h1" />
      </main>
      <Footer />
      <MobileBookBar />
    </>
  );
}
