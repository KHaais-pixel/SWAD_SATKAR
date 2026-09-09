import localFont from "next/font/local";

/**
 * Self-hosted latin subsets. The display face is a serif on purpose: the
 * printed menu and the plaque logo are set in classical serif forms, and the
 * headlines borrow from them. Body is a neutral sans with a little warmth.
 */
export const display = localFont({
  src: "../fonts/PlayfairDisplay-latin.woff2",
  variable: "--font-display-face",
  display: "swap",
  weight: "400 900",
  preload: true,
});

export const body = localFont({
  src: "../fonts/Manrope-latin.woff2",
  variable: "--font-body-face",
  display: "swap",
  weight: "300 800",
  preload: true,
});

export const devanagari = localFont({
  src: "../fonts/NotoSerifDevanagari.woff2",
  variable: "--font-devanagari",
  display: "swap",
  weight: "400 700",
  preload: false,
});
