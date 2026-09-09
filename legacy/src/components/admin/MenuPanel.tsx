"use client";
import { useEffect, useMemo, useState } from "react";
import { adminClient } from "@/lib/adminClient";
import { itemKey, type EffectiveGroup, type EffectiveItem } from "@/lib/menuOverrides";
import { useAdminState } from "@/hooks/useAdminState";
import { useEffectiveMenu } from "@/hooks/useMenuView";
import { Button } from "@/components/ui/Button";
import { LeafGlyph } from "@/components/ui/Glyphs";
import { cn } from "@/lib/cn";

const field =
  "rounded-card border border-hairline bg-ink/40 px-3 py-2 text-small text-paper placeholder:text-fg-muted/50 focus-visible:border-azure";

/**
 * An input that keeps its own value while you type and writes to storage only
 * on blur or Enter, so editing one dish does not re-render all 150 rows on
 * every keystroke.
 */
function CommitInput({
  value,
  onCommit,
  className,
  ...rest
}: {
  value: string;
  onCommit: (v: string) => void;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "onBlur" | "className">) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <input
      {...rest}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) onCommit(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setDraft(value);
      }}
      className={cn(field, className)}
    />
  );
}

/** One editable dish: name, price or prices, vegetarian, availability. */
function ItemRow({ group, item }: { group: EffectiveGroup; item: EffectiveItem }) {
  const addedId = item.isNew ? item.key.split("#")[1] : null;
  const printedKey = item.isNew ? null : item.key;

  const patch = (p: Record<string, unknown>) => {
    if (addedId) adminClient.updateAddedItem(group.key, addedId, p);
    else if (printedKey) adminClient.setItemOverride(printedKey, p);
  };

  const setPriceAt = (i: number, raw: string) => {
    const base = item.prices ?? (group.columns ?? []).map(() => null);
    const next = [...base];
    next[i] = raw.trim() === "" ? null : Math.max(0, Number(raw));
    patch({ prices: next });
  };

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-hairline/60 py-3",
        item.unavailable && "opacity-70",
      )}
    >
      <div className="flex min-w-[220px] flex-1 items-center gap-2">
        <CommitInput
          value={item.name}
          onCommit={(v) => {
            if (v.trim()) patch({ name: v.trim() });
          }}
          aria-label={`Name of ${item.name}`}
          className={cn("w-full", item.unavailable && "line-through")}
        />
        {item.veg && <LeafGlyph />}
      </div>

      {group.columns ? (
        <div className="flex flex-wrap gap-2">
          {group.columns.map((c, i) => (
            <label key={c} className="flex flex-col gap-1">
              <span className="text-[0.625rem] uppercase tracking-[0.1em] text-fg-muted">{c}</span>
              <CommitInput
                type="number"
                min={0}
                step={5}
                inputMode="numeric"
                value={item.prices?.[i] != null ? String(item.prices[i]) : ""}
                placeholder="none"
                aria-label={`${c} price for ${item.name}`}
                onCommit={(v) => setPriceAt(i, v)}
                className="w-[74px] tabular-nums"
              />
            </label>
          ))}
        </div>
      ) : (
        <label className="flex items-center gap-2">
          <span className="text-small text-fg-muted">Rs</span>
          <CommitInput
            type="number"
            min={0}
            step={10}
            inputMode="numeric"
            value={item.price ? String(item.price) : ""}
            placeholder="none"
            aria-label={`Price of ${item.name}`}
            onCommit={(v) => patch({ price: v.trim() === "" ? 0 : Math.max(0, Number(v)) })}
            className="w-24 tabular-nums"
          />
        </label>
      )}

      <label className="flex items-center gap-2 text-small text-fg-muted">
        <input
          type="checkbox"
          checked={item.veg ?? false}
          onChange={(e) => patch({ veg: e.target.checked })}
          className="h-4 w-4 accent-[var(--azure)]"
        />
        Veg
      </label>

      <label className="flex items-center gap-2 text-small text-fg-muted">
        <input
          type="checkbox"
          checked={item.unavailable}
          onChange={(e) => patch({ unavailable: e.target.checked })}
          className="h-4 w-4 accent-[var(--azure)]"
        />
        Off menu
      </label>

      <div className="flex items-center gap-3">
        {item.isNew ? (
          <>
            <span className="rounded-full border border-azure/60 px-2 py-0.5 text-[0.6875rem] text-azure">Added</span>
            <button
              type="button"
              onClick={() => addedId && adminClient.deleteAddedItem(group.key, addedId)}
              className="text-small text-alert underline-offset-4 hover:underline"
            >
              Delete<span className="sr-only"> {item.name}</span>
            </button>
          </>
        ) : (
          <>
            {item.isEdited && (
              <button
                type="button"
                onClick={() => printedKey && adminClient.setItemOverride(printedKey, null)}
                className="text-small text-fg-muted underline-offset-4 hover:text-paper hover:underline"
              >
                Revert<span className="sr-only"> {item.name}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => printedKey && adminClient.setItemOverride(printedKey, { removed: true })}
              className="text-small text-alert underline-offset-4 hover:underline"
            >
              Remove<span className="sr-only"> {item.name}</span>
            </button>
          </>
        )}
      </div>
    </li>
  );
}

