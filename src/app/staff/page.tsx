import type { Metadata } from "next";
import { StaffPanel } from "@/components/StaffPanel";

export const metadata: Metadata = { title: "Staff Panel", robots: { index: false, follow: false } };

export default function StaffPage() {
  return (
    <div className="min-h-[70vh] bg-mist-deep [animation:ssPage_.55s_cubic-bezier(.2,.8,.2,1)_both]">
      <section className="bg-navy text-cream-bright">
        <div className="wrap-wide flex flex-wrap items-end justify-between gap-[18px] py-[clamp(30px,4vw,52px)]">
          <div>
            <p className="mono-tag mb-3 text-gold-light">Staff panel</p>
            <h1 className="display text-[clamp(24px,3.6vw,38px)]">Reservations, Gallery, Prices</h1>
          </div>
          <p className="max-w-[44ch] text-[13px] leading-[1.6] text-cream-bright/60">Photographs and prices you change here go live on the website. Reservation requests arrive from the website and are kept on the server, so every member of staff sees the same list.</p>
        </div>
      </section>
      <StaffPanel />
    </div>
  );
}
