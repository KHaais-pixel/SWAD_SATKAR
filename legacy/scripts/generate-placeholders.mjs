/**
 * Generates the
 * OpenGraph image. Real photos replace these by dropping files into
 *
 *   node scripts/generate-placeholders.mjs
 */
import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";

const INK = "#04141f";
const CHAR = "#0a2536";
const PAPER = "#eef5fa";
const AZURE = "#0f9fe0";
const GLOW = "#5cc8f5";
const CHILI = "#e2553c";
const BASIL = "#55a06d";
/** Serviceware keeps its own metal; only the room turns blue. */
const BRASS = "#c08b3e";

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const between = (a, b) => a + rnd() * (b - a);

const plate = (cx, cy, r, food) => `
  <circle cx="${cx + r * 0.16}" cy="${cy + r * 0.22}" r="${r}" fill="#000" opacity="0.55" filter="url(#blur)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#plate)"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.86}" fill="none" stroke="${INK}" stroke-opacity="0.12" stroke-width="${r * 0.02}"/>
  <path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy - r}" fill="none" stroke="${GLOW}" stroke-opacity="0.55" stroke-width="${r * 0.05}" stroke-linecap="round"/>
  ${food}`;

const bowl = (cx, cy, r, fill) => `
  <circle cx="${cx + r * 0.14}" cy="${cy + r * 0.2}" r="${r}" fill="#000" opacity="0.5" filter="url(#blur)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${CHAR}"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.82}" fill="${fill}"/>
  <ellipse cx="${cx - r * 0.3}" cy="${cy - r * 0.35}" rx="${r * 0.3}" ry="${r * 0.12}" fill="#fff" opacity="0.14"/>`;

const herbs = (cx, cy, r) =>
  Array.from({ length: 5 }, () => {
    const a = between(0, Math.PI * 2), d = between(0, r * 0.7);
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, s = r * between(0.12, 0.22);
    return `<path d="M${x} ${y} c${s} ${-s * 0.8} ${s * 2} ${-s * 0.6} ${s * 2.6} 0 c${-s * 0.8} ${s * 0.6} ${-s * 1.8} ${s * 0.7} ${-s * 2.6} 0z" fill="${BASIL}" transform="rotate(${between(0, 360)} ${x} ${y})"/>`;
  }).join("");

const chilies = (cx, cy, r) =>
  Array.from({ length: 3 }, () => {
    const a = between(0, Math.PI * 2), d = between(0, r * 0.6);
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, s = r * 0.16;
    return `<path d="M${x} ${y} c${s * 0.9} ${-s * 0.3} ${s * 1.8} ${0} ${s * 2.2} ${s * 0.5} c${-s * 0.8} ${s * 0.3} ${-s * 1.6} ${s * 0.1} ${-s * 2.2} ${-s * 0.5}z" fill="${CHILI}" transform="rotate(${between(0, 360)} ${x} ${y})"/>`;
  }).join("");

const rice = (cx, cy, r) => `<ellipse cx="${cx}" cy="${cy}" rx="${r * 0.55}" ry="${r * 0.42}" fill="#f8f1e3" transform="rotate(${between(-20, 20)} ${cx} ${cy})"/>`;
const egg = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r * 0.32}" fill="#f6efe2"/><circle cx="${cx - r * 0.04}" cy="${cy - r * 0.04}" r="${r * 0.17}" fill="#e3a52e"/>`;

const napkin = (x, y, w, h, rot) => `
  <g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})">
    <rect x="${x + 18}" y="${y + 26}" width="${w}" height="${h}" fill="#000" opacity="0.5" filter="url(#blur)"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#napkin)"/>
    <line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="${INK}" stroke-opacity="0.08"/>
  </g>`;

const cutlery = (x, y, len, rot) => `
  <g transform="rotate(${rot} ${x} ${y})" stroke="#9db8c9" stroke-width="5" stroke-linecap="round" fill="${CHAR}">
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y + len}"/>
    <rect x="${x - 10}" y="${y - 50}" width="20" height="60" rx="10"/>
  </g>`;

const glass = (cx, cy, r, fill) => `
  <circle cx="${cx + r * 0.12}" cy="${cy + r * 0.16}" r="${r}" fill="#000" opacity="0.45" filter="url(#blur)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${PAPER}" stroke-opacity="0.35" stroke-width="3"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.8}" fill="${fill}"/>
  <ellipse cx="${cx - r * 0.25}" cy="${cy - r * 0.3}" rx="${r * 0.28}" ry="${r * 0.1}" fill="#fff" opacity="0.4"/>`;

