/**
 * The layer between the printed menu in `src/data/menu.ts` and what a guest
 * sees. The data file stays the source of truth; the admin panel only records
 * differences from it, so "reset" always returns to what is committed.
 *
 * Identity: items and groups are keyed by page id plus a slug of the name as
 * printed. That key never changes when the kitchen renames a dish, because the
 * slug comes from the committed name, not the edited one. Renaming a dish in
 * `menu.ts` does orphan its override, which is the correct trade: the printed
 * menu changed, so the edit no longer applies.
 */
import type { MenuGroup, MenuItem, MenuPage } from "@/data/menu";

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const groupKey = (pageId: string, title: string) => `${pageId}/${slug(title)}`;
export const itemKey = (pageId: string, name: string) => `${pageId}/${slug(name)}`;

/** What the kitchen can change about one dish. */
export interface MenuItemOverride {
  name?: string;
  price?: number;
  /** Aligned to the group's columns; null means not offered. */
  prices?: (number | null)[];
  note?: string;
  veg?: boolean;
  /** Struck through for guests, still listed. */
  unavailable?: boolean;
  /** Taken off the menu entirely. Reversible. */
  removed?: boolean;
}

/** A dish that is not on the printed card at all. */
export interface AddedItem {
  /** Unique within its group; generated when the row is created. */
  id: string;
  name: string;
  price?: number;
  prices?: (number | null)[];
  note?: string;
  veg?: boolean;
  unavailable?: boolean;
}

export interface MenuOverrideState {
  /** Keyed by itemKey. */
  items: Record<string, MenuItemOverride>;
  /** Keyed by groupKey. */
  added: Record<string, AddedItem[]>;
}

export const emptyMenuOverrides = (): MenuOverrideState => ({ items: {}, added: {} });

/** A menu item as it should render, plus where it came from. */
export interface EffectiveItem extends MenuItem {
  key: string;
  /** True when this dish is not on the printed card. */
  isNew: boolean;
  /** True when a printed dish has been edited. */
  isEdited: boolean;
  unavailable: boolean;
}

export interface EffectiveGroup extends Omit<MenuGroup, "items"> {
  key: string;
  items: EffectiveItem[];
}

export interface EffectivePage extends Omit<MenuPage, "groups"> {
  groups?: EffectiveGroup[];
}

/** Applies every recorded difference to one page of the printed menu. */
export function applyOverrides(page: MenuPage, state: MenuOverrideState): EffectivePage {
  if (!page.groups) return page as EffectivePage;

  const groups = page.groups.map((group): EffectiveGroup => {
    const gKey = groupKey(page.id, group.title);

    const printed = group.items
      .map((item): EffectiveItem | null => {
        const key = itemKey(page.id, item.name);
        const o = state.items[key];
        if (o?.removed) return null;
        return {
          ...item,
          key,
          name: o?.name ?? item.name,
          price: o?.price ?? item.price,
          prices: o?.prices ?? item.prices,
          note: o?.note ?? item.note,
          veg: o?.veg ?? item.veg,
          unavailable: o?.unavailable ?? false,
          isNew: false,
          isEdited: Boolean(o && Object.keys(o).length > 0),
        };
      })
      .filter((i): i is EffectiveItem => i !== null);

    const added = (state.added[gKey] ?? []).map(
      (a): EffectiveItem => ({
        key: `${gKey}#${a.id}`,
        name: a.name,
        price: a.price,
        prices: a.prices,
        note: a.note,
        veg: a.veg,
        unavailable: a.unavailable ?? false,
        isNew: true,
        isEdited: false,
      }),
    );

    return { ...group, key: gKey, items: [...printed, ...added] };
  });

  return { ...page, groups };
}

/** True while any listed dish still has no price at all. */
export const hasUnpriced = (pages: EffectivePage[]) =>
  pages.some((p) =>
    (p.groups ?? []).some((g) => g.items.some((i) => !i.prices && (i.price ?? 0) === 0)),
  );
