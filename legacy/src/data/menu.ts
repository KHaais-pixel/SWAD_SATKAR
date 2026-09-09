/**
 * The restaurant's actual printed menu, transcribed from the physical cards.
 *
 * Prices are in NPR and are real. Names are kept exactly as printed, including
 * the spellings on the card, so staff can check a page against the original.
 * There are no dish descriptions here because the printed menu has none, and
 * inventing them would put words in the kitchen's mouth.
 *
 * Two things are still open and are marked in place:
 *   - Mutton Curry has no price printed on the card (PRICE_MISSING).
 *   - "C" in the momo table is the column heading as printed.
 */

/** A dish whose price is not printed on the card. Renders as "TBC". */
export const PRICE_MISSING = 0;
/** Kept for older call sites; a menu item with this price is unpriced. */
export const PLACEHOLDER_PRICE = PRICE_MISSING;

export type Heat = 0 | 1 | 2 | 3;

export interface MenuItem {
  name: string;
  /** Optional: the printed menu carries none, but the site can add them later. */
  desc?: string;
  /** Single price in NPR. Omit when the item uses `prices`. */
  price?: number;
  /** Prices aligned to the group's `columns`. null means not offered. */
  prices?: (number | null)[];
  /** Serving note printed beside the item, e.g. "1pc". */
  note?: string;
  veg?: boolean;
  heat?: Heat;
}

export interface MenuGroup {
  title: string;
  /** Column headings when the group is priced as a table. */
  columns?: string[];
  /** Small print under the group heading. */
  note?: string;
  items: MenuItem[];
}

export type MenuPageKind = "cover" | "menu" | "back";

export interface MenuPage {
  id: string;
  kind: MenuPageKind;
  /** Short label for the page indicator and the aria-live announcement. */
  label: string;
  /** Devanagari or Thai stamp shown on the page. */
  mark?: string;
  groups?: MenuGroup[];
}

