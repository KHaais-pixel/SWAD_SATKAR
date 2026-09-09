import type { Metadata } from "next";
import { site } from "@/data/site";
import { getMenus } from "@/lib/content";

export const metadata: Metadata = { title: "Thai Menu", description: `Tom yum, nam sai, green and red curries, salads and the seafood platter at ${site.name}, with prices from the printed menu.`, alternates: { canonical: "/thai" } };

export default async function ThaiPage() {
  const { thai: THAI } = await getMenus();
  return (
    <div className="[animation:ssPage_.55s_cubic-bezier(.2,.8,.2,1)_both]">
      <section className="border-b border-navy/10" style={{ background: "linear-gradient(160deg,#DCE9F7 0%,#F3F8FD 100%)" }}>
        <div className="wrap py-[clamp(46px,7vw,92px)]">
          <p className="eyebrow mb-[14px] text-gold-ink">Menu 02</p>
          <h1 className="display text-[clamp(30px,5.4vw,58px)] text-navy">Thai Food</h1>
          <p className="mt-4 max-w-[56ch] text-[15.5px] leading-[1.7] text-slate">All prices in Nepalese Rupees. Two prices separated by a slash indicate the portion options offered.</p>
        </div>
      </section>
      <section className="wrap pb-[clamp(60px,9vw,110px)] pt-[clamp(38px,6vw,80px)]">
        {THAI.map((c) => (
          <div key={c.id} className="mb-[clamp(36px,5vw,62px)]">
            <div className="mb-[22px] flex items-center gap-4">
              <h2 className="display text-[clamp(21px,3vw,31px)] text-navy sm:whitespace-nowrap">{c.cat}</h2>
              <span aria-hidden className="h-px flex-1 bg-[linear-gradient(90deg,rgba(201,162,74,.7),rgba(201,162,74,0))]" />
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[14px]">
              {c.items.map((i) => (
                <li key={i.n} className="menu-card flex items-baseline justify-between gap-[14px] rounded-[10px] border border-navy/10 bg-white px-5 py-[18px]">
                  <p className="text-[15.5px] font-medium text-ink">{i.n}</p>
                  <span className="whitespace-nowrap font-mono text-[13.5px] text-gold-ink">{i.p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
