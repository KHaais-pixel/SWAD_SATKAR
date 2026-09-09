"use client";
import { restaurant } from "@/data/restaurant";
import { formatCell, formatPrice, type MenuPage } from "@/data/menu";
import { HeatGlyph, LeafGlyph } from "@/components/ui/Glyphs";
import { Logo } from "@/components/ui/Logo";
import { useBooking } from "@/components/booking/BookingProvider";
import { useEffectivePage } from "@/hooks/useMenuView";
import type { EffectiveGroup, EffectiveItem, EffectivePage } from "@/lib/menuOverrides";
import { cn } from "@/lib/cn";
import { MountainFooter, PageFrame, SectionBanner } from "./Ornaments";

interface PageFaceProps {
  page: MenuPage | null;
  side: "left" | "right" | "single";
  number: number;
  total: number;
  /** Hidden faces (leaf backs, the book itself) are aria-hidden and inert. */
  inert?: boolean;
  className?: string;
}

/** One dish on a single-price line, with a dotted leader to the price. */
function DishRow({ item }: { item: EffectiveItem }) {
  return (
    <li className="flex flex-col py-[0.2em]">
      <div className="flex items-baseline">
        <span
          className={cn(
            "text-[0.9375rem] font-medium leading-tight text-[var(--menu-gold)]",
            item.unavailable && "line-through opacity-60",
          )}
        >
          {item.name}
        </span>
        {(item.veg || item.heat) && (
          <span className="ml-2 inline-flex items-center gap-1 self-center">
            {item.veg && <LeafGlyph />}
            {item.heat ? <HeatGlyph level={item.heat} /> : null}
          </span>
        )}
        <span aria-hidden className="leader text-[var(--menu-gold-dim)]" />
        <span
          className={cn(
            "shrink-0 tabular-nums text-[0.875rem] text-[var(--menu-gold-bright)]",
            item.price === 0 && "tracking-[0.2em]",
          )}
        >
          <span className="sr-only">{item.price === 0 ? "price not printed" : "price"} </span>
          {formatPrice(item.price)}
        </span>
      </div>
      {(item.note || item.desc || item.unavailable) && (
        <p className="text-[0.6875rem] leading-snug text-[var(--menu-gold-dim)]">
          {item.note ?? item.desc}
          {item.unavailable && (
            <span className="ml-1 text-[0.625rem] uppercase tracking-[0.14em]">· off menu tonight</span>
          )}
        </p>
      )}
    </li>
  );
}

