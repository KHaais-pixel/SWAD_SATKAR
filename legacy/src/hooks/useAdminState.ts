"use client";
import { useCallback, useEffect, useState } from "react";
import { ADMIN_EVENT, adminClient, emptyAdminState, type AdminState } from "@/lib/adminClient";

/**
 * Reads admin overrides from storage and re-reads whenever they change, in
 * this tab (custom event) or another one (storage event).
 *
 * The server render always uses the empty state, so the page ships the menu
 * from `src/data/menu.ts` for crawlers and then patches it after hydration.
 */
export function useAdminState(): AdminState {
  const [state, setState] = useState<AdminState>(emptyAdminState);

  const refresh = useCallback(() => setState(adminClient.getState()), []);

  useEffect(() => {
    refresh();
    window.addEventListener(ADMIN_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(ADMIN_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return state;
}
