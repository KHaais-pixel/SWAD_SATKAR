import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBookBar } from "@/components/layout/MobileBookBar";
import { Loader } from "@/components/layout/Loader";
import { Hero } from "@/components/sections/Hero";
import { ThaliService } from "@/components/sections/ThaliService";
import { DishCarousel } from "@/components/sections/DishCarousel";
import { Reviews } from "@/components/sections/Reviews";

/** The front door: the film, the serve, the plates, the rating. Everything else has its own page. */
export default function HomePage() {
  return (
    <>
      {/* On arrival the router scrolls the page's first element into view, skipping
          fixed ones and anything without a size: a one-pixel mark at the very top. */}
      <div aria-hidden data-page-top className="pointer-events-none absolute left-0 top-0 h-px w-px" />
      <Loader />
      <Header />
      <main id="main" className="relative z-[1]">
        <Hero />
        <ThaliService />
        <DishCarousel />
        <Reviews />
      </main>
      <Footer />
      <MobileBookBar />
    </>
  );
}
