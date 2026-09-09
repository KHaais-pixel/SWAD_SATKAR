"use client";
import { formatCell, formatPrice } from "@/data/menu";
import { HeatGlyph, LeafGlyph } from "@/components/ui/Glyphs";
import { useAnyUnpriced, useEffectiveMenu } from "@/hooks/useMenuView";
import type { EffectiveGroup } from "@/lib/menuOverrides";
import { cn } from "@/lib/cn";

/**
 * The whole menu as plain semantic HTML. Always in the DOM so it is crawlable
 * and reachable by screen readers without touching the animated book. Names,
 * prices and availability come through the admin override layer.
 */
export function PlainMenu({ className, headingLevel = "h3" }: { className?: string; headingLevel?: "h2" | "h3" }) {
  const pages = useEffectiveMenu();
  const anyUnpriced = useAnyUnpriced();
  const H = headingLevel;
  const Sub = headingLevel === "h2" ? "h3" : "h4";

  // A table that can scroll sideways needs to be reachable by keyboard, and
  // needs a name so it is not an anonymous scroll region.
  const Table = ({ group }: { group: EffectiveGroup }) => (
    <div
      tabIndex={0}
      role="region"
      aria-label={`${group.title} price table, scrollable`}
      className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure"
    >
      <table className="w-full min-w-[380px] border-collapse text-small">
        <caption className="sr-only">{group.title} prices in rupees</caption>
        <thead>
          <tr>
            <th scope="col" className="eyebrow py-2 text-left">
              Item
            </th>
            {group.columns?.map((c) => (
              <th key={c} scope="col" className="eyebrow py-2 text-right">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {group.items.map((item) => (
            <tr key={item.key} className="border-t border-hairline/60">
              <th scope="row" className="py-2 pr-3 text-left font-normal">
                <span className="font-display text-[1.0625rem] text-paper">{item.name}</span>
                {item.veg && <LeafGlyph className="ml-1.5 align-middle" />}
              </th>
              {group.columns?.map((c, i) => (
                <td key={c} className="py-2 text-right tabular-nums text-fg-muted">
                  {formatCell(item.prices?.[i])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={cn("text-fg", className)}>
      {anyUnpriced && (
        <p className="mb-6 text-small text-fg-muted">Prices shown as TBC are not printed on the menu. Please ask us.</p>
      )}
      {pages
        .filter((p) => p.kind === "menu")
        .map((page) => (
          <section key={page.id} aria-labelledby={`plain-${page.id}`} className="mb-10">
            <H id={`plain-${page.id}`} className="text-h3 text-paper">
              {page.label}
            </H>
            {page.groups?.map((group) => (
              <div key={group.key} className="mt-5">
                <Sub className="eyebrow mb-2">
                  {group.title}
                  {group.note && <span className="ml-2 normal-case tracking-normal text-fg-muted">{group.note}</span>}
                </Sub>
                {group.columns ? (
                  <Table group={group} />
                ) : (
                  <ul className="divide-y divide-hairline/60">
                    {group.items.map((item) => (
                      <li key={item.key} className="py-3">
                        <div className="flex items-baseline gap-2">
                          <span
                            className={cn(
                              "font-display text-[1.0625rem] text-paper",
                              item.unavailable && "line-through opacity-60",
                            )}
                          >
                            {item.name}
                          </span>
                          {item.veg && <LeafGlyph />}
                          {item.heat ? <HeatGlyph level={item.heat} /> : null}
                          <span aria-hidden className="leader" />
                          <span className="tabular-nums text-small">
                            <span className="sr-only">{item.price === 0 ? "price not printed" : "price"} </span>
                            {formatPrice(item.price)}
                          </span>
                        </div>
                        {(item.note || item.desc || item.unavailable) && (
                          <p className="text-small text-fg-muted">
                            {item.note ?? item.desc}
                            {item.unavailable && (
                              <span className="ml-1 text-[0.6875rem] uppercase tracking-[0.14em]">
                                · off menu tonight
                              </span>
                            )}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        ))}
    </div>
  );
}
