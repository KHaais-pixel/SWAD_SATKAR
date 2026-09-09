"use client";
import { useMemo } from "react";
import { menuPages, type MenuPage } from "@/data/menu";
import { applyOverrides, hasUnpriced, type EffectivePage } from "@/lib/menuOverrides";
import { useAdminState } from "./useAdminState";

/**
 * The menu as guests should see it: the printed card from `src/data/menu.ts`
 * with the admin panel's edits applied on top.
 *
 * The server render always uses the empty override state, so the HTML that
 * ships carries the printed menu for crawlers and is patched after hydration.
 */
export function useEffectivePage(page: MenuPage | null): EffectivePage | null {
  const state = useAdminState();
  return useMemo(() => (page ? applyOverrides(page, state) : null), [page, state]);
}

/** Every page with edits applied, for the plain menu and the admin panel. */
export function useEffectiveMenu(): EffectivePage[] {
  const state = useAdminState();
  return useMemo(() => menuPages.map((p) => applyOverrides(p, state)), [state]);
}

/** True while any listed dish still has no price at all. */
export function useAnyUnpriced(): boolean {
  const pages = useEffectiveMenu();
  return useMemo(() => hasUnpriced(pages), [pages]);
}
