/** Transcribed from the printed menus. Prices in NPR; "—" where the card shows none. */
export interface Item { n: string; d?: string; p: string }
export interface Category { id: string; cat: string; items: Item[] }

export const THAKALI: Category[] = [
  { id: "sets", cat: "Thakali Khana Set", items: [
    { n: "Local Chicken Thakali Set", d: "Rice, dal, curry, seasonal vegetables, achar, dahi", p: "650/-" },
    { n: "Mutton Thakali Set", p: "650/-" },
    { n: "Chicken Thakali Set", p: "550/-" },
    { n: "Pork Thakali Set", p: "600/-" },
    { n: "Veg Thakali Set", p: "450/-" } ] },
  { id: "dhido", cat: "Dhido Set", items: [
    { n: "Local Chicken Dhido Set", d: "Dhido in place of rice", p: "700/-" },
    { n: "Mutton Dhido Set", p: "700/-" },
    { n: "Chicken Dhido Set", p: "600/-" },
    { n: "Pork Dhido Set", p: "700/-" },
    { n: "Veg Dhido Set", p: "550/-" } ] },
  { id: "momo", cat: "Momo & Noodles", items: [
    { n: "Chicken Momo", d: "Steam 250 · Jhol 300 · Sadheko 320 · C 350 · Kothe 250", p: "from 250/-" },
    { n: "Paneer Momo", d: "Steam 295 · Jhol 325 · Sadheko 355 · C 385 · Kothe 295", p: "from 295/-" },
    { n: "Hakka Noodles (Mutton)", p: "350/-" },
    { n: "Hakka Noodles (Chicken)", p: "230/-" },
    { n: "Hakka Noodles (Veg)", p: "180/-" },
    { n: "Keema Noodles (Chicken)", p: "495/-" } ] },
  { id: "khaja", cat: "Khaja Sets", items: [
    { n: "Mutton Khaja Set", p: "700/-" },
    { n: "Chicken Khaja Set", p: "600/-" },
    { n: "Mushroom Khaja Set", p: "500/-" } ] },
  { id: "starters", cat: "Starters", items: [
    { n: "Sweet Corn — Sadheko / Boiled / Fried", p: "250/-" },
    { n: "Wai Wai Sadheko", p: "150/-" },
    { n: "Peanut Sadheko", p: "240/-" },
    { n: "Green Marinated Salad", p: "200/-" },
    { n: "Fruit Salad", p: "300/-" },
    { n: "Scissor Salad", p: "280/-" } ] },
  { id: "soups", cat: "Soups", items: [
    { n: "Hot & Sour Soup (Chicken)", p: "400/-" },
    { n: "Hot & Sour Soup (Seafood)", p: "500/-" },
    { n: "Cream of Mushroom", p: "400/-" } ] },
  { id: "veg", cat: "Veg Snacks", items: [
    { n: "Paneer Pakoda", p: "350/-" },
    { n: "Paneer Curry", p: "555/-" },
    { n: "Masala Papad", p: "200/-" },
    { n: "French Fries", p: "200/-" },
    { n: "Mustang Aalu", p: "400/-" },
    { n: "G. Marinated Soyabean", p: "260/-" },
    { n: "Stir Fried Mix Vegetables", p: "300/-" },
    { n: "Mushroom Chilly / Chhoila", p: "400/-" },
    { n: "Cheese Stick", p: "500/-" } ] },
  { id: "nonveg", cat: "Non-Veg Snacks", items: [
    { n: "Mutton Bhutan", p: "350/-" },
    { n: "Fried Mutton Head", p: "475/-" },
    { n: "Mutton Pakku", p: "700/-" },
    { n: "Mutton Curry", d: "Please ask your server", p: "—" },
    { n: "Mutton Haykulla", p: "400/-" },
    { n: "Rajkhani", p: "300/-" },
    { n: "Mutton Chhoila", p: "400/-" },
    { n: "Duck Chhoila", p: "400/-" },
    { n: "Marinated Wings / Dameko", p: "400/-" },
    { n: "Timur Chicken", p: "500/-" },
    { n: "Chicken Curry", p: "435/-" },
    { n: "Chicken Chilli", p: "435/-" },
    { n: "Hot Spicy Wings (6 pcs)", p: "495/-" },
    { n: "Chicken Chhoila", p: "395/-" },
    { n: "Grilled Chicken", p: "650/-" },
    { n: "Chicken Sadheko", p: "395/-" },
    { n: "Pork Chop", p: "845/-" },
    { n: "Szechuan Chilli Chicken", p: "645/-" } ] },
  { id: "seafood", cat: "Seafood", items: [
    { n: "Fish Finger", p: "500/-" },
    { n: "Grilled Trout Fish", p: "800/-" },
    { n: "Grilled Prawn Chilly", p: "699/-" },
    { n: "Grilled Basha Fillet", p: "600/-" },
    { n: "Rahu Dameko", d: "Please ask your server", p: "—" },
    { n: "Steamed Trout Fish", p: "800/-" },
    { n: "Sausage Fried / Boiled", p: "300/-" } ] },
  { id: "rice", cat: "Biryani & Fried Rice", items: [
    { n: "Mutton Biryani", p: "800/-" },
    { n: "Chicken Biryani", p: "600/-" },
    { n: "Chicken Fried Rice", p: "300/-" },
    { n: "Veg Fried Rice", p: "200/-" } ] },
  { id: "pizza", cat: "Pizza & Burger", items: [
    { n: "Margherita", d: "1 pc", p: "600/-" },
    { n: "Meat Lover", d: "1 pc", p: "700/-" },
    { n: "Chicken Pizza", d: "1 pc", p: "800/-" },
    { n: "Crispy Chicken Burger", d: "1 pc", p: "400/-" },
    { n: "Crispy Veg Burger", d: "1 pc", p: "280/-" } ] },
];