const scenes = [
  { name: "kra-pao-overhead", w: 1200, h: 1500, alt: "Pad Kra Pao on a cream plate, seen from above, with a fried egg and holy basil", body: (w, h) => plate(w * 0.5, h * 0.48, w * 0.36, rice(w * 0.44, h * 0.5, w * 0.36) + `<ellipse cx="${w * 0.6}" cy="${h * 0.42}" rx="${w * 0.15}" ry="${w * 0.11}" fill="#3f2418"/>` + herbs(w * 0.58, h * 0.44, w * 0.36) + chilies(w * 0.58, h * 0.44, w * 0.3) + egg(w * 0.38, h * 0.4, w * 0.36)) + cutlery(w * 0.92, h * 0.2, h * 0.5, 4) },
  { name: "thali-brass", w: 1200, h: 900, alt: "A brass Thakali thali with small bowls of dal, gundruk, timur pickle and ghee rice", body: (w, h) => `<circle cx="${w * 0.5}" cy="${h * 0.52}" r="${h * 0.42}" fill="url(#azure)"/><circle cx="${w * 0.5}" cy="${h * 0.52}" r="${h * 0.42}" fill="none" stroke="${GLOW}" stroke-opacity="0.5" stroke-width="3"/>` + rice(w * 0.5, h * 0.52, h * 0.3) + bowl(w * 0.36, h * 0.36, h * 0.1, "#7a3b1f") + bowl(w * 0.64, h * 0.36, h * 0.1, "#3d4a2a") + bowl(w * 0.36, h * 0.68, h * 0.1, CHILI) + bowl(w * 0.64, h * 0.68, h * 0.1, "#c9a24a") },
  { name: "green-curry-bowl", w: 1200, h: 1200, alt: "Green curry in a dark bowl with thai eggplant and sweet basil", body: (w, h) => bowl(w * 0.5, h * 0.5, w * 0.3, "#7a9a4f") + herbs(w * 0.5, h * 0.5, w * 0.28) + chilies(w * 0.5, h * 0.5, w * 0.22) + napkin(w * 0.05, h * 0.65, w * 0.32, h * 0.32, -12) },
  { name: "timur-sour", w: 1200, h: 1500, alt: "A Timur Sour in a coupe glass, egg-white foam, seen from above on the bar", body: (w, h) => glass(w * 0.5, h * 0.45, w * 0.24, "#f4e9cc") + herbs(w * 0.58, h * 0.36, w * 0.14) + glass(w * 0.82, h * 0.78, w * 0.12, CHILI) },
  { name: "table-for-two", w: 1200, h: 900, alt: "Two place settings on a dark wooden table under warm light", body: (w, h) => plate(w * 0.28, h * 0.5, h * 0.3, "") + plate(w * 0.72, h * 0.5, h * 0.3, "") + cutlery(w * 0.08, h * 0.25, h * 0.45, 0) + cutlery(w * 0.92, h * 0.25, h * 0.45, 0) + napkin(w * 0.42, h * 0.1, w * 0.16, h * 0.2, 6) },
  { name: "sekuwa-skewers", w: 1200, h: 1200, alt: "Charcoal mutton sekuwa on a paper plate with raw onion and timur salt", body: (w, h) => plate(w * 0.5, h * 0.5, w * 0.34, Array.from({ length: 4 }, (_, i) => `<rect x="${w * 0.3}" y="${h * (0.36 + i * 0.08)}" width="${w * 0.4}" height="${h * 0.045}" rx="${h * 0.02}" fill="#5a2c17" transform="rotate(-8 ${w * 0.5} ${h * 0.5})"/>`).join("") + chilies(w * 0.5, h * 0.5, w * 0.25)) },
  { name: "tongba-pot", w: 1200, h: 1500, alt: "A wooden tongba pot with a bamboo straw, seen from above", body: (w, h) => `<circle cx="${w * 0.5}" cy="${h * 0.5}" r="${w * 0.26}" fill="#5a3a22"/><circle cx="${w * 0.5}" cy="${h * 0.5}" r="${w * 0.2}" fill="#d9c8a3"/><line x1="${w * 0.5}" y1="${h * 0.5}" x2="${w * 0.7}" y2="${h * 0.24}" stroke="#a8843e" stroke-width="14" stroke-linecap="round"/>` },
  { name: "som-tam", w: 1200, h: 900, alt: "Som tam green papaya salad heaped on a plate with peanuts and lime", body: (w, h) => plate(w * 0.5, h * 0.5, h * 0.38, `<ellipse cx="${w * 0.5}" cy="${h * 0.5}" rx="${h * 0.24}" ry="${h * 0.18}" fill="#c9d48a"/>` + chilies(w * 0.5, h * 0.5, h * 0.2) + `<circle cx="${w * 0.66}" cy="${h * 0.38}" r="${h * 0.06}" fill="#d7dc7a"/>`) },
  { name: "the-bar", w: 1200, h: 900, alt: "Three cocktails lined up on the bar under a low lamp", body: (w, h) => glass(w * 0.25, h * 0.5, h * 0.18, "#f4e9cc") + glass(w * 0.5, h * 0.5, h * 0.18, CHILI) + glass(w * 0.75, h * 0.5, h * 0.18, BRASS) },
];

