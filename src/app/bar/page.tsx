import type { Metadata } from "next";
import { BarScenes } from "@/components/BarScenes";
import { barAtmosphere, site } from "@/data/site";
import { getMenus } from "@/lib/content";

export const metadata: Metadata = { title: "The Bar", description: `Spirits by the bottle and the measure, beer, hookah, tea and coffee at ${site.name}. Last orders midnight.`, alternates: { canonical: "/bar" } };

export default async function BarPage() {
  const { bar, smoking, spirits: SPIRITS } = await getMenus();
  const lists = site.showSmoking ? [...bar, smoking] : bar;
  const cols = ["BOTTLE", "30ML", "60ML", "HALF", "QTR"];
  return (
    <>
      {/* the lounge, in three scroll-driven scenes; the page's arrival animation stays
          off its ancestors, since a transform there would unpin the scenes */}
      <BarScenes as="h1" id="lounge" eyebrow="The Bar · Hookah Lounge" cta={{ href: "/book", label: "Book a Table", cursor: "RESERVE" }} />

      <div className="[animation:ssPage_.55s_cubic-bezier(.2,.8,.2,1)_both]">
      <section data-scene className="wrap pad-section-sm" aria-label="The room">
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
          {barAtmosphere.map((a) => (
            <li key={a.k} data-step className="lift-card rounded-xl border border-navy/[0.12] bg-white px-[26px] py-7">
              <p className="mono-tag mb-[14px] text-gold-ink">{a.k}</p>
              <h2 className="display text-[22px] text-navy">{a.t}</h2>
              <p className="mt-3 text-[14.5px] leading-[1.7] text-slate-light">{a.d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-navy text-cream-bright" aria-labelledby="bar-menu-title">
        <div className="wrap pad-section-sm">
          <div className="mb-[10px] flex items-center gap-4">
            <h2 id="bar-menu-title" className="display text-[clamp(22px,3.2vw,34px)]">Bar Menu</h2>
            <span aria-hidden className="h-px flex-1 bg-[linear-gradient(90deg,rgba(201,162,74,.8),rgba(201,162,74,0))]" />
          </div>
          <p className="mb-[26px] text-[13.5px] text-cream-bright/60">Prices in NPR, as printed on our bar menu. Spirits are listed by bottle, 30ml, 60ml, half and quarter.</p>

          <div className="overflow-x-auto rounded-xl border border-gold/35 bg-cream-bright/[0.04]">
            <table className="w-full min-w-[640px] border-collapse text-[14px]">
              <thead>
                <tr className="bg-gold/[0.14] font-mono text-[9px] tracking-[0.14em] text-gold-light">
                  <th scope="col" className="px-[18px] py-[14px] text-left font-normal">SPIRIT</th>
                  {cols.map((c) => <th key={c} scope="col" className="px-2 py-[14px] text-right font-normal">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {SPIRITS.map((s) => (
                  <tr key={s.n} className="border-t border-cream-bright/[0.09] transition-colors hover:bg-gold/10">
                    <th scope="row" className="px-[18px] py-[13px] text-left font-medium">{s.n}</th>
                    <td className="px-2 py-[13px] text-right font-mono text-[12.5px] text-gold-light">{s.b}</td>
                    {[s.m30, s.m60, s.h, s.q].map((v, i) => <td key={i} className="px-2 py-[13px] text-right font-mono text-[12.5px] text-cream-bright/[0.72]">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-[clamp(34px,5vw,56px)] grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[clamp(24px,4vw,44px)]">
            {lists.map((c) => (
              <div key={c.cat}>
                <h3 className="display mb-[6px] text-[20px] text-gold-light">{c.cat}</h3>
                {c.note && <p className="mb-[14px] text-[12.5px] leading-[1.5] text-cream-bright/55">{c.note}</p>}
                <ul>
                  {c.items.map((i) => (
                    <li key={i.n} className="flex items-baseline gap-3 border-b border-cream-bright/[0.09] py-[10px]">
                      <span className="flex-1 text-[14.5px]">{i.n}</span>
                      <span className="whitespace-nowrap font-mono text-[13px] text-gold-light">{i.p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
