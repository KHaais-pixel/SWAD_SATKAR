import { cocktails } from "@/data/cocktails";
import { restaurant } from "@/data/restaurant";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * The bar as a short list. Three drinks, read like a menu card: name, what
 * it is built on, one line on how it tastes. No cards, no illustrations,
 * one note about prices instead of three.
 */
export function Bar({ as: H = "h2" }: { as?: "h1" | "h2" }) {
  const priced = cocktails.some((c) => c.price !== "TBC");
  return (
    <section
      id="bar"
      className="section-y relative overflow-hidden scroll-mt-16"
      aria-labelledby="bar-title"
      style={{ background: "linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--ink-deep) 55%, transparent) 30%, color-mix(in srgb, var(--ink-deep) 55%, transparent) 70%, transparent 100%)" }}
    >
      {/* one low lamp over the bar */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 50% at 70% 0%, rgb(92 200 245 / 0.14), transparent 70%)" }} />
      <div className="container-site relative grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-6">
        <Reveal className="md:col-span-5">
          <Eyebrow mark="बार">The bar</Eyebrow>
          <H id="bar-title" className="text-h2 mt-4 max-w-[17ch] text-paper">
            Timur in the sour, raksi in the old fashioned.
          </H>
          <p className="mt-5 max-w-[38ch] text-fg-muted">
            A short list, made properly. Nepali spirits where they belong, Thai herbs where they surprise.
          </p>
          <p className="mt-8 text-paper">
            {restaurant.happyHour.label}, {restaurant.happyHour.window.toLowerCase()}.{" "}
            <span className="text-fg-muted">{restaurant.happyHour.note}.</span>
          </p>
        </Reveal>

        <Reveal delay={0.08} className="md:col-span-6 md:col-start-7">
          <ul className="divide-y divide-hairline border-t border-hairline">
            {cocktails.map((c) => (
              <li key={c.id} className="grid grid-cols-1 gap-2 py-7 sm:grid-cols-[1fr_auto] sm:gap-8 md:py-8">
                <div>
                  <h3 className="font-display text-[1.75rem] leading-tight text-paper md:text-[2rem]">{c.name}</h3>
                  <p className="mt-2 max-w-[42ch] text-fg-muted">{c.desc}</p>
                </div>
                <p className="text-small text-fg-muted sm:pt-2 sm:text-right">
                  {c.base}
                  {priced && c.price !== "TBC" && <span className="mt-1 block text-paper">{c.price}</span>}
                </p>
              </li>
            ))}
          </ul>
          {!priced && <p className="mt-4 text-small text-fg-muted">Prices to be confirmed.</p>}
        </Reveal>
      </div>
    </section>
  );
}