const svgFor = (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s.w}" height="${s.h}" viewBox="0 0 ${s.w} ${s.h}">
  <defs>
    <radialGradient id="lamp" cx="20%" cy="10%" r="90%"><stop offset="0" stop-color="${GLOW}" stop-opacity="0.22"/><stop offset="0.45" stop-color="${GLOW}" stop-opacity="0.05"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient>
    <radialGradient id="plate" cx="36%" cy="30%" r="75%"><stop offset="0" stop-color="#fbfdff"/><stop offset="0.45" stop-color="${PAPER}"/><stop offset="0.8" stop-color="#c3d3e0"/><stop offset="1" stop-color="#a2b6c6"/></radialGradient>
    <radialGradient id="azure" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#e9c67a"/><stop offset="0.6" stop-color="${BRASS}"/><stop offset="1" stop-color="#8a5f26"/></radialGradient>
    <linearGradient id="napkin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fa8c4"/><stop offset="0.5" stop-color="#4d7d9c"/><stop offset="1" stop-color="#2b4f67"/></linearGradient>
    <filter id="blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${Math.round(s.w * 0.025)}"/></filter>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.35 0 0 0 0 0.55 0 0 0 0 0.72 0 0 0 0.07 0"/></filter>
  </defs>
  <rect width="100%" height="100%" fill="${INK}"/>
  <rect width="100%" height="100%" fill="url(#lamp)"/>
  ${s.body(s.w, s.h)}
  <rect width="100%" height="100%" filter="url(#grain)"/>
  <rect width="100%" height="100%" fill="url(#lamp)" opacity="0.5"/>
</svg>`;


// OpenGraph card: 1200x630, the real plaque on the table with a dish beside it.
const ogBg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="lamp" cx="18%" cy="0%" r="95%"><stop offset="0" stop-color="${GLOW}" stop-opacity="0.22"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient>
    <radialGradient id="plate" cx="36%" cy="30%" r="75%"><stop offset="0" stop-color="#fbfdff"/><stop offset="0.45" stop-color="${PAPER}"/><stop offset="1" stop-color="#a2b6c6"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="${INK}"/>
  <rect width="1200" height="630" fill="url(#lamp)"/>
  <circle cx="1075" cy="335" r="265" fill="#000" opacity="0.5"/>
  <circle cx="1050" cy="310" r="265" fill="url(#plate)"/>
  <path d="M785 310 A265 265 0 0 1 1050 45" fill="none" stroke="${GLOW}" stroke-opacity="0.8" stroke-width="11" stroke-linecap="round"/>
  ${herbs(1050, 310, 165)}${chilies(1050, 310, 135)}${egg(975, 262, 250)}
  <text x="70" y="560" font-family="Helvetica Neue, Arial, sans-serif" font-size="25" fill="${GLOW}">★ 4.7 on Google · Lalitpur, Nepal</text>
</svg>`;

const ogLogo = await sharp("public/brand/logo-source.png").resize({ width: 560 }).png().toBuffer();
await sharp(Buffer.from(ogBg))
  .composite([{ input: ogLogo, top: 90, left: 60 }])
  .png()
  .toFile("public/og.png");
console.log("wrote public/og.png");
