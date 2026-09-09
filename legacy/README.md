# Swad Satkar — स्वाद सत्कार

Marketing site for a Thai, Thakali & Bar restaurant on Bhanimandal Marg, Lalitpur.
Next.js 15 (App Router), TypeScript, Tailwind CSS v4, GSAP + ScrollTrigger,
Framer Motion, Lenis. No CMS, no database, no auth.

See `DESIGN.md` for the design direction.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

## Before launch — replace these

Everything provisional is a named constant, so each swap is a one-line edit.
Phone, email, owner and the cuisine line now come from the restaurant's card.

| What | Where | Note |
|---|---|---|
| Phone / WhatsApp | `PHONE_PRIMARY`, `PHONE_SECONDARY` in `src/data/restaurant.ts` | Taken from the restaurant's card |
| Street address | `restaurant.address` | **Needs a decision.** The brief said Bhanimandal Marg; the card says Jawalakhel. Both are in Lalitpur. |
| Opening hours | `restaurant.hours` + `PLACEHOLDER_HOURS_ARE_EXAMPLE` | Given as an example, not confirmed |
| Google review count | `GOOGLE_REVIEW_COUNT` in `src/data/restaurant.ts` | `null` on purpose. While it is null the site never states a count and `AggregateRating` is omitted from the JSON-LD. The 4.7 rating itself is real and is shown. |
| Menu prices | `src/data/menu.ts` | **Done.** Transcribed from the printed cards, in NPR. One gap: Mutton Curry has no price on the card, marked `PRICE_MISSING`. |
| Reviews | `src/components/sections/Reviews.tsx` | Shows the honest 4.7 and a link to Google, nothing else. Add quotes here only once you have permission to reproduce real reviews. |
| Menu photography | the book pages | The printed menu has a photo beside most sections; the site shows none yet. |
| Dish photos | `src/data/dishes.ts` | Each dish has `image: null`, which renders the illustrated SVG. Set a path to a top-down transparent PNG to use a photo instead. |
| Table count / max party | `PLACEHOLDER_TABLE_COUNT`, `PLACEHOLDER_MAX_PARTY` | Party selector currently offers 1–8 plus "9+" |
| Domain | `restaurant.siteUrl` | Used for metadata and JSON-LD |

## Pages

The site is six pages, one per item in the header:

| Route | Holds |
|---|---|
| `/` | The film behind the name, the thali serve, the five plates, the Google rating |
| `/menu` | The menu book, scrubbed with scroll, then the same menu as a plain list (which is what prints) |
| `/story` | The two kitchens |
| `/bar` | The cocktail list and happy hour |
| `/visit` | Hours, the open-now line, address, phone, WhatsApp and the map |
| `/reserve` | The booking form on its own page |

Each section component takes `as="h1"` on its own page so every page has one
`h1`. The header marks the current page; on phones the four pages sit in a
panel behind a toggle next to the booking button, so the bar stays one row
and never covers a pinned section. The loading screen belongs to a direct
load of `/` only (decided in the document head before paint); arriving at the
home page from another page, or any other page directly, never shows it. The
food ribbon appears on the story, menu and bar pages, one segment each; the
home and visit pages have none. `src/app/sitemap.ts` lists the public routes.

## The booking flow

Front-end only. Every call that a real backend would answer lives behind one
interface in **`src/lib/bookingClient.ts`** — that file holds every
`TODO(backend)` in the codebase. Today it is a `localStorage` mock:

- Availability comes from a seeded generator in `src/data/availability.ts`, so
  the same date always shows the same slots and weekend evenings look tighter.
- Bookings, the in-progress draft (24h), and cancellations are stored in the
  browser.
- The UI says "Demo booking — not connected to the restaurant's system yet."

To go live, implement `BookingClient` against the real API and export it as
`bookingClient`. Nothing else changes.

Deep links: `/?book=1`, `/?book=1&party=4&date=2026-09-12&time=19:30`, and `/reserve`.

## The landing page

