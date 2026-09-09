/**
 * The dishes in the horizontal carousel, in row order. Each is a cut-out of
 * one of the supplied photographs, built by `node scripts/build-dishes.mjs`
 * into `public/dishes`. The photographs themselves are untouched; only the
 * rendered checkerboard behind them has been removed.
 */
export interface Dish {
  slug: string;
  name: string;
  /** One short line under the name while the dish is centred. */
  line: string;
  src: string;
  width: number;
  height: number;
}

export const dishes: Dish[] = [
  { slug: "momo", name: "Steamed Momo", line: "Hand-pleated, served with tomato achar.", src: "/dishes/momo.webp", width: 1400, height: 1361 },
  { slug: "noodles", name: "Stir-fried Noodles", line: "Wok-tossed with peppers and spring onion.", src: "/dishes/noodles.webp", width: 1400, height: 1114 },
  { slug: "lamb", name: "Grilled Lamb Chops", line: "Charred over the flame, finished with herbs.", src: "/dishes/lamb.webp", width: 1400, height: 1025 },
  { slug: "soup", name: "Noodle Soup", line: "Clear broth, greens and meatballs.", src: "/dishes/soup.webp", width: 1400, height: 1422 },
  { slug: "pizza", name: "Pizza", line: "Mozzarella, green chilli and a blistered crust.", src: "/dishes/pizza.webp", width: 1400, height: 1423 },
];

/** Scroll length of the pinned carousel, as a multiple of the viewport. */
export const DISH_SCROLL = 4;
