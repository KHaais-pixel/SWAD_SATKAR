import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { photos, site } from "@/data/site";
import { getMenus } from "@/lib/content";

export const metadata: Metadata = { title: "Thakali & Nepali Menu", description: `Thakali sets, dhido sets, momo, khaja sets, snacks and seafood at ${site.name}, with prices from the printed menu.`, alternates: { canonical: "/thakali" } };

export default async function ThakaliPage() {
  const { thakali: THAKALI } = await getMenus();
  return (
    <div className="[animation:ssPage_.55s_cubic-bezier(.2,.8,.2,1)_both]">
      <section className="relative overflow-hidden bg-navy text-cream-bright">
        <Image src={photos.thali.src} alt="" fill priority sizes="100vw" className="object-cover opacity-20" />
        <div className="wrap relative py-[clamp(46px,7vw,92px)]">
          <p className="eyebrow mb-[14px] text-gold-light">Menu 01</p>
          <h1 className="display text-[clamp(30px,5.4vw,58px)]">Thakali &amp; Nepali</h1>
          <p className="mt-4 max-w-[56ch] text-[15.5px] leading-[1.7] text-cream-bright/[0.78]">All prices in Nepalese Rupees, transcribed from our printed menu. Served {site.hours.long} daily.</p>
        </div>
      </section>

      <nav aria-label="Menu sections" className="sticky top-[81px] z-40 border-b border-navy/[0.12] bg-cream/[0.96] backdrop-blur-[10px]">
        <ul className="wrap flex gap-2 overflow-x-auto py-[14px]">
          {THAKALI.map((c) => (
            <li key={c.id} className="flex-none">
              <a href={`#${c.id}`} className="block whitespace-nowrap rounded-full border border-navy/20 px-[14px] py-[9px] font-mono text-[10px] tracking-[0.18em] text-navy transition-colors hover:bg-navy hover:text-parchment">{c.cat.toUpperCase()}</a>
            </li>
          ))}
        </ul>
      </nav>

      <section className="wrap pb-[clamp(60px,9vw,110px)] pt-[clamp(34px,5vw,64px)]">
        {THAKALI.map((c) => (
          <div key={c.id} id={c.id} className="mb-[clamp(38px,5vw,66px)] scroll-mt-[150px]">
            <div className="mb-6 flex items-center gap-4">
              <h2 className="display text-[clamp(21px,3vw,31px)] text-navy sm:whitespace-nowrap">{c.cat}</h2>
              <span aria-hidden className="h-px flex-1 bg-[linear-gradient(90deg,rgba(201,162,74,.7),rgba(201,162,74,0))]" />
              <span className="font-mono text-[10.5px] tracking-[0.2em] text-gold-ink">{c.items.length} ITEMS</span>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(330px,1fr))] gap-x-10 gap-y-[2px]">
              {c.items.map((i) => (
                <li key={i.n} className="menu-row flex items-baseline gap-3 rounded-lg px-3 py-[13px]">
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-medium text-ink">{i.n}</p>
                    {i.d && <p className="mt-[5px] text-[12.5px] leading-[1.5] text-muted">{i.d}</p>}
                  </div>
                  <span aria-hidden className="h-px min-w-[14px] flex-none basis-5 bg-navy/[0.18]" />
                  <span className="flex-none font-mono text-[14px] text-gold-ink">{i.p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-[22px] rounded-[14px] border border-gold/50 bg-white p-[clamp(26px,4vw,42px)]">
          <div>
            <h2 className="display text-[24px] text-navy">Planning a khaja set for a group?</h2>
            <p className="mt-[10px] text-[14.5px] text-slate-light">Call ahead and we will prepare the platter for your table.</p>
          </div>
          <Link href="/book" data-cursor="RESERVE" className="btn btn-navy"><span className="btn-text">Book a Table</span></Link>
        </div>
      </section>
    </div>
  );
}