/** A group priced as a table: momo styles, spirit measures, cigarette formats. */
function PriceTable({ group }: { group: EffectiveGroup }) {
  const cols = group.columns ?? [];
  return (
    <table className="w-full border-collapse">
      <caption className="sr-only">{group.title} prices in rupees</caption>
      <thead>
        <tr>
          <th scope="col" className="w-[40%] py-1 text-left">
            <span className="sr-only">Item</span>
          </th>
          {cols.map((c) => (
            <th
              key={c}
              scope="col"
              className="py-1 text-right text-[0.5625rem] font-medium uppercase tracking-[0.1em] text-[var(--menu-gold-dim)]"
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {group.items.map((item) => (
          <tr key={item.key} className="border-t border-[var(--menu-rule-faint)]">
            <th scope="row" className="py-[0.28em] pr-2 text-left font-normal">
              <span className="text-[0.8125rem] font-medium leading-tight text-[var(--menu-gold)]">{item.name}</span>
              {item.veg && <LeafGlyph className="ml-1.5 align-middle" />}
            </th>
            {cols.map((c, i) => (
              <td
                key={c}
                className="py-[0.28em] text-right text-[0.75rem] tabular-nums text-[var(--menu-gold-bright)]"
              >
                {formatCell(item.prices?.[i])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CoverFace() {
  return (
    <div className="flex h-full flex-col items-center justify-center pb-6 text-center">
      <span className="rounded-[2px] border border-[var(--menu-rule)] p-[3px] shadow-[0_10px_30px_-12px_rgb(0_0_0/0.8)]">
        <Logo variant="full" size="lg" asLink={false} />
      </span>
      <p className="mt-6 text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--menu-gold-dim)]">
        {restaurant.descriptor}
      </p>
      <p className="mt-7 max-w-[24ch] font-display text-[1.0625rem] italic leading-snug text-[var(--menu-gold-bright)]">
        {restaurant.cardTagline}
      </p>
      <p lang="ne" className="font-devanagari mt-3 text-[0.8125rem] text-[var(--menu-gold)]">
        {restaurant.taglineNepali}
      </p>
    </div>
  );
}

function BackFace({ inert }: { inert?: boolean }) {
  const { open } = useBooking();
  return (
    <div className="flex h-full flex-col items-center justify-center pb-6 text-center">
      <p lang="ne" className="font-devanagari text-[1.5rem] text-[var(--menu-gold-bright)]">
        धन्यवाद
      </p>
      <h3 className="mt-2 font-display text-[clamp(1.75rem,3.2vw,2.375rem)] leading-[1.08] text-[var(--menu-gold-bright)]">
        Thank you.
      </h3>
      <p className="mt-5 max-w-[28ch] text-[0.875rem] leading-relaxed text-[var(--menu-gold)]">
        For being a part of our journey. Ask us about today&rsquo;s special, cooked in small numbers and gone by nine.
      </p>
      <button
        type="button"
        onClick={() => open()}
        tabIndex={inert ? -1 : 0}
        className="mt-7 inline-flex h-11 items-center rounded-full border border-[var(--menu-gold-dim)] px-6 text-[0.9375rem] font-medium text-[var(--menu-gold-bright)] transition-colors duration-[var(--dur-std)] hover:bg-[var(--menu-gold-dim)] hover:text-[var(--menu-page)]"
      >
        Book a Table
      </button>
      <p className="mt-6 text-[0.75rem] text-[var(--menu-gold-dim)]">{restaurant.hoursSummary}</p>
    </div>
  );
}

function MenuFace({ page }: { page: EffectivePage }) {
  // Only flag the page that actually carries a dish with no printed price.
  const pageHasUnpriced = (page.groups ?? []).some((g) =>
    g.items.some((i) => !i.prices && (i.price ?? 0) === 0),
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-[1.125rem] tracking-[0.02em] text-[var(--menu-gold-bright)]">{page.label}</h3>
        {page.mark && (
          <span
            lang={page.mark === "ไทย" ? "th" : "ne"}
            aria-hidden
            className={cn("text-[0.875rem] text-[var(--menu-gold-dim)]", page.mark !== "ไทย" && "font-devanagari")}
          >
            {page.mark}
          </span>
        )}
      </div>

      <div className="mt-1 flex flex-1 flex-col gap-1">
        {page.groups?.map((group) => (
          <section key={group.key} aria-label={`${page.label}: ${group.title}`}>
            <SectionBanner>
              {group.title}
              {group.note && <span className="ml-2 normal-case tracking-normal opacity-70">{group.note}</span>}
            </SectionBanner>
            {group.columns ? (
              <PriceTable group={group} />
            ) : (
              <ul>
                {group.items.map((item) => (
                  <DishRow key={item.key} item={item} />
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {pageHasUnpriced && (
        <p className="text-[0.625rem] uppercase tracking-[0.14em] text-[var(--menu-gold-dim)]">
          Ask us for the price marked ···
        </p>
      )}
    </div>
  );
}

export function PageFace({ page, side, number, total, inert, className }: PageFaceProps) {
  const effective = useEffectivePage(page);
  return (
    <div
      className={cn("paper-grain relative h-full w-full overflow-hidden", className)}
      aria-hidden={inert || undefined}
      style={{
        backgroundColor: "var(--menu-page)",
        backgroundImage:
          "radial-gradient(120% 90% at 50% 0%, rgb(26 58 112 / 0.55), transparent 62%)," +
          (side === "left"
            ? "linear-gradient(to left, rgb(2 8 22 / 0.6), rgb(2 8 22 / 0.16) 9%, transparent 24%)"
            : side === "right"
              ? "linear-gradient(to right, rgb(2 8 22 / 0.6), rgb(2 8 22 / 0.16) 9%, transparent 24%)"
              : "linear-gradient(to right, rgb(2 8 22 / 0.35), transparent 8%)"),
      }}
    >
      <PageFrame />
      <MountainFooter />
      <div className="relative z-[2] flex h-full flex-col px-9 pb-16 pt-10 sm:px-12">
        {page?.kind === "cover" && <CoverFace />}
        {effective?.kind === "menu" && <MenuFace page={effective} />}
        {page?.kind === "back" && <BackFace inert={inert} />}
        {page && (
          <p
            aria-hidden
            className={cn(
              "mt-1 text-[0.625rem] tracking-[0.14em] text-[var(--menu-gold-dim)]",
              side === "left" ? "text-left" : "text-right",
            )}
          >
            {number} / {total}
          </p>
        )}
      </div>
    </div>
  );
}
