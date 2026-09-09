import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBookBar } from "@/components/layout/MobileBookBar";
import { FoodRibbon } from "@/components/decor/FoodRibbon";
import { MenuSection } from "@/components/sections/MenuSection";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PlainMenu } from "@/components/menu/PlainMenu";
import { PrintButton } from "@/components/menu/PrintButton";
import { restaurant } from "@/data/restaurant";

export const metadata: Metadata = {
  title: "Menu",
  description: `The full Thai, Thakali and bar menu at ${restaurant.name}, Lalitpur.`,
  alternates: { canonical: "/menu" },
};

/** The book first, scrubbed with scroll; the same menu as a plain list underneath, which is what prints. */
export default function MenuPage() {
  return (
    <>
      {/* On arrival the router scrolls the page's first element into view, skipping
          fixed ones and anything without a size: a one-pixel mark at the very top. */}
      <div aria-hidden data-page-top className="pointer-events-none absolute left-0 top-0 h-px w-px" />
      <FoodRibbon />
      <Header solid />
      <main id="main" className="relative z-[1] pt-16">
        <MenuSection as="h1" />
        <section id="list" className="section-y relative bg-transparent scroll-mt-16" aria-labelledby="list-title">
          <div className="container-site">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <Eyebrow mark="सूची">The list</Eyebrow>
                <h2 id="list-title" className="text-h2 mt-4 text-paper">Everything on the table.</h2>
                <p className="mt-3 max-w-[48ch] text-fg-muted">{restaurant.descriptor}. Print this page, or save it as a PDF.</p>
              </div>
              <PrintButton />
            </div>
            <div className="mt-14 max-w-[720px]">
              <PlainMenu headingLevel="h3" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileBookBar />
    </>
  );
}