export const THAI: Category[] = [
  { id: "salads", cat: "Salads & Prawn Starters", items: [
    { n: "Papaya Salad", p: "455/-" }, { n: "Squid Salad", p: "845/-" },
    { n: "Prawn Salad", p: "1325/-" }, { n: "Sauted Prawn", p: "1325/-" },
    { n: "Prawn Tempura", p: "1225/-" }, { n: "Beansprout Prawn", p: "815/-" } ] },
  { id: "soups", cat: "Soups", items: [
    { n: "Nam Sai Soup (Chicken)", p: "715/-" }, { n: "Nam Sai Soup (Veg)", p: "595/-" },
    { n: "Khaite Soup (Prawn)", p: "695/-" }, { n: "Khaite Soup (Veg)", p: "495/-" },
    { n: "Tom Yum Soup (Chicken)", p: "650/-" }, { n: "Tom Yum Soup (Seafood)", p: "899/-" },
    { n: "Tom Yum Soup (Prawn)", p: "850/-" }, { n: "Tom Yum Soup (Veg)", p: "500/-" } ] },
  { id: "curries", cat: "Thai Curries", items: [
    { n: "Thai Green Curry (Prawn)", p: "715 / 655/-" },
    { n: "Thai Green Curry (Chicken)", p: "655/-" },
    { n: "Thai Red Curry (Chicken)", p: "695 / 595/-" },
    { n: "Thai Red Curry (Veg)", p: "595/-" } ] },
  { id: "mains", cat: "Mains", items: [
    { n: "Steamed White Sniper", p: "2650/-" }, { n: "Thai Hot Basil Set", p: "758/-" },
    { n: "Lamb Chops", p: "1255/-" }, { n: "Seafood Platter", p: "5555/-" },
    { n: "Mix Vegetables", p: "495/-" }, { n: "Steamed Rice", p: "95/-" } ] },
];

