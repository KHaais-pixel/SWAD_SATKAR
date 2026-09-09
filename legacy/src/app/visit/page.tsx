import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBookBar } from "@/components/layout/MobileBookBar";
import { Visit } from "@/components/sections/Visit";
import { restaurant } from "@/data/restaurant";

export const metadata: Metadata = {
  title: "Visit",
  description: `Find ${restaurant.name} on Bhanimandal Marg, Lalitpur: hours, directions, phone and WhatsApp.`,
  alternates: { canonical: "/visit" },
};

export default function VisitPage() {
  return (
    <>
      {/* On arrival the router scrolls the page's first element into view, skipping
          fixed ones and anything without a size: a one-pixel mark at the very top. */}
      <div aria-hidden data-page-top className="pointer-events-none absolute left-0 top-0 h-px w-px" />
      <Header solid />
      <main id="main" className="relative z-[1] pt-16">
        <Visit as="h1" />
      </main>
      <Footer />
      <MobileBookBar />
    </>
  );
}
