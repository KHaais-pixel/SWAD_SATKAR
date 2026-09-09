/**
 * The loading screen listens for the hero's readiness. Progress is 0 to 1;
 * the screen leaves at 1, or after a short ceiling so nobody waits on a slow
 * connection, and never comes back within the same visit.
 */
export const LOADING_EVENT = "swadsatkar:hero-ready";
export const LOADING_SEEN_KEY = "swadsatkar:loaded";

export function announceHeroReady(progress: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LOADING_EVENT, { detail: Math.max(0, Math.min(1, progress)) }));
}
