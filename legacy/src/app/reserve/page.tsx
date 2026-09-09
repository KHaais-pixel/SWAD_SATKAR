import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ReserveLanding } from "@/components/booking/ReserveLanding";
import { restaurant } from "@/data/restaurant";

export const metadata: Metadata = {
  title: "Reserve a table",
  description: `Book a table at ${restaurant.name}, Lalitpur. Thai, Thakali and a proper bar.`,
  alternates: { canonical: "/reserve" },
};

export default function ReservePage() {
  return (
    <>
      {/* On arrival the router scrolls the page's first element into view, skipping
          fixed ones and anything without a size: a one-pixel mark at the very top. */}
      <div aria-hidden data-page-top className="pointer-events-none absolute left-0 top-0 h-px w-px" />
      <Header solid />
      <main id="main">
        <ReserveLanding />
      </main>
      <Footer />
    </>
  );
}
