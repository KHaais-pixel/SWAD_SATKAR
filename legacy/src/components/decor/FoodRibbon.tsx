"use client";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getGsap } from "@/lib/gsap";

/**
 * A pour of sauce that appears three times, each on its own stretch of the
 * page, in a fixed layer under the content:
 *
 *   story   in from the left edge, across, back out at the left, gone before
 *           the thali pins
 *   menu    in from the right after the thali, behind the book while it
 *           scrubs, out at the left before the carousel
 *   bar     in from the left, then flowing on through reviews, visit and the
 *           footer to the end of the page
 *
 * Each segment is drawn along its path by scroll: a window of the pour slides
 * from the start of the path to its end, so it enters, travels and leaves at
 * the edges the path was drawn to. Garnish is scattered along each path from
 * a seeded generator, identical on every visit.
 */

const VIEW_W = 1600;
const VIEW_H = 900;

interface Segment {
  id: "story" | "menu" | "bar";
  d: string;
  /** How the scroll range is found. */
  trigger: string;
  start: string;
  end: string | (() => string | number);
  /** Whether the tail follows the head out (true) or the pour stays (false). */
  leaves: boolean;
}

const SEGMENTS: Segment[] = [
  {
    id: "story",
    // around the text, never through it: along the top band, down the right margin, back along the bottom band
    d: "M -80 150 C 320 60, 900 70, 1300 180 C 1600 260, 1660 540, 1500 700 C 1330 860, 700 870, -80 840",
    trigger: "#story",
    start: "top 85%",
    end: "bottom 15%",
    leaves: true,
  },
  {
    id: "menu",
    d: "M 1680 230 C 1380 170, 1230 430, 920 480 C 640 530, 340 570, -80 530",
    trigger: "#menu",
    start: "top 60%",
    end: "bottom 40%",
    leaves: true,
  },
  {
    id: "bar",
    // the band just under the header: clear of the bar list, the rating, the map and the footer columns
    d: "M -80 150 C 260 60, 540 250, 920 140 C 1270 40, 1440 230, 1680 130",
    trigger: "#bar",
    start: "top 85%",
    end: "max",
    leaves: false,
  },
];

interface Bit {
  kind: "leaf" | "chili" | "pepper" | "crumb" | "spice";
  x: number;
  y: number;
  r: number;
  s: number;
}

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function scatter(path: SVGPathElement, seed: number): Bit[] {
  const rnd = seeded(seed);
  const out: Bit[] = [];
  const kinds: Bit["kind"][] = ["spice", "spice", "spice", "crumb", "crumb", "pepper", "pepper", "leaf", "leaf", "chili"];
  const len = path.getTotalLength();
  const n = Math.round(len / 40);
  for (let i = 0; i < n; i++) {
    const d = rnd() * len;
    const p = path.getPointAtLength(d);
    const q = path.getPointAtLength(Math.min(len, d + 2));
    const ang = Math.atan2(q.y - p.y, q.x - p.x);
    const kind = kinds[Math.floor(rnd() * kinds.length)];
    const spread = kind === "spice" ? 26 : kind === "crumb" ? 20 : 16;
    const off = (rnd() * 2 - 1) * spread;
    out.push({
      kind,
      x: p.x - Math.sin(ang) * off,
      y: p.y + Math.cos(ang) * off,
      r: (ang * 180) / Math.PI + (rnd() * 2 - 1) * 40,
      s: kind === "leaf" ? 1.0 + rnd() * 0.7 : kind === "chili" ? 0.9 + rnd() * 0.5 : kind === "pepper" ? 0.9 + rnd() * 0.6 : 0.8 + rnd() * 0.8,
    });
  }
  return out;
}

