import { restaurant } from "@/data/restaurant";
import { StarRow } from "@/components/ui/StarRow";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowIcon } from "@/components/ui/Glyphs";

/**
 * The rating and nothing more. Quotes appear here only once real, permitted
 * Google reviews exist; until then the number links straight to the source.
 */
export function Reviews() {
  const { value, count, url } = restaurant.rating;

  return (
    <section id="reviews" className="relative bg-transparent py-10 md:py-14" aria-labelledby="reviews-title">
      <div className="container-site">
        <Reveal className="flex flex-col gap-8 border-y border-hairline py-10 md:flex-row md:items-center md:justify-between md:py-12">
          <div className="flex items-center gap-6">
            <span className="font-display text-[clamp(4rem,9vw,6.5rem)] leading-none text-paper" aria-hidden>
              {value.toFixed(1)}
            </span>
            <div>
              <StarRow value={value} size={18} />
              <h2 id="reviews-title" className="text-h3 mt-3 text-paper">
                Rated {value} on Google.
              </h2>
              <p className="mt-1 text-small text-fg-muted">
                {count !== null ? `From ${count} reviews.` : "Every review, unfiltered."}
              </p>
            </div>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 self-start text-azure underline-offset-4 hover:underline md:self-auto"
          >
            Read the reviews <ArrowIcon className="h-4 w-4" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
