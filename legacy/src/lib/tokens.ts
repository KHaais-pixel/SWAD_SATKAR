/**
 * The few token values that must exist as JavaScript strings because they are
 * consumed outside CSS (browser chrome metadata, generated images).
 * These mirror the custom properties in `src/app/globals.css` — change both.
 */
export const tokens = {
  ink: "#04141f",
  inkDeep: "#020d15",
  char: "#0a2536",
  paper: "#eef5fa",
  azure: "#0f9fe0",
  deep: "#0a6ea6",
  glow: "#5cc8f5",
  chili: "#e2553c",
  basil: "#55a06d",
} as const;
