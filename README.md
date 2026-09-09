# Swad Satkar

The website for Swad Satkar, a Thakali and Thai restaurant with a bar in
Lalitpur. Next.js 15 (App Router), TypeScript, Tailwind v4. The look follows
the design handed over as a Claude Design canvas ("Restaurant site with staff
panel"): cream paper, deep navy, gold; Bodoni Moda headlines, Cormorant
Garamond italics, Karla text, Space Mono labels; the restaurant's own
photographs.

## Run it

```bash
npm install
npm run dev -- --port 3123
```

## Pages

| Route | Holds |
|---|---|
| `/` | The house at dusk, the story, Thakali, Thai, the bar, from our kitchen, the experience, the printed menu, reservations |
| `/story` | The story, "What We Keep", three photographs |
| `/thakali` | Thakali and Nepali menu, with a sticky row of section tabs |
| `/thai` | Thai menu |
| `/bar` | The room, spirits by bottle and measure, beer, hookah, tea, coffee, cigarettes |
| `/gallery` | The photographs in albums: a masonry that drifts with the scroll and a viewer that grows out of the tile. Visitors only; what is in it is decided in the staff panel |
| `/book` | A reservation request form; requests are held for a call-back, never booked automatically |
| `/contact` | Hours, address, phone, email, the map |
| `/staff` | Behind a passcode: reservation requests, photographs added to the gallery, and every menu price |

Old addresses redirect: `/menu` → `/thakali`, `/visit` → `/contact`,
`/reserve` → `/book`, `/admin` → `/staff`.

## Where things live

- `src/app` — one folder per page, `layout.tsx` (header, footer, effects, schema), `globals.css` (tokens and utilities).
- `src/components` — `Header`, `Footer`, `HomeHero`, `GalleryAlbum`, `ThaliAssembly`, `MenuFlip`, `BookForm`, `StaffPanel` (+ `StaffGallery`, `StaffPrices`), `JsonLd`; `motion/` holds the scroll and cursor system.
- `src/data/site.ts` — the facts: hours, contact, photographs, copy lists. `src/data/menus.ts` — every menu, transcribed from the printed cards.
- `src/lib/reservations.ts` — the request store (this browser's storage). A backend replaces this one module.
- `src/lib/content.ts` — what the staff change: `content/gallery.json` and `content/prices.json`, plus the uploaded photographs in `content/uploads/gallery/`, served by the route at `src/app/uploads/gallery/[file]`. The pages merge these over the built-in data; `src/app/api/staff/*` writes them.
- `public/photos` — the restaurant's photographs, resized. `public/brand` — the plaque and icons.

## Motion

The page moves like walking in, and all of it lives in `src/components/motion`:

- `MotionRoot` (in the layout) runs Lenis smooth scrolling on GSAP's ticker and, on every route, arms the page from data attributes: a `data-scene` reveals its `data-step` children in order (number, headline, words, picture, buttons); `data-drift="x:28"` or `y:-40` or `opacity:0.5` scrubs an element across its section; `data-bg="#hex"` eases the page colour toward a section as it arrives; `data-theme="dark"` and `data-nav="/path"` tell the header what it is over; `data-line` rules draw themselves. Lenis's velocity feeds a `--vy` variable so pictures carry a few pixels of momentum.
- `ParallaxImage` clips a photograph and lets it slide against the scroll, slightly enlarged, settling from 1.05 on arrival. `TiltCard` leans two degrees toward the pointer with the picture moving the other way. `Magnetic` pulls a button a few pixels toward the pointer. `AnimatedHeading` raises a headline line by line. `CustomCursor` is the ring that says VIEW, OPEN, EXPLORE or RESERVE over things marked `data-cursor`. `SectionProgress` is the chapter list down the right edge of the home page.
- The hero is pinned under the page: the house pushes in and drifts slower than the words, the name lifts, spreads and fades, and the story slides up over it.

Movement halves on small screens; cursor, tilt and magnetism exist only for a mouse or trackpad. Under `prefers-reduced-motion` nothing here runs and the stylesheet shows everything at once. Transforms and opacity only.

Check it with `node scripts/test-motion.mjs` and `node scripts/shot-motion.mjs`.

## The plate, served by scroll

Section 06 of the home page pins for four viewports and serves the Thakali
thali as you scroll, from the restaurant's own footage: an empty steel plate,
then rice, dal, curry, greens, the sides, papad and dahi, until the plate is
whole. Scroll back and the serving reverses. It never plays on its own.

The scroll position is a playhead over 240 frames, and two things keep it
from stepping. The position is fractional, and the canvas dissolves between
the two frames it falls between, so there is no frame boundary to see. On top
of that the playhead eases toward the scroll's target on every display
refresh, which takes the jitter out of a wheel or a trackpad and settles
exactly where the hand stopped. Scrolling the whole serving in six seconds,
every single render advances a fraction of a frame, never a whole one.

Frames are cropped to the centre square (the shot is top-down and the plate
is centred, so no pixel is spent on table the panel never shows) and built at
two sizes; phones never fetch the wide set. They load only as the section
approaches, coarsely first (every eighth frame, then every fourth, and so on)
and the draw blends the nearest loaded frame on each side, so an early or
slow load reads as a softer scrub rather than a stuck one. The backing store
is capped at the frames' own resolution.

```bash
node scripts/build-thali-film.mjs /path/to/footage.mp4
```

writes `public/thali-film`, the two stills and `src/data/thali-film.ts`.
`src/components/motion/FrameScrub.tsx` is the canvas renderer,
`src/components/ThaliAssembly.tsx` the section, `scripts/test-thali.mjs` and
`scripts/probe-thali-smooth.mjs` the checks.

Under `prefers-reduced-motion` there is no pin and no canvas: the finished
plate, and both lines of copy.

The earlier version of this section composited eleven transparent cut-outs of
the real dishes onto a still plate. It is retired, but its sources are in
`assets/thali` and `npm run thali-layers` rebuilds the cut-outs and their
data file in one step.

## The printed menu, turned by scroll

Chapter 07 of the home page is the printed menu as a book. Each of the four
photographs is already an open spread, so the book is built the way a real
one is: the right-hand page of a spread is a leaf whose front is that page
and whose back is the left-hand page of the next spread. Turning it lays the
next left page down and uncovers the next right page underneath, so the four
spreads read in order. Nothing is recomposed, and no menu content is touched
— the menu itself lives on `/thakali` and `/thai`, linked from the section.

`scripts/build-menu-book.mjs` cuts the pages. It finds each spread's seam
(the flattest column near the centre, which is the printed margin), crops
symmetrically about it so both pages come out the same width, and writes
`public/menu-book` plus `src/data/menu-book.ts`. Rebuild with
`npm run menu-book` after replacing a board photograph.

The leaf's angle is driven by the same eased playhead as the plate, so the
turn is continuous at any scroll speed and reverses exactly: scrolling all
three turns in five seconds, each render advances under two degrees, with no
dropped frames. Under `prefers-reduced-motion` the four spreads are simply
stacked as photographs.

## Colour and contrast

Tokens are in `globals.css`. The gold that draws borders and buttons
(`--gold`, `--gold-deep`) is too light to read as small type on cream, so
type uses `--gold-ink`, a deeper cut of the same gold that passes AA. Quiet
text uses `--muted` and `--faint` at the same standard.

## The staff panel

Three tabs behind one passcode.

- **Reservations** are stored under `swadsatkar.reservations` in the browser
  that made them, so this tab shows what was submitted on that device only.
- **Gallery** changes are made in the panel only; the public gallery page
  has no controls. Uploads go through `POST /api/staff/gallery` (drag-and-drop
  or the file picker, several at once, into an album): the photograph is resized to a
  2200px master, written as WebP into `content/uploads/gallery/`, and listed
  in `content/gallery.json`. It appears in the albums on the gallery page at once. `DELETE ?id=` removes an upload for
  good; `DELETE ?src=` puts a house photograph away (its src goes into the
  `hidden` list, the file stays in the code) and `PUT` brings them all back.
- **Prices** are saved through `PUT /api/staff/prices` into
  `content/prices.json` as changes over the printed menu; clearing a field
  restores the printed price. The menu pages are revalidated on every save.

The panel compares the passcode against `NEXT_PUBLIC_STAFF_PASSCODE` (default
`swad2026`), and every API route checks it again on the server against
`STAFF_PASSCODE` if that is set, otherwise the public one. Set both in the
hosting environment before going live.

The gallery and price stores are files on the server's disk. They need the
site to run as a Node process (`next build && next start`) on a host with a
writable, persistent filesystem — a VPS, a container with a volume. A static
export, or a serverless host that discards the filesystem between requests,
will not keep them; there the two functions in `src/lib/content.ts` are the
place to swap in a database or object storage.

## Deploying to swadsatkar.com (cPanel, Passenger)

The live host is a cPanel/CloudLinux server. Node apps run under Passenger
from cPanel's **Setup Node.js App**, so there is no pm2 and no root.

One-time, in cPanel for the `swadsatkar.com` account:

1. **SSH Access → Manage SSH Keys → Import** the deploying machine's public
   key and **Authorize** it (or `ssh-copy-id user@182.93.80.120` from that
   machine).
2. **Setup Node.js App → Create application**: Node **22**, mode
   *Production*, application root `swadsatkar-app`, URL `/` on
   `swadsatkar.com`, startup file `app.js`. Add the environment variables
   `STAFF_PASSCODE` and `NEXT_PUBLIC_STAFF_PASSCODE`. This creates
   `~/nodevenv/swadsatkar-app/22` and the Passenger lines in
   `public_html/.htaccess` (`deploy/htaccess.public_html` shows the shape).
3. **SSL/TLS Status**: run AutoSSL for the domain.

Every release, from this folder:

```bash
NEXT_PUBLIC_STAFF_PASSCODE=<the code> npm run build
```

```bash
scripts/deploy-cpanel.sh <user>@182.93.80.120
```

The script rsyncs the build, `public/`, `package.json` and `next.config.ts`
to `~/swadsatkar-app`, seeds `content/` only if it is not there yet (the
staff's photographs and prices live in it and are never overwritten),
installs production dependencies with the app's own Node (sharp builds for
the server), and restarts Passenger by touching `tmp/restart.txt`.
`deploy/app.js` is the startup file: it boots Next in production on the port
Passenger hands it.

## Checks

```bash
node scripts/shots.mjs      # every route, desktop and phone, page errors, overflow
node scripts/test-a11y.mjs  # axe across routes and states
```

Both expect Playwright's Chromium in `.pw-browsers.nosync` and the dev server
on port 3123 (pass another base URL as the first argument).

## The previous site

Everything from the earlier design (the film hero, the thali frame scrub, the
dish carousel, the menu book, the food ribbon, the WebGL lounge) is parked in
`legacy/` with its assets, scripts and README. Nothing there is built or
linted.

## Note for this machine only

Build output and dependencies live in `*.nosync` paths so iCloud Drive leaves
them alone; `node_modules` is a symlink to `node_modules.nosync`.
