import type { Metadata } from "next";
import { BookForm } from "@/components/BookForm";
import { site } from "@/data/site";

export const metadata: Metadata = { title: "Book a Table", description: `Request a table at ${site.name}. We call back to confirm every booking.`, alternates: { canonical: "/book" } };

export default function BookPage() {
  return (
    <div className="[animation:ssPage_.55s_cubic-bezier(.2,.8,.2,1)_both]">
      <section className="text-cream-bright" style={{ background: "linear-gradient(165deg,#0E2A4A 0%,#143761 100%)" }}>
        <div className="wrap py-[clamp(46px,7vw,92px)]">
          <p className="eyebrow mb-[14px] text-gold-light">Reservations</p>
          <h1 className="display text-[clamp(28px,5.2vw,58px)]">YOUR TABLE IS WAITING.</h1>
          <p className="mt-4 max-w-[58ch] text-[15.5px] leading-[1.7] text-cream-bright/[0.78]">Send us a request and we will call you back to confirm. Open daily, {site.hours.long}.</p>
        </div>
      </section>
      <section className="mx-auto max-w-[900px] px-[var(--gutter)] pb-[clamp(60px,9vw,110px)] pt-[clamp(36px,6vw,72px)]">
        <BookForm />
      </section>
    </div>
  );
}