export function FoodRibbon() {
  const reduced = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const [bits, setBits] = useState<Record<string, Bit[]>>({});

  // Garnish, once the paths exist.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const next: Record<string, Bit[]> = {};
    SEGMENTS.forEach((seg, i) => {
      const path = svg.querySelector<SVGPathElement>(`[data-sweep="${seg.id}"]`);
      if (path) next[seg.id] = scatter(path, 7 + i * 31);
    });
    setBits(next);
  }, []);

  // Each segment drawn by its own stretch of scroll.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || reduced) return;
    const { gsap, ScrollTrigger } = getGsap();
    const triggers: ScrollTrigger[] = [];
    const setup = () => {
      triggers.forEach((t) => t.kill());
      triggers.length = 0;
      for (const seg of SEGMENTS) {
        const group = svg.querySelector<SVGGElement>(`[data-segment="${seg.id}"]`);
        const reveal = svg.querySelector<SVGPathElement>(`[data-reveal="${seg.id}"]`);
        const el = document.querySelector<HTMLElement>(seg.trigger);
        if (!group || !reveal || !el) continue;
        // pinned sections: their spacer is the real extent on the page
        const trigger = el.closest<HTMLElement>(".pin-spacer") ?? el;
        // Points along the pour, in drawing units, for the text check below.
        const sweep = svg.querySelector<SVGPathElement>(`[data-sweep="${seg.id}"]`);
        const samples: { x: number; y: number }[] = [];
        if (sweep) {
          const len = sweep.getTotalLength();
          for (let k = 0; k <= 16; k++) samples.push(sweep.getPointAtLength((k / 16) * len));
        }
        let lastCheck = 0;
        let underText = false;
        const TEXT = "H1,H2,H3,H4,P,A,LI,DT,DD,SPAN,BUTTON,TD,TH,LABEL,SMALL,STRONG,EM,BLOCKQUOTE,ADDRESS";
        /** True when a piece of text sits on the drawn part of the pour. */
        const textOnPour = (head: number, tail: number) => {
          const rect = svg.getBoundingClientRect();
          const k = Math.max(rect.width / VIEW_W, rect.height / VIEW_H);
          const ox = rect.left + (rect.width - VIEW_W * k) / 2;
          const oy = rect.top + (rect.height - VIEW_H * k) / 2;
          const lift = Number(gsap.getProperty(group, "y")) || 0;
          for (let i = 0; i < samples.length; i++) {
            const f = i / (samples.length - 1);
            if (f < tail || f > head) continue;
            const x = ox + samples[i].x * k, y = oy + (samples[i].y + lift) * k;
            if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
            const hit = document.elementFromPoint(x, y);
            // the book's pages are opaque: text on them is never on the pour
            if (hit && TEXT.includes(hit.tagName) && hit.closest("main, footer") && !hit.closest('[aria-roledescription="menu book"]')) return true;
          }
          return false;
        };
        const apply = (p: number) => {
          // head draws over the first part; if the pour leaves, the tail follows over the last part
          const head = Math.min(1, p / (seg.leaves ? 0.62 : 0.9));
          const tail = seg.leaves ? Math.max(0, (p - 0.5) / 0.5) : 0;
          const win = Math.max(0, head - tail);
          reveal.style.strokeDasharray = `${win} 1`;
          reveal.style.strokeDashoffset = String(-tail);
          // a slow lift while it flows, the only movement besides the draw
          gsap.set(group, { y: (0.5 - p) * (seg.leaves ? 60 : 24) });
          // in and out at the edges of the range, so nothing pops
          const edge = Math.min(1, p / 0.08, (1 - p) / 0.06);
          const base = Math.max(0, Math.min(1, seg.leaves ? edge : Math.min(1, p / 0.08)));
          // and out of the way of words: a few hit tests, at most 12 times a second
          const now = performance.now();
          if (now - lastCheck > 80) {
            lastCheck = now;
            underText = textOnPour(head, tail);
          }
          gsap.to(group, { opacity: base * (underText ? 0.12 : 1), duration: 0.28, ease: "power1.out", overwrite: true });
        };
        triggers.push(
          ScrollTrigger.create({
            trigger,
            start: seg.start,
            end: seg.end === "max" ? () => ScrollTrigger.maxScroll(window) : seg.end,
            scrub: 0.6,
            invalidateOnRefresh: true,
            refreshPriority: -10,
            onUpdate: (self) => apply(self.progress),
            onRefresh: (self) => apply(self.progress),
          }),
        );
        apply(0);
      }
    };
    setup();
    // pinned sections appear after mount; rebuild once everything has settled
    const onRefresh = () => setup();
    ScrollTrigger.addEventListener("refreshInit", onRefresh);
    const late = window.setTimeout(() => ScrollTrigger.refresh(), 1200);
    return () => {
      window.clearTimeout(late);
      ScrollTrigger.removeEventListener("refreshInit", onRefresh);
      triggers.forEach((t) => t.kill());
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div aria-hidden data-food-ribbon className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <svg ref={svgRef} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid slice" className="block h-full w-full">
        <defs>
          <linearGradient id="fr-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--sauce-light)" />
            <stop offset="0.3" stopColor="var(--sauce)" />
            <stop offset="0.55" stopColor="var(--sauce-deep)" />
            <stop offset="0.8" stopColor="var(--sauce)" />
            <stop offset="1" stopColor="var(--sauce-light)" />
          </linearGradient>
          <linearGradient id="fr-gloss" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--sauce-light)" stopOpacity="0" />
            <stop offset="0.5" stopColor="var(--paper)" stopOpacity="0.85" />
            <stop offset="1" stopColor="var(--sauce-light)" stopOpacity="0" />
          </linearGradient>
          <filter id="fr-fluid" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.011 0.018" numOctaves="2" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="fr-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" /></filter>
          {/* the reveal's head and tail fade over a stretch of the pour rather than ending on a cap */}
          <filter id="fr-edge" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="22" /></filter>
          <filter id="fr-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="26" /></filter>
          <filter id="fr-shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12" /></filter>
          <g id="fr-leaf">
            <path d="M0 0 C 5 -7, 14 -9, 20 -3 C 14 3, 6 6, 0 0 Z" fill="var(--herb)" />
            <path d="M0 0 C 6 -4, 13 -5, 20 -3" stroke="var(--herb-dark)" strokeWidth="0.8" fill="none" />
            <path d="M-2 4 C 3 -3, 9 -10, 14 -13 C 9 -8, 4 -1, -2 4 Z" fill="var(--herb)" opacity="0.9" transform="translate(-6 2) rotate(-24)" />
            <path d="M2 -2 C 6 -9, 8 -15, 7 -20 C 4 -14, 2 -8, 2 -2 Z" fill="var(--herb-dark)" opacity="0.85" transform="translate(6 0) rotate(18)" />
          </g>
          <g id="fr-chili">
            <circle r="9" fill="var(--chili)" />
            <circle r="5.6" fill="var(--sauce-light)" opacity="0.9" />
            <circle r="1.1" cx="2.5" cy="-1.5" fill="var(--sauce)" />
            <circle r="1.1" cx="-2.4" cy="1.2" fill="var(--sauce)" />
            <circle r="1" cx="0.4" cy="3.1" fill="var(--sauce)" />
            <circle r="9" fill="none" stroke="var(--sauce-deep)" strokeWidth="0.8" opacity="0.7" />
          </g>
          <g id="fr-pepper">
            <circle r="4.6" fill="var(--pepper)" />
            <circle r="1.3" cx="-1.4" cy="-1.5" fill="var(--paper)" opacity="0.35" />
          </g>
          <g id="fr-crumb">
            <path d="M-4 -2 L 1 -5 L 5 -1 L 3 4 L -3 4 L -5 1 Z" fill="var(--menu-gold-dim)" />
            <path d="M-2 -2 L 1 -3 L 3 0 Z" fill="var(--sauce-light)" opacity="0.6" />
          </g>
          <g id="fr-spice"><circle r="1.7" fill="var(--sauce-deep)" /></g>
          {SEGMENTS.map((seg) => (
            <mask key={seg.id} id={`fr-reveal-${seg.id}`} maskUnits="userSpaceOnUse" x="-400" y="-400" width={VIEW_W + 800} height={VIEW_H + 800}>
              <g fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" filter="url(#fr-edge)">
                <path d={seg.d} data-reveal={seg.id} pathLength={1} strokeWidth="120" strokeDasharray="0 1" />
              </g>
            </mask>
          ))}
        </defs>

        {SEGMENTS.map((seg) => (
          <g key={seg.id} data-segment={seg.id} mask={`url(#fr-reveal-${seg.id})`} style={{ opacity: 0 }}>
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d={seg.d} stroke="var(--sauce)" strokeWidth="64" opacity="0.18" filter="url(#fr-glow)" />
              <path d={seg.d} stroke="var(--ink-deep)" strokeWidth="34" opacity="0.7" transform="translate(6 12)" filter="url(#fr-shadow)" />
              <g filter="url(#fr-fluid)">
                <path d={seg.d} stroke="url(#fr-body)" strokeWidth="36" opacity="0.3" filter="url(#fr-soft)" />
                <path d={seg.d} data-sweep={seg.id} stroke="url(#fr-body)" strokeWidth="24" />
              </g>
              <path d={seg.d} stroke="var(--sauce-light)" strokeWidth="4" opacity="0.5" transform="translate(-4 -8)" filter="url(#fr-soft)" />
              <path d={seg.d} className="sauce-sheen" stroke="url(#fr-gloss)" strokeWidth="9" strokeDasharray="240 400" opacity="0.8" transform="translate(-3 -6)" filter="url(#fr-soft)" />
            </g>
            <g>
              {(bits[seg.id] ?? []).map((b, i) => (
                <use key={i} href={`#fr-${b.kind}`} transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) rotate(${b.r.toFixed(1)}) scale(${b.s.toFixed(2)})`} />
              ))}
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