export const menuPages: MenuPage[] = [
  { id: "cover", kind: "cover", label: "Cover" },

  {
    id: "starters",
    kind: "menu",
    label: "Starters & Soups",
    mark: "सुरुवात",
    groups: [
      {
        title: "Starters",
        items: [
          { name: "Sweet Corn Sadheko / Boiled / Fried", price: 250, veg: true },
          { name: "Wai Wai Sadheko", price: 150, veg: true },
          { name: "Peanut Sadheko", price: 240, veg: true },
          { name: "Green Marinated Salad", price: 200, veg: true },
          { name: "Fruit Salad", price: 300, veg: true },
          { name: "Scissor Salad", price: 280 },
        ],
      },
      {
        title: "Soups",
        items: [
          { name: "Hot & Sour Soup (Chicken)", price: 400 },
          { name: "Hot & Sour Soup (Seafood)", price: 500 },
          { name: "Cream of Mushroom", price: 400, veg: true },
        ],
      },
    ],
  },

  {
    id: "veg-snacks",
    kind: "menu",
    label: "Veg Snacks",
    mark: "शाकाहारी",
    groups: [
      {
        title: "Veg Snacks",
        items: [
          { name: "Paneer Pakoda", price: 350, veg: true },
          { name: "Paneer Curry", price: 555, veg: true },
          { name: "Masala Papad", price: 200, veg: true },
          { name: "French Fries", price: 200, veg: true },
          { name: "Mustang Aalu", price: 400, veg: true },
          { name: "G. Marinated Soyabean", price: 260, veg: true },
          { name: "Stir Fried Mix Vegetables", price: 300, veg: true },
          { name: "Mushroom Chilly / Chhoila", price: 400, veg: true },
          { name: "Cheese Stick", price: 500, veg: true },
        ],
      },
    ],
  },

  {
    id: "non-veg-1",
    kind: "menu",
    label: "Non-Veg Snacks",
    mark: "मासु",
    groups: [
      {
        title: "Non Veg Snacks",
        items: [
          { name: "Mutton Bhutan", price: 350 },
          { name: "Fried Mutton Head", price: 475 },
          { name: "Mutton Pakku", price: 700 },
          { name: "Mutton Curry", price: PRICE_MISSING },
          { name: "Mutton Haykulla", price: 400 },
          { name: "Rajkhani", price: 300 },
          { name: "Mutton Chhoila", price: 400 },
          { name: "Duck Chhoila", price: 400 },
          { name: "Marinated Wings / Dameko", price: 400 },
        ],
      },
    ],
  },

  {
    id: "non-veg-2",
    kind: "menu",
    label: "Non-Veg Snacks",
    mark: "मासु",
    groups: [
      {
        title: "Non Veg Snacks",
        note: "continued",
        items: [
          { name: "Timur Chicken", price: 500 },
          { name: "Chicken Curry", price: 435 },
          { name: "Chicken Chilli", price: 435 },
          { name: "Hot Spicy Wings (6 pcs)", price: 495 },
          { name: "Chicken Chhoila", price: 395 },
          { name: "Grilled Chicken", price: 650 },
          { name: "Chicken Sadheko", price: 395 },
          { name: "Pork Chop", price: 845 },
          { name: "Szechuan Chilli Chicken", price: 645 },
        ],
      },
    ],
  },

  {
    id: "seafood",
    kind: "menu",
    label: "Seafood & Khaja",
    mark: "माछा",
    groups: [
      {
        title: "Seafood",
        items: [
          { name: "Fish Finger", price: 500 },
          { name: "Grilled Trout Fish", price: 800 },
          { name: "Grilled Prawn Chilly", price: 699 },
          { name: "Grilled Basha Fillet", price: 600 },
          { name: "Rahu Dameko", price: 800 },
          { name: "Steamed Trout Fish", price: 800 },
          { name: "Sausage Fried / Boiled", price: 300 },
        ],
      },
      {
        title: "Khaja Sets",
        items: [
          { name: "Mutton Khaja Set", price: 700 },
          { name: "Chicken Khaja Set", price: 600 },
          { name: "Mushroom Khaja Set", price: 500, veg: true },
        ],
      },
    ],
  },

  {
    id: "thakali",
    kind: "menu",
    label: "Thakali & Dhido",
    mark: "थकाली",
    groups: [
      {
        title: "Thakali Khana Set",
        items: [
          { name: "Local Chicken Thakali Set", price: 650 },
          { name: "Mutton Thakali Set", price: 650 },
          { name: "Chicken Thakali Set", price: 550 },
          { name: "Pork Thakali Set", price: 600 },
          { name: "Veg Thakali Set", price: 450, veg: true },
        ],
      },
      {
        title: "Dhido Set",
        items: [
          { name: "Local Chicken Dhido Set", price: 700 },
          { name: "Mutton Dhido Set", price: 700 },
          { name: "Chicken Dhido Set", price: 600 },
          { name: "Pork Dhido Set", price: 700 },
          { name: "Veg Dhido Set", price: 550, veg: true },
        ],
      },
    ],
  },

  {
    id: "rice-momo",
    kind: "menu",
    label: "Biryani & Momo",
    mark: "मोमो",
    groups: [
      {
        title: "Biryani & Fried Rice",
        items: [
          { name: "Mutton Biryani", price: 800 },
          { name: "Chicken Biryani", price: 600 },
          { name: "Chicken Fried Rice", price: 300 },
          { name: "Veg Fried Rice", price: 200, veg: true },
        ],
      },
      {
        title: "Momo",
        columns: ["Steam", "Jhol", "Sadheko", "C", "Kothe"],
        items: [
          { name: "Chicken Momo", prices: [250, 300, 320, 350, 250] },
          { name: "Paneer Momo", prices: [295, 325, 355, 385, 295], veg: true },
        ],
      },
    ],
  },

  {
    id: "noodles-pizza",
    kind: "menu",
    label: "Noodles, Pizza & Burger",
    groups: [
      {
        title: "Noodles",
        items: [
          { name: "Hakka Noodles (Mutton)", price: 350 },
          { name: "Hakka Noodles (Chicken)", price: 230 },
          { name: "Hakka Noodles (Veg)", price: 180, veg: true },
          { name: "Keema Noodles (Chicken)", price: 495 },
        ],
      },
      {
        title: "Pizza & Burger",
        items: [
          { name: "Margherita", price: 600, note: "1 pc", veg: true },
          { name: "Meat Lover", price: 700, note: "1 pc" },
          { name: "Chicken Pizza", price: 800, note: "1 pc" },
          { name: "Crispy Chicken Burger", price: 400, note: "1 pc" },
          { name: "Crispy Veg Burger", price: 280, note: "1 pc", veg: true },
        ],
      },
    ],
  },

  {
    id: "thai-1",
    kind: "menu",
    label: "Thai",
    mark: "ไทย",
    groups: [
      {
        title: "Thai Food",
        items: [
          { name: "Papaya Salad", price: 455 },
          { name: "Squid Salad", price: 845 },
          { name: "Prawn Salad", price: 1325 },
          { name: "Sauted Prawn", price: 1325 },
          { name: "Prawn Tempura", price: 1225 },
          { name: "Nam Sai Soup (Chicken)", price: 715 },
          { name: "Nam Sai Soup (Veg)", price: 595, veg: true },
          { name: "Khaite Soup (Prawn)", price: 695 },
          { name: "Khaite Soup (Veg)", price: 495, veg: true },
          { name: "Beansprout Prawn", price: 815 },
          { name: "Mix Vegetables", price: 495, veg: true },
          { name: "Steamed Rice", price: 95, veg: true },
        ],
      },
    ],
  },

  {
    id: "thai-2",
    kind: "menu",
    label: "Thai",
    mark: "ไทย",
    groups: [
      {
        title: "Thai Food",
        note: "continued",
        items: [
          { name: "Thai Green Curry (Prawn)", price: 715, desc: "715 / 655" },
          { name: "Thai Green Curry (Chicken)", price: 655 },
          { name: "Thai Red Curry (Chicken)", price: 695, desc: "695 / 595" },
          { name: "Thai Red Curry (Veg)", price: 595, veg: true },
          { name: "Steamed White Sniper", price: 2650 },
          { name: "Thai Hot Basil Set", price: 758 },
          { name: "Lamb Chops", price: 1255 },
          { name: "Seafood Platter", price: 5555 },
          { name: "Tom Yum Soup (Chicken)", price: 650 },
          { name: "Tom Yum Soup (Seafood)", price: 899 },
          { name: "Tom Yum Soup (Prawn)", price: 850 },
          { name: "Tom Yum Soup (Veg)", price: 500, veg: true },
        ],
      },
    ],
  },

  {
    id: "bar-beer",
    kind: "menu",
    label: "Beer & Mixers",
    mark: "बार",
    groups: [
      {
        title: "Beer",
        items: [
          { name: "Tuborg", price: 615 },
          { name: "Carlsberg", price: 695 },
          { name: "Gorkha", price: 500 },
          { name: "Arna", price: 695 },
          { name: "Barasinghe", price: 575 },
        ],
      },
      {
        title: "Mixers & Soft Drinks",
        items: [
          { name: "Red Bull", price: 135 },
          { name: "Soda", price: 90 },
          { name: "Tonic", price: 145 },
          { name: "Ginger Ale", price: 145 },
          { name: "Coke / Fanta / Sprite", price: 125 },
        ],
      },
    ],
  },

  {
    id: "bar-spirits-1",
    kind: "menu",
    label: "Spirits",
    mark: "बार",
    groups: [
      {
        title: "Spirits",
        columns: ["Bottle", "30 ml", "60 ml", "Half", "Quarter"],
        items: [
          { name: "JD No.7", prices: [11775, 335, 710, 5888, 2120] },
          { name: "JW Black Label", prices: [12825, 385, 770, 6413, 2309] },
          { name: "JW Red Label", prices: [15300, 465, 930, 7650, 2754] },
          { name: "JW Double Black Label", prices: [9375, 165, 330, 2663, 959] },
          { name: "Old Durbar", prices: [5325, 595, 1190, 9975, 3591] },
          { name: "Glenfiddich 12 yrs Old", prices: [19950, 325, 650, 5438, 1958] },
          { name: "Janeson", prices: [10875, 635, 1270, 7875, 3780] },
          { name: "Bombay Saphire", prices: [15750, 515, 1030, 6450, 3096] },
        ],
      },
    ],
  },

  {
    id: "bar-spirits-2",
    kind: "menu",
    label: "Spirits",
    mark: "बार",
    groups: [
      {
        title: "Spirits",
        note: "continued",
        columns: ["Bottle", "30 ml", "60 ml", "Half", "Quarter"],
        items: [
          { name: "Roku", prices: [12900, 95, 190, 1560, 562] },
          { name: "Khukuri Dark Rum", prices: [3120, 95, 190, 1613, 581] },
          { name: "8848", prices: [3225, 95, 190, 1545, 556] },
          { name: "Ruslan", prices: [3090, 385, 770, 6450, 2322] },
          { name: "Haku", prices: [12900, 385, 770, 6375, 2295] },
          { name: "Jose Cuervo", prices: [12750, 685, 1370, 11475, 4131] },
          { name: "Don Julio Blanco", prices: [22950, 335, 670, 5550, 1998] },
          { name: "Jeam Beam", prices: [11100, 245, 490, 4125, 1485] },
        ],
      },
    ],
  },

  {
    id: "bar-spirits-3",
    kind: "menu",
    label: "Spirits",
    mark: "बार",
    groups: [
      {
        title: "Spirits",
        note: "continued",
        columns: ["Bottle", "30 ml", "60 ml", "Half", "Quarter"],
        items: [
          { name: "Sambuca", prices: [8250, 425, 850, 7125, 2565] },
          { name: "Hendrix", prices: [14250, 325, 650, 5325, 1917] },
          { name: "Kahlua", prices: [10650, 385, 770, 6413, 2309] },
          { name: "Chivas", prices: [12825, 565, 1130, 9375, 3375] },
          { name: "Cointreau", prices: [18750, 215, 430, 3525, 1269] },
          { name: "Royal Salute", prices: [7050, 315, 630, 5213, 1877] },
          { name: "Bailey's", prices: [10425, null, null, null, null] },
        ],
      },
    ],
  },

  {
    id: "tea-coffee",
    kind: "menu",
    label: "Tea & Coffee",
    mark: "चिया",
    groups: [
      {
        title: "Teas",
        note: "all varieties",
        items: [
          { name: "Black Tea", price: 60, veg: true },
          { name: "Milk Tea", price: 90, veg: true },
          { name: "Organic Green Tea", price: 160, veg: true },
          { name: "Lemon Tea", price: 120, veg: true },
          { name: "Traditional Masala Milk Tea", price: 180, veg: true },
          { name: "Hot Lemon with Honey & Ginger", price: 205, veg: true },
        ],
      },
      {
        title: "Coffee",
        note: "all varieties",
        items: [
          { name: "Espresso", price: 120, note: "single 120, double 180", veg: true },
          { name: "Americano", price: 180, veg: true },
          { name: "Cafe Latte / Cappuccino", price: 280, veg: true },
          { name: "Cafe Mocha", price: 320, veg: true },
          { name: "Iced Latte / Frappe", price: 380, veg: true },
        ],
      },
    ],
  },

  {
    id: "hookah",
    kind: "menu",
    label: "Hookah & Cigarettes",
    groups: [
      {
        title: "Hookah / Shisha",
        note: "mint, double apple, watermelon, kiwi",
        items: [
          { name: "Regular Hookah", price: 999 },
          { name: "Deluxe Hookah", price: 1499, note: "ice base, seasonal fruits" },
          { name: "Extra Coil Change / Charcoal Refill", price: 60 },
        ],
      },
      {
        title: "Cigarettes",
        columns: ["Per piece", "Packet"],
        items: [
          { name: "Surya Red / Light", prices: [35, 495] },
          { name: "Surya Arctic / Ice Burst", prices: [35, 495] },
          { name: "Marlboro Red / Light", prices: [55, 900] },
          { name: "Shikhar Ice Rush", prices: [35, 345] },
        ],
      },
    ],
  },

  { id: "back", kind: "back", label: "Thank you" },
];

export const allMenuItems = (): { section: string; group: string; item: MenuItem }[] =>
  menuPages.flatMap((page) =>
    (page.groups ?? []).flatMap((group) =>
      group.items.map((item) => ({ section: page.label, group: group.title, item })),
    ),
  );

/** True only while some dish still has no printed price. */
export const pricesArePlaceholder = allMenuItems().some(
  ({ item }) => item.price === PRICE_MISSING && !item.prices,
);

export const formatPrice = (price?: number) =>
  price === undefined || price === PRICE_MISSING ? "TBC" : `Rs ${price.toLocaleString("en-NP")}`;

/** Compact form for table cells, where "Rs" on every cell would be noise. */
export const formatCell = (price?: number | null) =>
  price === undefined || price === null || price === PRICE_MISSING ? "TBC" : price.toLocaleString("en-NP");
