export interface Cocktail {
  id: string;
  name: string;
  base: string;
  desc: string;
  /** Glass silhouette used by the illustrated card */
  glass: "coupe" | "rocks" | "highball";
  price: string;
}

export const cocktails: Cocktail[] = [
  {
    id: "timur-sour",
    name: "Timur Sour",
    base: "Gin",
    desc: "Timur syrup, lime, egg white. Numbing, then bright.",
    glass: "coupe",
    price: "TBC",
  },
  {
    id: "lemongrass-negroni",
    name: "Lemongrass Negroni",
    base: "Gin and Campari",
    desc: "Lemongrass vermouth, orange oil. Bitter, perfumed, cold.",
    glass: "rocks",
    price: "TBC",
  },
  {
    id: "raksi-old-fashioned",
    name: "Raksi Old Fashioned",
    base: "Millet raksi",
    desc: "Jaggery, smoked bitters. Mountain spirit, city glass.",
    glass: "rocks",
    price: "TBC",
  },
];
