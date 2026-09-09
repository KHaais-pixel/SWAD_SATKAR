import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;
/** GSAP with ScrollTrigger registered once. Import only from client code. */
export function getGsap() {
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return { gsap, ScrollTrigger };
}

/** The house easing: settles like a door closing softly. */
export const EASE = "power3.out";

export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** A mouse or trackpad, not a finger: the cursor, tilt and magnetism only make sense here. */
export const finePointer = () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
export const smallScreen = () => typeof window !== "undefined" && window.innerWidth < 760;
/** Movement is halved on small screens. */
export const motionScale = () => (smallScreen() ? 0.5 : 1);

declare global {
  interface Window {
    __lenis?: { stop: () => void; start: () => void; destroy: () => void; scrollTo: (t: number | string | HTMLElement, o?: object) => void; velocity: number };
  }
}