export interface Spirit { n: string; b: string; m30: string; m60: string; h: string; q: string }
export const SPIRITS: Spirit[] = [
  { n: "JD No.7", b: "11775", m30: "335", m60: "710", h: "5888", q: "2120" },
  { n: "JW Black Label", b: "12825", m30: "385", m60: "770", h: "6413", q: "2309" },
  { n: "JW Red Label", b: "15300", m30: "465", m60: "930", h: "7650", q: "2754" },
  { n: "JW Double Black Label", b: "9375", m30: "165", m60: "330", h: "2663", q: "959" },
  { n: "Old Durbar", b: "5325", m30: "595", m60: "1190", h: "9975", q: "3591" },
  { n: "Glenfiddich 12 yrs Old", b: "19950", m30: "325", m60: "650", h: "5438", q: "1958" },
  { n: "Janeson", b: "10875", m30: "635", m60: "1270", h: "7875", q: "3780" },
  { n: "Bombay Saphire", b: "15750", m30: "515", m60: "1030", h: "6450", q: "3096" },
  { n: "Roku", b: "12900", m30: "95", m60: "190", h: "1560", q: "562" },
  { n: "Khukuri Dark Rum", b: "3120", m30: "95", m60: "190", h: "1613", q: "581" },
  { n: "8848", b: "3225", m30: "95", m60: "190", h: "1545", q: "556" },
  { n: "Ruslan", b: "3090", m30: "385", m60: "770", h: "6450", q: "2322" },
  { n: "Haku", b: "12900", m30: "385", m60: "770", h: "6375", q: "2295" },
  { n: "Jose Cuervo", b: "12750", m30: "685", m60: "1370", h: "11475", q: "4131" },
  { n: "Don Julio Blanco", b: "22950", m30: "335", m60: "670", h: "5550", q: "1998" },
  { n: "Jeam Beam", b: "11100", m30: "245", m60: "490", h: "4125", q: "1485" },
  { n: "Sambuca", b: "8250", m30: "425", m60: "850", h: "7125", q: "2565" },
  { n: "Hendrix", b: "14250", m30: "325", m60: "650", h: "5325", q: "1917" },
  { n: "Kahlua", b: "10650", m30: "385", m60: "770", h: "6413", q: "2309" },
  { n: "Chivas", b: "12825", m30: "565", m60: "1130", h: "9375", q: "3375" },
  { n: "Cointreau", b: "18750", m30: "215", m60: "430", h: "3525", q: "1269" },
  { n: "Royal Salute", b: "7050", m30: "315", m60: "630", h: "5213", q: "1877" },
  { n: "Bailey's", b: "10425", m30: "—", m60: "—", h: "—", q: "—" },
];

export interface BarList { cat: string; note: string; items: Item[] }
export const BAR_LISTS: BarList[] = [
  { cat: "Beer", note: "By the bottle.", items: [
    { n: "Tuborg", p: "615/-" }, { n: "Carlsberg", p: "695/-" }, { n: "Gorkha", p: "500/-" },
    { n: "Arna", p: "695/-" }, { n: "Barasinghe", p: "575/-" } ] },
  { cat: "Mixers & Soft Drinks", note: "", items: [
    { n: "Red Bull", p: "135/-" }, { n: "Soda", p: "90/-" }, { n: "Tonic", p: "145/-" },
    { n: "Ginger Ale", p: "145/-" }, { n: "Coke / Fanta / Sprite", p: "125/-" } ] },
  { cat: "Hookah / Shisha", note: "Flavors: Mint, Double Apple, Watermelon, Kiwi.", items: [
    { n: "Regular Hookah", p: "999/-" },
    { n: "Deluxe Hookah — ice base, seasonal fruits", p: "1499/-" },
    { n: "Extra coil change / charcoal refill", p: "60/-" } ] },
  { cat: "Tea Selection", note: "All varieties.", items: [
    { n: "Black Tea", p: "60/-" }, { n: "Milk Tea", p: "90/-" },
    { n: "Organic Green Tea", p: "160/-" }, { n: "Lemon Tea", p: "120/-" },
    { n: "Traditional Masala Milk Tea", p: "180/-" },
    { n: "Hot Lemon with Honey & Ginger", p: "205/-" } ] },
  { cat: "Coffee", note: "All varieties.", items: [
    { n: "Espresso (Single / Double)", p: "120 / 180/-" },
    { n: "Americano (Black Coffee)", p: "180/-" },
    { n: "Cafe Latte / Cappuccino", p: "280/-" },
    { n: "Cafe Mocha", p: "320/-" },
    { n: "Iced Latte / Frappe", p: "380/-" } ] },
];

export const SMOKING: BarList = { cat: "Cigarettes", note: "Per piece and full packet.", items: [
  { n: "Surya Red / Light — per piece", p: "35/-" },
  { n: "Surya Red / Light — full packet", p: "495/-" },
  { n: "Surya Arctic / Ice Burst — per piece", p: "35/-" },
  { n: "Surya Arctic / Ice Burst — full packet", p: "495/-" },
  { n: "Marlboro Red / Light — per piece", p: "55/-" },
  { n: "Marlboro Red / Light — full packet", p: "900/-" },
  { n: "Shikhar Ice Rush — per piece", p: "35/-" },
  { n: "Shikhar Ice Rush — per packet", p: "345/-" } ] };
