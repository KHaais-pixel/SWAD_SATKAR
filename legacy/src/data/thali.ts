/**
 * The serving sequence: one brass thali, filled dish by dish as the guest
 * scrolls. The visual is a frame sequence cut from the restaurant's own
 * footage, scrubbed directly by scroll position rather than played.
 *
 * Frames are built by `npm run thali-frames` from the source video and land
 * in `public/thali`. The plate never leaves the screen; each course simply
 * arrives on it, and scrolling back takes the courses away again.
 */

export interface ThaliStage {
  /** Two-digit label shown beside the title. */
  n: string;
  title: string;
  line: string;
  /** Frame this course begins on. */
  frame: number;
}

/** Frames in `public/thali`, numbered f-000 upward. */
export const FRAME_COUNT = 100;

export const framePath = (i: number) => `/thali/f-${String(i).padStart(3, "0")}.webp`;

/**
 * Where each course lands in the footage. Taken by stepping through the
 * frames, so a caption never describes something the plate has not received.
 */
export const thaliStages: ThaliStage[] = [
  { n: "01", title: "The Thali", line: "A clean plate, a new story.", frame: 0 },
  { n: "02", title: "Steamed Rice", line: "The heart of Thakali.", frame: 13 },
  { n: "03", title: "Dal", line: "Comfort in a bowl.", frame: 31 },
  { n: "04", title: "Curry", line: "Rich, flavorful, homestyle.", frame: 45 },
  { n: "05", title: "Curd", line: "A cool balance.", frame: 57 },
  { n: "06", title: "Sides", line: "A little bit of everything.", frame: 70 },
  { n: "07", title: "Complete", line: "A Thakali story on a plate.", frame: 84 },
];

/** The stage showing at a given frame. */
export const stageAtFrame = (frame: number) => {
  let i = 0;
  for (let s = 0; s < thaliStages.length; s++) if (frame >= thaliStages[s].frame) i = s;
  return i;
};

/** Scroll length of the pinned section, as a multiple of the viewport. */
export const SERVE_SCROLL = 7;