/** The form that appends a dish the printed card does not have. */
function AddItemForm({ group }: { group: EffectiveGroup }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [prices, setPrices] = useState<string[]>(() => (group.columns ?? []).map(() => ""));
  const [veg, setVeg] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    adminClient.addItem(group.key, {
      name: name.trim(),
      veg,
      ...(group.columns
        ? { prices: prices.map((p) => (p.trim() === "" ? null : Math.max(0, Number(p)))) }
        : { price: price.trim() === "" ? 0 : Math.max(0, Number(price)) }),
    });
    setName("");
    setPrice("");
    setPrices((group.columns ?? []).map(() => ""));
    setVeg(false);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 min-h-11 text-small text-azure underline-offset-4 hover:underline"
      >
        + Add a dish to {group.title}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-3 border-t border-hairline/60 pt-3">
      <label className="flex min-w-[220px] flex-1 flex-col gap-1">
        <span className="eyebrow">Dish name</span>
        <input
          autoFocus
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={cn(field, "w-full")}
          placeholder="e.g. Chicken Sekuwa"
        />
      </label>

      {group.columns ? (
        group.columns.map((c, i) => (
          <label key={c} className="flex flex-col gap-1">
            <span className="text-[0.625rem] uppercase tracking-[0.1em] text-fg-muted">{c}</span>
            <input
              type="number"
              min={0}
              step={5}
              inputMode="numeric"
              value={prices[i]}
              onChange={(e) => setPrices((p) => p.map((v, j) => (j === i ? e.target.value : v)))}
              className={cn(field, "w-[74px] tabular-nums")}
            />
          </label>
        ))
      ) : (
        <label className="flex flex-col gap-1">
          <span className="eyebrow">Price</span>
          <input
            type="number"
            min={0}
            step={10}
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={cn(field, "w-24 tabular-nums")}
          />
        </label>
      )}

      <label className="flex items-center gap-2 pb-2 text-small text-fg-muted">
        <input
          type="checkbox"
          checked={veg}
          onChange={(e) => setVeg(e.target.checked)}
          className="h-4 w-4 accent-[var(--azure)]"
        />
        Veg
      </label>

      <Button size="sm" type="submit">
        Add dish
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </form>
  );
}

/** Dishes taken off the printed menu, so they can be put back. */
function RemovedList({ pageId, names }: { pageId: string; names: string[] }) {
  if (names.length === 0) return null;
  return (
    <div className="mt-4 border-t border-hairline/60 pt-3">
      <p className="eyebrow mb-2">Removed from this page</p>
      <ul className="flex flex-wrap gap-2">
        {names.map((n) => (
          <li key={n}>
            <button
              type="button"
              onClick={() => adminClient.setItemOverride(itemKey(pageId, n), { removed: undefined })}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-hairline px-3 text-small text-fg-muted hover:border-azure hover:text-paper"
            >
              {n}
              <span aria-hidden>↺</span>
              <span className="sr-only">Put back on the menu</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MenuPanel() {
  const state = useAdminState();
  const pages = useEffectiveMenu().filter((p) => p.kind === "menu");
  const [pageId, setPageId] = useState<string>("all");

  const [confirmReset, setConfirmReset] = useState(false);
  const shown = pageId === "all" ? pages : pages.filter((p) => p.id === pageId);

  const stats = useMemo(() => {
    const items = pages.flatMap((p) => p.groups ?? []).flatMap((g) => g.items);
    return {
      total: items.length,
      priced: items.filter((i) => i.prices || (i.price ?? 0) > 0).length,
      edited: items.filter((i) => i.isEdited).length,
      added: items.filter((i) => i.isNew).length,
      removed: Object.values(state.items).filter((o) => o.removed).length,
    };
  }, [pages, state.items]);

  /** Printed dishes currently taken off a page, by original name. */
  const removedOn = (id: string) =>
    Object.entries(state.items)
      .filter(([k, o]) => o.removed && k.startsWith(`${id}/`))
      .map(([k]) => k.slice(id.length + 1).replace(/-/g, " "));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Menu</p>
          <p className="mt-2 text-small text-fg-muted">
            {stats.priced} of {stats.total} dishes priced · {stats.edited} edited · {stats.added} added ·{" "}
            {stats.removed} removed
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="sr-only">Show page</span>
            <select value={pageId} onChange={(e) => setPageId(e.target.value)} className={cn(field, "min-h-11")}>
              <option value="all">All pages</option>
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          {stats.edited + stats.added + stats.removed > 0 &&
            (confirmReset ? (
              <div className="flex items-center gap-3">
                <span className="text-small text-paper">Discard every menu edit?</span>
                <Button
                  size="sm"
                  onClick={() => {
                    adminClient.resetMenu();
                    setConfirmReset(false);
                  }}
                >
                  Discard
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
                  Keep
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setConfirmReset(true)}>
                Reset to printed menu
              </Button>
            ))}
        </div>
      </div>

      <p className="mt-4 max-w-[68ch] text-small text-fg-muted">
        Edits reach the public menu straight away. Names and prices save when you leave the field or press Enter.
        Nothing here rewrites <code className="text-azure">src/data/menu.ts</code>, so &ldquo;Reset to printed
        menu&rdquo; always returns to the card.
      </p>

      <div className="mt-8 space-y-10">
        {shown.map((page) => (
          <section key={page.id} aria-labelledby={`admin-${page.id}`}>
            <h3 id={`admin-${page.id}`} className="text-h3 text-paper">
              {page.label}
            </h3>
            {page.groups?.map((group) => (
              <div key={group.key} className="mt-5">
                <p className="eyebrow mb-1">
                  {group.title}
                  {group.columns && (
                    <span className="ml-2 normal-case tracking-normal text-fg-muted">
                      priced by {group.columns.length} variants
                    </span>
                  )}
                </p>
                <ul>
                  {group.items.map((item) => (
                    <ItemRow key={item.key} group={group} item={item} />
                  ))}
                </ul>
                <AddItemForm group={group} />
              </div>
            ))}
            <RemovedList pageId={page.id} names={removedOn(page.id)} />
          </section>
        ))}
      </div>
    </div>
  );
}