The hero is pinned for three viewports and the footage behind the name is
scrubbed by scroll: a doorway, the Himalaya above cloud, a thali, spices in
the air, a Thai curry, Bangkok at night, the bar, the dining room. The type
holds still; only the scene moves, and it runs backwards when you scroll up.
When the hand is still for about a second the film itself plays, muted and
hardware-decoded at its native 24 frames a second (`public/hero/film-*`, WebM
and MP4 in two sizes, loaded only once the scrub frames are in so it never
competes with the first paint), from the very moment the scrub was showing; the canvas fades
under it. When you scroll again the film pauses, its moment becomes the
scrub's offset, and the canvas fades back on top, so the picture never jumps
in either direction and the scrub carries on from wherever the film got to.
Contrast and saturation are baked into both the frames and the film at build
time, so nothing is filtered at run time. If the film cannot play (no codec,
autoplay refused), the canvas carries the idle motion instead.

Frames live in `public/hero` in two sizes (100 frames each, ten per second of
footage, 1600 and 960 wide) so phones never fetch desktop frames. On the
canvas, a scroll position that lands between two frames draws both, the
second at its fractional weight, so the scrub reads as a dissolve rather than
a step. The footage's hard cuts are listed in `src/data/hero.ts` (found by
comparing neighbouring frames); the canvas never blends across a cut and dips
briefly to navy over it, so an edit reads as an edit. Frames are decoded off
the main thread before use, the canvas backing store is capped at the
footage's own resolution, and the scroll-to-frame link carries a short
smoothing (about half a second) on top of the page's smooth scroll: connected
to the hand, never stepped. A radial navy vignette and a restrained contrast
lift sit over the picture; there is no blur. The first frame is a real image with
`priority`, so the page paints before any script runs. Rebuild from a new cut
with:

```bash
npm run hero-frames -- /path/to/footage.mp4
```

The source carries a generator mark in one corner; the build lays a soft
shadow over it. Under `prefers-reduced-motion` there is no pin: the first
frame and the words.

## The lounge hero (kept, not mounted)

`src/components/sections/LoungeHero.tsx` is an alternative hero, built and
verified but not on the page: a lounge, a scroll through a dark room, past the
red hookah, into its metal, and out into the bar. It is drawn live in WebGL
from two renders in `assets/lounge` and their depth maps; there is no video
and no frame sequence. `src/components/lounge` holds the renderer (one
full-screen pass), the shaders and the timeline; `src/hooks/useLoungeScroll.ts`
pins the section for six viewports and turns scroll into the camera.

How the illusion is built: each picture is a plane in front of a virtual
camera with a per-pixel depth map. As the camera moves, texels are displaced
by their depth, so near things slide against far things (parallax and dolly).
Normals recovered from the depth catch a light that travels with the scroll,
so highlights move over the polished metal and the red glass and, later, the
bottles and glasses. The hookah is cut from its backdrop at build time (the
backdrop is grown from the corners while neighbouring pixels stay alike and
neutral, so the red hose and glass are never swallowed). The join between
the two scenes is a reflection: the camera goes into the metal collar, and
the bar appears first in the shiny parts, warped by the metal's own surface,
then settles flat as the camera pulls back through the shelves.

The timeline (progress 0 to 1) is a set of eased keyframe curves in
`timeline.ts`: dark and dust, the silhouette, the lit hookah, closer, around
it, into the metal, the shelves, bottles and glasses, the pull-back, the bar.
Every value is a pure function of progress, so scrolling up reverses it
exactly. ScrollTrigger's scrub plus a short time-based ease keep a flick of
the wheel from stepping. Copy fades in where the scene has room: the name at
the start, "Where the night begins." beside the hookah, "An atmosphere
crafted for lingering." with the buttons over the finished bar.

Textures come in two sizes so phones never fetch desktop ones; the canvas
backing store is capped at 1.5 device pixels per CSS pixel. Under
`prefers-reduced-motion`, or if WebGL2 is refused, the still of the bar with
all the copy stands in. Rebuild the textures with:

```bash
npm run lounge
```

