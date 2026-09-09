/**
 * The landing-page footage as a frame sequence: a doorway, the Himalaya above
 * cloud, a thali, spices in the air, a Thai curry, Bangkok at night, the bar
 * and the dining room. Scrubbed by scroll behind the name, not played.
 *
 * Built by `npm run hero-frames <video>` into `public/hero`, in two sizes.
 */
export const HERO_FRAME_COUNT = 100;

export type HeroFrameSize = 1600 | 960;

export const heroFramePath = (i: number, size: HeroFrameSize = 1600) =>
  `/hero/w${size}/f-${String(i).padStart(3, "0")}.webp`;

/** The film itself, for idle playback: WebM first, MP4 for browsers without it. */
export const heroFilmSources = (size: HeroFrameSize = 1600) =>
  size === 960
    ? [{ src: "/hero/film-960.webm", type: "video/webm" }, { src: "/hero/film-960.mp4", type: "video/mp4" }]
    : [{ src: "/hero/film-1280.webm", type: "video/webm" }, { src: "/hero/film-1280.mp4", type: "video/mp4" }];

/** Scroll length of the pinned hero, as a multiple of the viewport. */
export const HERO_SCROLL = 4;

/**
 * Frames where the footage cuts to a new scene, found by comparing each frame
 * with the one before. The canvas never blends across a cut and dips briefly
 * to navy over it, so a cut reads as an edit rather than a glitch.
 */
export const HERO_CUTS: number[] = [];
// The loop point (frame count) is added by the hero itself, for the idle drift.
