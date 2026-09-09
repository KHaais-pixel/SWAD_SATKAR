/** Written by scripts/build-thali-film.mjs. Hand edits are overwritten. */
export const FILM_FRAMES = 240;
export type FilmSize = 800 | 460;
export const filmFrame = (i: number, size: FilmSize) => `/thali-film/w${size}/f-${String(i).padStart(3, "0")}.webp`;
export const FILM_POSTER = "/thali-film/poster.jpg";
export const FILM_FIRST = "/thali-film/first.jpg";
/** Viewports of scroll the serving takes. */
export const FILM_SCROLL = 4;
