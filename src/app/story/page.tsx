import type { Metadata } from "next";
import { StoryScenes } from "@/components/StoryScenes";
import { site, timeline } from "@/data/site";

export const metadata: Metadata = { title: "Our Story", description: `The story behind ${site.name}: a Thakali kitchen, a Thai kitchen and a bar under one roof in Lalitpur, and the four rooms to eat in.`, alternates: { canonical: "/story" } };

export default function StoryPage() {
  return (
    <>
      {/* the story by scroll; the page's arrival animation stays off its ancestors, since a
          transform there would unpin the scenes */}
      <StoryScenes />

      <div className="[animation:ssPage_.55s_cubic-bezier(.2,.8,.2,1)_both]">
        <section data-scene className="mx-auto max-w-[820px] px-[var(--gutter)] py-[clamp(50px,8vw,100px)]" aria-labelledby="behind-title">
          <p data-step className="eyebrow mb-[14px] text-gold-ink">The story behind Swad Satkar</p>
          <h2 id="behind-title" data-step className="display text-[clamp(24px,3.6vw,38px)] text-navy">Two kitchens, one welcome</h2>
          <p data-step className="mt-6 font-accent text-[clamp(20px,2.6vw,28px)] leading-[1.5] text-navy [text-wrap:pretty]">
            Swad Satkar means flavour offered as hospitality — <em lang="ne">{site.taglineNepali}.</em> The name sets the terms: cook the way it is cooked at home, and receive people the way you would receive them at home.
          </p>
          <p data-step className="mt-7 text-[16px] leading-[1.8] text-slate">The house sits on a corner under the sign that reads Thakali · Thai · Continental, with the liquor store at street level and the dining rooms above. Evenings, the strings of lights go on, the flags catch the wind, and the room fills with people coming off the road.</p>
          <p data-step className="mt-[22px] text-[16px] leading-[1.8] text-slate">Two kitchens work side by side. One follows the Thakali set — rice or dhido, dal, curry, greens, achar, dahi — the food of the Thak Khola, carried down the trade route and served on steel. The other works Thai: tom yum, nam sai, green and red curry, papaya salad, prawn and trout. Nothing is fused. Both are cooked properly, and you choose.</p>
          <p data-step className="mt-[22px] border-l-2 border-gold/60 pl-4 text-[14px] leading-[1.7] text-muted">Founding year, family history and the names behind the kitchen are placeholders for now — send us those details and they go in here.</p>
        </section>

        <section data-scene className="border-t border-navy/[0.08] bg-mist" aria-labelledby="keep-title">
          <div className="mx-auto max-w-[1000px] px-[var(--gutter)] py-[clamp(50px,8vw,96px)]">
            <h2 id="keep-title" className="display mb-[clamp(28px,4vw,48px)] text-center text-[clamp(24px,3.6vw,38px)] text-navy">What We Keep</h2>
            <dl>
              {timeline.map((t) => (
                <div key={t.k} data-step className="grid grid-cols-[minmax(0,120px)_minmax(0,1fr)] gap-[clamp(16px,3vw,40px)] border-b border-navy/[0.12] py-[26px]">
                  <dt className="pt-[6px] font-mono text-[10.5px] tracking-[0.2em] text-gold-ink">{t.k}</dt>
                  <dd className="m-0">
                    <h3 className="display text-[clamp(19px,2.4vw,25px)] font-normal text-navy">{t.t}</h3>
                    <p className="mt-[10px] max-w-[58ch] text-[15px] leading-[1.72] text-slate">{t.d}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

      </div>
    </>
  );
}
