import { HOOKAH, BAR } from "@/data/lounge";
import type { LoungeState } from "./gl";

/**
 * The scroll timeline: progress 0..1 to a camera and a look. Every value is a
 * piecewise curve through keyframes with an eased join, so the motion is
 * continuous and fully reversible; nothing here depends on time.
 *
 *   0.00  dark, dust
 *   0.10  the hookah's silhouette
 *   0.25  the hookah, lit
 *   0.40  closer, the glass
 *   0.50  around it
 *   0.60  into the metal: the reflection
 *   0.70  the blue shelves appear in it
 *   0.80  bottles and glasses
 *   0.90  the camera pulls back
 *   1.00  the bar
 */

type Key = [number, number];
const ease = (t: number) => t * t * (3 - 2 * t);
/** Piecewise interpolation through [progress, value] pairs. */
function curve(p: number, keys: Key[]): number {
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [p1, v1] = keys[i];
    if (p <= p1) {
      const [p0, v0] = keys[i - 1];
      return v0 + (v1 - v0) * ease((p - p0) / (p1 - p0));
    }
  }
  return keys[keys.length - 1][1];
}

export interface Viewport { width: number; height: number }

/** Where a plane's texture point `f` (0..1, y up) sits at screen point `at` for half extents `h`. */
const centreFor = (f: [number, number], at: [number, number], h: [number, number]): [number, number] => [at[0] - (f[0] - 0.5) * 2 * h[0], at[1] - (f[1] - 0.5) * 2 * h[1]];
/** Texture coordinates from the build are y-down; the shader's are y-up. */
const up = (pt: { x: number; y: number }): [number, number] => [pt.x, 1 - pt.y];

