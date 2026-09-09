/** Written by scripts/build-menu-book.mjs. Hand edits are overwritten. */
export const SPREADS = [
  {
    "left": "Cover",
    "right": "Starters, soups and veg snacks"
  },
  {
    "left": "Thakali sets, dhido and rice",
    "right": "Momo, noodles, pizza and burgers"
  },
  {
    "left": "Non-veg snacks",
    "right": "Seafood and khaja sets"
  },
  {
    "left": "Thai food",
    "right": "The bar menu"
  }
];
export const PAGE_W = 1800;
export const PAGE_H = 2488;
/** A page of the printed menu: spread `i`, left or right. */
export const bookPage = (i: number, side: "l" | "r") => `/menu-book/s${i}-${side}.webp`;
/** A page is this many times as tall as it is wide. */
export const PAGE_RATIO = 1.3822;
/** Viewports of scroll per page turn. */
export const TURN_SCROLL = 1.1;