Depth maps come from Depth Anything v2 (small), run locally through
transformers.js. That toolchain lives in a throwaway folder,
`.lounge-tmp.nosync/depth` (install `@huggingface/transformers` there with
`--ignore-scripts`; it is never a project dependency, because its own copy of
sharp fights the project's), and `npm run lounge-depth` writes the maps that
`npm run lounge` picks up. Without them the build falls back to a modelled
relief for the hookah and painted planes for the bar.

To use it, mount `<LoungeHero />` in place of `<Hero />` in `src/app/page.tsx`.

## The loading screen

`src/components/layout/Loader.tsx` covers the page in navy with the mark
until the landing page has its first frame, then fades away. It is never up
for less than about a second (the mark deserves a beat) or more than about
three (a slow connection must not hold the visitor), it locks scrolling and
holds the hero's entrance while up so the two never race, and it shows once
per visit (session storage). The hero reports readiness through a small
event in `src/lib/loading.ts`.

## The menu arrival

`/menu` opens on the book: the section is pinned and the whole book is scrubbed with scroll: it comes in
tilted back and dim, settles flat over the first stretch, then turns a page
for every further stretch of scroll until the last spread; scrolling back up
turns them back. The book does its own turning through its queue, so a fast
scroll plays the turns in order rather than tearing. The pin length comes
from the book's spread count (nine on desktop, eighteen single pages on
phones). After the pin the book is the book, with arrows, drag and keyboard
exactly as before. The plain list of the same menu follows further down the
page, after the pin, at `/menu#list` (linked under the book and from the
intro), so nothing inside the pinned section ever has to grow taller than the
pin. Under `prefers-reduced-motion` there is no pin and no scrub. See `src/hooks/useMenuArrival.ts`.

## Type

Headlines are Playfair Display, body is Manrope, both self-hosted latin subsets
in `src/fonts` and loaded through `next/font/local` in `src/app/fonts.ts`.
The serif is deliberate: the plaque logo and the printed menu are set in
classical serif forms and the headlines borrow from them. Devanagari uses Noto
Serif Devanagari.

## The serving sequence

`#thali` on the home page pins a section and scrubs a frame sequence cut from the restaurant's
own footage. Scroll position is the only clock: down serves the next course, up
takes it away. The plate never leaves the screen and nothing cross-fades.

Frames live in `public/thali` (100 WebP, ten per second of footage, 720px
square, lightly sharpened on export). Rebuild
them from a new video with:

```bash
node scripts/build-thali-frames.mjs /path/to/serving.mp4
```

Then check the `frame` numbers in `src/data/thali.ts` still land on the right
course; those are what the captions and the progress rail key off.

Under `prefers-reduced-motion` there is no pin and no canvas: the final frame
renders as a still image beside the seven courses as a list.

## The food ribbon

A pour of sauce, with coriander, chilli, peppercorns, crumbs and spice
clinging to it, appears once on each of the story, menu and bar pages, in
a fixed layer under the content (`src/components/decor/FoodRibbon.tsx`):

- in the story it enters from the left edge, sweeps across and goes back out
  at the left, gone before the thali pins;
- after the thali it enters from the right and passes behind the menu book
  while the book scrubs, leaving at the left before the carousel;
- in the bar it enters from the left and keeps flowing through reviews,
  visit and the footer to the end of the page.

Each segment is drawn along its path by scroll: a window of the pour slides
from the start of the path to its end, so it enters, travels and leaves at
the edges the path was drawn to. The pour is slim, and it keeps out from
under the words: a few hit tests along the drawn part of the path, at most
twelve times a second, and while any heading or paragraph sits on it the
segment dims to almost nothing, returning once the text has scrolled clear. The garnish is scattered from a seeded
generator, so it is the same on every visit. Under `prefers-reduced-motion`
the layer is not rendered at all.

## The dish carousel

`#dishes` on the home page pins a row of five plates and slides it with scroll. One number
drives everything: the fractional index of whichever dish is at the centre of
the viewport. The row moves so that dish is centred, and every card's scale,
brightness, opacity, softness and elevation are continuous functions of its
distance from the centre, so focus hands over smoothly as plates pass. A
sideways wheel or trackpad swipe inside the section drives the same scroll,
the arrows and the arrow keys jump a plate at a time, and the row settles on
the nearest plate when scrolling stops.

The cut-outs in `public/dishes` come from the supplied photographs, which
carried a rendered checkerboard where transparency should be. Rebuild them
with:

```bash
npm run dishes -- ~/Downloads
```

The script keys out only the checkerboard and the generator's watermark; the
food and plates are not altered. Under `prefers-reduced-motion` the section is
a plain strip that scrolls and snaps sideways.

## The logo

One source artwork, `public/brand/logo-source.png`, produces every brand asset:

```bash
npm run logo
```

| File | Used by |
|---|---|
| `logo.webp` | the menu book cover, anywhere with room for the whole plaque |
| `logo-wordmark.webp` | the header, footer and admin bar |
| `logo-mark.webp`, `icon-512.png`, `favicon-32.png` | favicon, apple touch icon, tiles |

Crops are stored as fractions of the source in `scripts/build-logo.mjs`, so
re-exporting the artwork at a different size still works. Replace the source
file and re-run the script; nothing else changes.