export function stateAt(p: number, vp: Viewport): LoungeState {
  const A = vp.width / vp.height; // screen half-width in height units is A / 2
  const phone = A < 0.9;

  /* ---------------------------------------------------------- hookah */
  const glass: [number, number] = up({ x: HOOKAH.collar.x, y: (HOOKAH.collar.y + HOOKAH.base.y) / 2 });
  const collar = up({ x: HOOKAH.collar.x, y: HOOKAH.collar.y - 0.03 });
  const mid: [number, number] = [0.5, 0.5];
  const hkH0 = phone ? Math.min(0.31, (A / 2) * 0.86 / HOOKAH.aspect) : 0.42;
  const zoom = curve(p, [[0, 1], [0.25, 1.06], [0.4, 1.55], [0.55, 1.85], [0.64, 7.5], [0.72, 9]]);
  const hkH: [number, number] = [hkH0 * HOOKAH.aspect * zoom, hkH0 * zoom];
  const fx = curve(p, [[0.25, mid[0]], [0.4, glass[0]], [0.55, glass[0]], [0.64, collar[0]]]);
  const fy = curve(p, [[0.25, mid[1]], [0.4, glass[1]], [0.55, glass[1]], [0.64, collar[1]]]);
  const atX = phone ? curve(p, [[0, 0], [0.4, 0.02], [0.55, -0.02], [0.64, 0]]) : curve(p, [[0, 0.17], [0.4, 0.1], [0.55, -0.04], [0.64, 0]]);
  const atY = phone ? curve(p, [[0, -0.07], [0.4, -0.15], [0.55, -0.15], [0.64, 0]]) : curve(p, [[0, -0.02], [0.4, 0], [0.64, 0]]);
  const hkC = centreFor([fx, fy], [atX, atY], hkH);
  // the orbit: the camera slides sideways, so near parts drift against far parts
  const hkParX = curve(p, [[0.2, 0], [0.4, -0.012], [0.55, 0.03], [0.64, 0.012]]);
  const hkParY = curve(p, [[0.25, 0], [0.55, -0.006], [0.64, 0]]);

  /* ---------------------------------------------------------- bar */
  const cover = Math.max((A / 2) / (BAR.aspect * 0.5), 1) * 0.5 * 1.06;
  const barZoom = curve(p, [[0.6, 2.4], [0.72, 1.95], [0.8, 1.55], [0.9, 1.22], [1, 1]]);
  const barH: [number, number] = [cover * BAR.aspect * barZoom, cover * barZoom];
  // shelf middle, then the glasses on the counter, then the whole thing
  const bfx = curve(p, [[0.58, 0.52], [0.7, 0.5], [0.8, 0.58], [0.9, 0.7], [1, 0.5]]);
  const bfy = curve(p, [[0.58, 0.6], [0.7, 0.58], [0.8, 0.52], [0.9, 0.46], [1, 0.5]]);
  const barC = centreFor([bfx, bfy], [curve(p, [[0.58, 0.02], [0.8, -0.02], [1, 0]]), curve(p, [[0.58, 0.02], [1, 0]])], barH);
  const barParX = curve(p, [[0.6, -0.006], [0.75, 0.008], [0.9, -0.005], [1, 0]]);

  return {
    hkC, hkH,
    hkPar: [hkParX, hkParY],
    hkDolly: curve(p, [[0.25, 0], [0.55, 0.05], [0.64, 0.12]]),
    hkFocus: [fx, fy],
    hkExposure: curve(p, [[0, 0.05], [0.1, 0.13], [0.25, 1.0], [0.55, 1.05], [0.64, 0.75]]),
    hkSpec: curve(p, [[0.05, 0], [0.25, 0.35], [0.45, 0.6], [0.64, 0.9]]),
    hkRim: curve(p, [[0, 0.05], [0.1, 0.35], [0.25, 0.22], [0.5, 0.3], [0.64, 0.15]]),
    hkRelief: curve(p, [[0, 4], [0.4, 5], [0.64, 3.5]]),
    hkBlur: curve(p, [[0.55, 0], [0.64, 1.4], [0.72, 2.4]]),
    hkCA: curve(p, [[0.5, 0], [0.64, 0.006], [0.72, 0.01]]),
    hkRed: curve(p, [[0.55, 0], [0.64, 0.55], [0.72, 0.7]]),
    barC, barH,
    barPar: [barParX, curve(p, [[0.6, 0.004], [1, 0]])],
    barDolly: curve(p, [[0.6, 0.045], [0.8, 0.03], [1, 0.012]]),
    barFocus: [bfx, bfy],
    barExposure: curve(p, [[0.6, 0.5], [0.74, 0.92], [1, 1]]),
    barSpec: curve(p, [[0.6, 0.45], [0.8, 0.5], [1, 0.28]]),
    barRelief: curve(p, [[0.6, 3.5], [1, 2.5]]),
    barBlur: curve(p, [[0.6, 2.2], [0.72, 0.7], [0.8, 0]]),
    bloom: curve(p, [[0.6, 0.25], [0.8, 0.2], [1, 0.14]]),
    light: curve(p, [[0, 2.4], [0.4, 1.8], [0.55, -0.9], [0.64, -1.4], [0.8, -2.2], [1, -2.9]]),
    mix: curve(p, [[0.6, 0], [0.72, 1]]),
    warp: curve(p, [[0.6, 0.03], [0.66, 0.004], [0.68, 0]]),
    particles: curve(p, [[0, 0.7], [0.25, 0.45], [0.55, 0.2], [0.64, 0]]),
    vignette: curve(p, [[0, 0.75], [0.25, 0.6], [0.64, 0.8], [0.8, 0.55], [1, 0.45]]),
    floor: curve(p, [[0, 0], [0.12, 0.3], [0.25, 0.6], [0.55, 0.4], [0.64, 0]]),
  };
}

/** How each line of copy fades with progress. */
export const COPY = {
  name: (p: number) => curve(p, [[0, 1], [0.16, 1], [0.24, 0]]),
  night: (p: number) => curve(p, [[0.26, 0], [0.34, 1], [0.5, 1], [0.57, 0]]),
  linger: (p: number) => curve(p, [[0.86, 0], [0.95, 1]]),
  scrim: (p: number) => curve(p, [[0.84, 0], [0.95, 1]]),
  cue: (p: number) => curve(p, [[0, 1], [0.06, 0]]),
};
