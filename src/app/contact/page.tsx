import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { contactCards, photos, site } from "@/data/site";

export const metadata: Metadata = { title: "Contact & Visit", description: `Find ${site.name} on ${site.address.street}, ${site.address.locality}: hours, phone, email and the map.`, alternates: { canonical: "/contact" } };

export default function ContactPage() {
  return (
    <div className="[animation:ssPage_.55s_cubic-bezier(.2,.8,.2,1)_both]">
      <section className="wrap py-[clamp(44px,7vw,86px)]">
        <div className="text-center">
          <Image src={photos.plaque.src} alt="" width={1200} height={887} sizes="320px" priority className="mx-auto mb-7 block h-auto w-[min(320px,72vw)] rounded-lg" />
          <h1 className="display text-[clamp(28px,5vw,52px)] tracking-[0.06em] text-navy">SWAD SATKAR</h1>
          <p className="mt-3 font-mono text-[11px] tracking-[0.34em] text-gold-ink">THAKALI • THAI • BAR</p>
          <p className="mt-[18px] text-[16px] text-slate">{site.hours.short.replace("OPEN ", "Open ")}, every day</p>
        </div>
        <ul data-scene className="mt-[clamp(34px,5vw,58px)] grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-[18px]">
          {contactCards.map((c) => (
            <li key={c.k} data-step className="lift-card rounded-xl border border-navy/[0.12] bg-white px-6 py-[26px]">
              <p className="mono-tag mb-3 text-gold-ink">{c.k}</p>
              <p className="text-[16px] font-medium leading-[1.6] text-ink">{"href" in c && c.href ? <a href={c.href} className="text-ink hover:text-gold-ink">{c.v}</a> : c.v}</p>
              <p className="mt-2 text-[13px] leading-[1.6] text-muted">{c.note}</p>
            </li>
          ))}
        </ul>
        <div className="mt-[22px] overflow-hidden rounded-xl border border-navy/[0.12] bg-mist">
          <iframe
            title={`Map showing ${site.name} on ${site.address.street}, ${site.address.locality}`}
            src={site.maps.embedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-[clamp(220px,32vw,340px)] w-full border-0"
          />
          <div className="flex flex-wrap items-center justify-between gap-[14px] border-t border-navy/10 bg-white px-6 py-5">
            <p className="text-[14px] text-slate">Street level: Kasthamandap Liquor Store · Dining above</p>
            <div className="flex flex-wrap gap-3">
              <a href={site.maps.directionsUrl} target="_blank" rel="noreferrer" className="btn btn-gold px-[26px] py-[14px] tracking-[0.14em]">Get Directions</a>
              <Link href="/book" data-cursor="RESERVE" className="btn btn-outline px-[26px] py-[14px] tracking-[0.14em]"><span className="btn-text">Book a Table</span></Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