## The menu

`src/data/menu.ts` is a transcription of the restaurant's printed menu, not a
mockup. Names keep the spellings from the card so a page can be checked against
the original. There are no dish descriptions because the printed menu has none.

The book runs to 17 pages. Two shapes of pricing are supported:

- a single price with a dotted leader, used by most dishes
- a **price table**, where a group declares `columns` and each item carries
  `prices` aligned to them. Momo is priced by style, spirits by measure,
  cigarettes by piece or packet.

Anything with no printed price uses `PRICE_MISSING`, renders as `···`, and puts
an "ask us" line at the foot of that page only. Today that is Mutton Curry alone.

## The admin panel

`/admin` is the back of house. It is not linked from the site and is marked
`noindex`.

| Tab | Does |
|---|---|
| Reservations | Today / upcoming / past / all, search by name, phone, email or reference, mark **Seated** or **No show**, cancel and restore, cover count, CSV export |
| Service | Close individual dates for festivals or private events, which removes them from the guest booking calendar immediately. Shows the service hours from code for reference. |
| Menu | Rename a dish, set its price (including each variant of a table-priced group), mark it vegetarian or off menu, remove it, or add a dish the card does not have. Changes reach the public menu straight away. Filter to one page to keep the list short. |

Two things to know before you rely on it:

- **It is unprotected.** There is no login, because a client-side password would
  be theatre. Put real auth in front of this route before deploying.
- **It only sees this browser.** Menu overrides, closing days and reservations
  all live in `localStorage`, so the panel cannot show a booking a guest made on
  their own phone. That is the single reason the panel needs a backend.

All of it sits behind one interface in **`src/lib/adminClient.ts`**, which holds
every admin `TODO(backend)`.

Menu edits are stored as **overrides**, never as a rewrite of the data file, so
`src/data/menu.ts` stays the source of truth and "Reset to printed menu" always
returns to the card. `src/lib/menuOverrides.ts` holds the shape and the merge.

Items are keyed by page id plus a slug of the name **as printed**, so renaming a
dish in the panel keeps its key. Renaming it in `menu.ts` orphans the override,
which is the right trade: the printed menu changed, so the edit no longer
applies.

## Scripts

| Command | Does |
|---|---|
| `npm run placeholders` | Regenerates the OpenGraph image |
| `npm run logo` | Rebuilds every logo asset from the source artwork |
| `npm run lounge` | Rebuilds the lounge hero's textures from `assets/lounge` |
| `npm run lounge-depth` | Depth maps for the lounge from the local model (see the landing page section) |
| `node scripts/shot-lounge.mjs` | The lounge at points along its timeline, both viewports |
| `node scripts/shots.mjs` | Screenshots every section at 360/768/1440, flags page errors and horizontal overflow |
| `node scripts/test-book.mjs` | Menu-book turn interactions |
| `node scripts/test-booking.mjs` | Reservation flow end to end, including the `.ics` |
| `node scripts/test-plate.mjs` | Plate pin, scrub and lag |
| `node scripts/test-a11y.mjs` | axe audit across routes and states, plus reduced-motion behaviour |
| `node scripts/test-pages.mjs` | Every page direct and by header link: scroll to top, one `h1`, current page marked, loading screen only on a direct load of `/` |
| `node scripts/test-food-ribbon.mjs` | The ribbon's segment on each of its three pages, and its absence on the home page |
| `node scripts/test-admin.mjs` | Admin panel end to end, including its effect on the public menu and calendar |
| `node scripts/test-admin-a11y.mjs` | axe audit of all three admin tabs |

The test scripts need Playwright's Chromium:

```bash
PLAYWRIGHT_BROWSERS_PATH="$PWD/.pw-browsers.nosync" npx playwright install chromium
```

and expect a dev server on `http://localhost:3123` (pass another base URL as the
first argument).

## Note for this machine only

The project folder sits inside iCloud Drive's synced Desktop. Dependencies live
in `node_modules.nosync` behind a `node_modules` symlink and the build output
goes to `.next.nosync`, because iCloud skips `*.nosync` paths — without that,
macOS evicts dependency files mid-build and `tsc` crawls. `next.config.ts`
disables output file tracing for the same reason (it only matters for
`output: "standalone"` deploys). On CI or any normal checkout, delete the
symlink, run `npm install`, and none of this applies.
