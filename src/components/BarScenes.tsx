"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { getGsap, reducedMotion } from "@/lib/gsap";
import { Magnetic } from "@/components/motion/Magnetic";

/**
 * The bar as three scroll-driven scenes on canvas, from the scroll lab,
 * opening the bar page:
 *
 *   01  the back bar three planes deep — the photograph held soft and two
 *       stops down at the back, the shelf lights blooming on the middle
 *       plane, the hookah sharp in front — each plane moving at its own
 *       rate as the section scrolls past, with smoke drifting between them
 *   02  a pinned exhale: a deterministic plume leaves the coal and fills the
 *       room as the scroll advances, and the name comes up out of the haze
 *   03  a pinned day to night: the same photograph graded live from 6500K
 *       daylight to 2200K tungsten, the practicals coming on after dark and
 *       the sign lighting tube by tube
 *
 * Every frame is a function of scroll position, never of a clock, so it runs
 * forward and backward at the reader's pace; the one moving thing that is
 * not, the drift of smoke over the first scene, stops under reduced motion,
 * where nothing pins and each scene shows its finished state.
 */

const BAR = "/bar/back-bar.webp";
const HOOKAH = "/bar/hookah.webp";
/** where smoke leaves the cut-out, as a fraction of the hookah image */
const BOWL = { x: 0.525, y: 0.022 };
/** the practical lights in the bar photograph: x, y and radius as fractions of the frame */
const PRACTICALS: Array<[number, number, number]> = [
  [0.2, 0.16, 0.14], [0.33, 0.3, 0.12], [0.27, 0.45, 0.1],
  [0.885, 0.11, 0.11], [0.74, 0.42, 0.09], [0.46, 0.06, 0.08],
];
const SEQ_COUNT = 48;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** a seeded generator, so every particle field is the same on every visit */
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Fit { ctx: CanvasRenderingContext2D; w: number; h: number }
function fit(cv: HTMLCanvasElement): Fit {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = cv.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const ctx = cv.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}
function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, w: number, h: number) {
  if (!img || !img.width) return;
  const r = Math.max(w / img.width, h / img.height);
  const dw = img.width * r, dh = img.height * r;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}
function ember(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,146,64,${0.8 * a})`);
  g.addColorStop(0.35, `rgba(214,74,34,${0.34 * a})`);
  g.addColorStop(1, "rgba(194,69,43,0)");
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}

/* 01: the three planes */
function drawBack(cv: HTMLCanvasElement, bar: HTMLImageElement | null) {
  const { ctx, w, h } = fit(cv);
  ctx.fillStyle = "#0C0908"; ctx.fillRect(0, 0, w, h);
  if (!bar) return;
  // held back in focus and exposure so the foreground reads as nearer
  ctx.filter = "blur(3px) brightness(.52) saturate(.88)";
  cover(ctx, bar, w, h);
  ctx.filter = "none";
  const warm = ctx.createLinearGradient(0, 0, 0, h);
  warm.addColorStop(0, "rgba(18,11,6,.6)"); warm.addColorStop(0.45, "rgba(48,27,10,.22)"); warm.addColorStop(1, "rgba(10,7,5,.78)");
  ctx.fillStyle = warm; ctx.fillRect(0, 0, w, h);
}
function drawMid(cv: HTMLCanvasElement) {
  const { ctx, w, h } = fit(cv);
  ctx.clearRect(0, 0, w, h);
  ctx.globalCompositeOperation = "lighter";
  for (const [px, py, pr] of PRACTICALS) {
    const rr = pr * Math.max(w, h);
    const g = ctx.createRadialGradient(px * w, py * h, 0, px * w, py * h, rr);
    g.addColorStop(0, "rgba(255,186,104,.22)"); g.addColorStop(0.45, "rgba(226,140,60,.09)"); g.addColorStop(1, "rgba(226,140,60,0)");
    ctx.fillStyle = g; ctx.fillRect(px * w - rr, py * h - rr, rr * 2, rr * 2);
  }
  ctx.globalCompositeOperation = "source-over";
}
function drawFront(cv: HTMLCanvasElement, hookah: HTMLImageElement | null) {
  const { ctx, w, h } = fit(cv);
  ctx.clearRect(0, 0, w, h);
  if (!hookah) return;
  const narrow = w < 760;
  const hh = h * (narrow ? 0.5 : 0.66), hw = (hh * hookah.width) / hookah.height;
  const cx = w * (narrow ? 0.72 : 0.79), by = h * 0.885;
  const sh = ctx.createRadialGradient(cx, by, 0, cx, by, hw * 0.6);
  sh.addColorStop(0, "rgba(0,0,0,.65)"); sh.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sh; ctx.fillRect(cx - hw, by - hh * 0.12, hw * 2, hh * 0.34);
  ctx.globalAlpha = narrow ? 0.72 : 1;
  ctx.drawImage(hookah, cx - hw / 2, by - hh, hw, hh);
  ctx.globalAlpha = 1;
  ember(ctx, cx - hw / 2 + hw * BOWL.x, by - hh + hh * BOWL.y, hw * 0.3, 0.75);
}
const PUFFS = (() => {
  const rng = mulberry32(41);
  return Array.from({ length: 26 }, () => ({ x: rng(), y: rng(), r: 0.06 + rng() * 0.12, sp: 0.008 + rng() * 0.016, ph: rng() * 6.28, o: 0.05 + rng() * 0.09 }));
})();
function drawSmoke(cv: HTMLCanvasElement, time: number) {
  const { ctx, w, h } = fit(cv);
  ctx.clearRect(0, 0, w, h);
  ctx.globalCompositeOperation = "lighter";
  for (const p of PUFFS) {
    const y = (((p.y - time * p.sp) % 1) + 1) % 1;
    const x = p.x + Math.sin(time * 0.4 + p.ph) * 0.05;
    const r = p.r * Math.min(w, h) * 1.6;
    const g = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, r);
    g.addColorStop(0, `rgba(214,203,190,${p.o})`); g.addColorStop(1, "rgba(214,203,190,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x * w, y * h, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}

/* 02: the exhale. The state at any frame is computed, never stored, so scrubbing backward is exact. */
const PARTICLES = (() => {
  const rng = mulberry32(2718);
  return Array.from({ length: 210 }, () => ({
    birth: rng() * 0.74, x: (rng() - 0.5) * 0.05, rise: 0.18 + rng() * 0.26, drift: (rng() - 0.5) * 0.85,
    r0: 0.022 + rng() * 0.03, grow: 0.075 + rng() * 0.14, wob: 1.2 + rng() * 2.6, ph: rng() * 6.28, o: 0.07 + rng() * 0.055,
  }));
})();
function drawSequence(cv: HTMLCanvasElement, t: number, hookah: HTMLImageElement | null) {
  const { ctx, w, h } = fit(cv);
  ctx.fillStyle = "#0C0908"; ctx.fillRect(0, 0, w, h);
  // room falloff so the plume has something to sit in
  const amb = ctx.createRadialGradient(w / 2, h * 0.8, 0, w / 2, h * 0.8, Math.max(w, h) * 0.55);
  amb.addColorStop(0, "rgba(58,38,20,.42)"); amb.addColorStop(1, "rgba(12,9,8,0)");
  ctx.fillStyle = amb; ctx.fillRect(0, 0, w, h);
  const base = Math.min(w, h);
  let srcY = h * 0.4;
  if (hookah) {
    const hh = h * 0.6, hw = (hh * hookah.width) / hookah.height, top = h * 0.995 - hh;
    ctx.drawImage(hookah, w / 2 - hw / 2, top, hw, hh);
    srcY = top + hh * BOWL.y;
    ember(ctx, w / 2 - hw / 2 + hw * BOWL.x, srcY, hw * 0.26, 0.55 + 0.45 * t);
  }
  // normal compositing, not "lighter": overlapping puffs settle toward the
  // smoke colour instead of clipping to white the way an additive plume does
  for (const p of PARTICLES) {
    const age = t * 1.3 - p.birth;
    if (age <= 0) continue;
    const y = srcY - age * p.rise * h;
    const x = w / 2 + p.x * w + p.drift * w * (0.2 * age + 0.62 * age * age) + Math.sin(age * p.wob + p.ph) * w * 0.038 * age;
    const r = (p.r0 + age * p.grow) * base;
    const a = p.o * clamp(age * 2.2, 0, 1) * clamp(1.35 - age * 0.55, 0, 1);
    if (a <= 0.002) continue;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(219,210,198,${a.toFixed(4)})`); g.addColorStop(0.45, `rgba(198,188,175,${(a * 0.5).toFixed(4)})`); g.addColorStop(1, "rgba(190,180,167,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  // the room itself hazing over as the plume accumulates
  const haze = ctx.createLinearGradient(0, 0, 0, srcY);
  haze.addColorStop(0, `rgba(188,178,166,${0.28 * t})`); haze.addColorStop(1, "rgba(188,178,166,0)");
  ctx.fillStyle = haze; ctx.fillRect(0, 0, w, srcY);
}

/* 03: day to night, one draw lerped from 6500K to 2200K */
function drawRoom(cv: HTMLCanvasElement, n: number, bar: HTMLImageElement | null) {
  const { ctx, w, h } = fit(cv);
  ctx.fillStyle = "#0C0908"; ctx.fillRect(0, 0, w, h);
  if (!bar) return;
  ctx.filter = `brightness(${lerp(1.2, 0.4, n).toFixed(3)}) saturate(${lerp(0.92, 1.14, n).toFixed(3)}) contrast(${lerp(0.94, 1.1, n).toFixed(3)})`;
  cover(ctx, bar, w, h);
  ctx.filter = "none";
  // 6500K daylight through the doorway, or 2200K tungsten off the shelf
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = n < 0.5 ? `rgba(148,194,232,${(0.34 * (1 - n * 2)).toFixed(3)})` : `rgba(255,140,44,${(0.32 * ((n - 0.5) * 2)).toFixed(3)})`;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
  if (n < 1) {
    const day = ctx.createRadialGradient(w * 0.9, h * 0.42, 0, w * 0.9, h * 0.42, Math.max(w, h) * 0.5);
    day.addColorStop(0, `rgba(226,240,252,${(0.3 * (1 - n)).toFixed(3)})`); day.addColorStop(1, "rgba(226,240,252,0)");
    ctx.fillStyle = day; ctx.fillRect(0, 0, w, h);
  }
  // the bar's own practicals only start to matter after dark
  if (n > 0) {
    ctx.globalCompositeOperation = "lighter";
    for (const [px, py, pr] of PRACTICALS) {
      const r2 = pr * Math.max(w, h) * 1.25;
      const g = ctx.createRadialGradient(px * w, py * h, 0, px * w, py * h, r2);
      g.addColorStop(0, `rgba(255,178,92,${(0.3 * n).toFixed(3)})`); g.addColorStop(0.5, `rgba(232,132,52,${(0.1 * n).toFixed(3)})`); g.addColorStop(1, "rgba(232,132,52,0)");
      ctx.fillStyle = g; ctx.fillRect(px * w - r2, py * h - r2, r2 * 2, r2 * 2);
    }
    ctx.globalCompositeOperation = "source-over";
  }
  // glow bleeding off the sign band once the tubes are lit
  if (n > 0.45) {
    const sg = ctx.createRadialGradient(w / 2, h * 0.19, 0, w / 2, h * 0.19, w * 0.42);
    sg.addColorStop(0, `rgba(255,178,92,${((0.2 * (n - 0.45)) / 0.55).toFixed(3)})`); sg.addColorStop(1, "rgba(255,178,92,0)");
    ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h);
  }
  // scrims so the sign and the readouts hold on the busy plate, day or night
  const topS = ctx.createLinearGradient(0, 0, 0, h * 0.38);
  topS.addColorStop(0, `rgba(12,9,8,${lerp(0.5, 0.72, n).toFixed(3)})`); topS.addColorStop(1, "rgba(12,9,8,0)");
  ctx.fillStyle = topS; ctx.fillRect(0, 0, w, h * 0.38);
  const botS = ctx.createLinearGradient(0, h, 0, h * 0.72);
  botS.addColorStop(0, `rgba(12,9,8,${lerp(0.6, 0.82, n).toFixed(3)})`); botS.addColorStop(1, "rgba(12,9,8,0)");
  ctx.fillStyle = botS; ctx.fillRect(0, h * 0.72, w, h * 0.28);
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * (0.62 - n * 0.24), w / 2, h / 2, Math.max(w, h) * 0.78);
  vg.addColorStop(0, "rgba(12,9,8,0)"); vg.addColorStop(1, `rgba(12,9,8,${(0.28 + n * 0.46).toFixed(3)})`);
  ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
}

const load = (src: string) => new Promise<HTMLImageElement | null>((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });

interface Props {
  /** the headline's level: h1 when the scenes open a page, h2 inside a chapter */
  as?: "h1" | "h2";
  id?: string;
  /** the chapter rail entry and the header's sense of where it is; left out on a page of their own */
  number?: string;
  title?: string;
  nav?: string;
  eyebrow?: string;
  cta?: { href: string; label: string; cursor: string };
}

export function BarScenes({ as: Tag = "h2", id = "bar", number, title, nav, eyebrow = "04 — The Bar · Hookah Lounge", cta = { href: "/bar", label: "Visit the Bar", cursor: "EXPLORE" } }: Props = {}) {
  const section = useRef<HTMLElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLDivElement>(null);
  const mid = useRef<HTMLDivElement>(null);
  const smokeLayer = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);
  const cBack = useRef<HTMLCanvasElement>(null);
  const cMid = useRef<HTMLCanvasElement>(null);
  const cSmoke = useRef<HTMLCanvasElement>(null);
  const cFront = useRef<HTMLCanvasElement>(null);
  const fx2 = useRef<HTMLDivElement>(null);
  const stage2 = useRef<HTMLDivElement>(null);
  const cSeq = useRef<HTMLCanvasElement>(null);
  const mark = useRef<HTMLHeadingElement>(null);
  const sub = useRef<HTMLParagraphElement>(null);
  const frameNum = useRef<HTMLElement>(null);
  const fx3 = useRef<HTMLDivElement>(null);
  const stage3 = useRef<HTMLDivElement>(null);
  const cRoom = useRef<HTMLCanvasElement>(null);
  const neon = useRef<HTMLHeadingElement>(null);
  const kelvin = useRef<HTMLElement>(null);
  const service = useRef<HTMLElement>(null);
  const roomstate = useRef<HTMLElement>(null);

  useEffect(() => {
    const sec = section.current;
    if (!sec) return;
    const reduced = reducedMotion();
    const small = window.innerWidth < 640;
    const img: { bar: HTMLImageElement | null; hookah: HTMLImageElement | null } = { bar: null, hookah: null };
    let seqT = reduced ? 0.62 : 0, roomN = reduced ? 1 : 0;
    let alive = true;

    const paintSeq = () => {
      drawSequence(cSeq.current!, seqT, img.hookah);
      stage2.current!.dataset.t = seqT.toFixed(3);
      frameNum.current!.textContent = String(Math.round(seqT * (SEQ_COUNT - 1))).padStart(2, "0");
      // under reduced motion the name is simply up and the line legible, whatever the frame
      const reveal = reduced ? 1 : clamp((seqT - 0.34) / 0.5, 0, 1);
      mark.current!.style.opacity = (0.22 + reveal * 0.78).toFixed(3);
      mark.current!.style.filter = `blur(${(9 - reveal * 9).toFixed(2)}px)`;
      sub.current!.style.opacity = (0.3 + reveal * 0.7).toFixed(3);
      sub.current!.textContent = seqT < 0.3 ? "Exhale" : seqT < 0.7 ? "Double apple · mint" : "Swad Satkar";
    };
    const paintRoom = () => {
      drawRoom(cRoom.current!, roomN, img.bar);
      stage3.current!.dataset.t = roomN.toFixed(3);
      kelvin.current!.textContent = `${Math.round(lerp(6500, 2200, roomN))}K`;
      service.current!.textContent = roomN < 0.34 ? "Lunch" : roomN < 0.72 ? "Sundown" : "Late bar";
      roomstate.current!.textContent = roomN < 0.5 ? "Restro" : "Lounge";
      const lit = clamp((roomN - 0.45) / 0.45, 0, 1);
      neon.current!.style.clipPath = `inset(0 ${((1 - lit) * 100).toFixed(1)}% 0 0)`;
      const flick = roomN > 0.93 ? 0.86 + Math.sin(roomN * 420) * 0.14 : 1;
      neon.current!.style.textShadow = `0 0 ${(18 * lit * flick).toFixed(1)}px rgba(255,180,90,${(0.85 * lit * flick).toFixed(2)}), 0 0 ${(46 * lit * flick).toFixed(1)}px rgba(227,164,79,${(0.5 * lit * flick).toFixed(2)})`;
    };
    const paintAll = () => {
      drawBack(cBack.current!, img.bar);
      drawMid(cMid.current!);
      drawFront(cFront.current!, img.hookah);
      paintSeq();
      paintRoom();
    };
    paintAll();

    const { gsap, ScrollTrigger } = getGsap();
    Promise.all([load(BAR), load(HOOKAH)]).then(([bar, hookah]) => {
      if (!alive) return;
      img.bar = bar; img.hookah = hookah;
      paintAll();
      ScrollTrigger.refresh();
    });

    // the drift of smoke over the first scene: on its own clock, only while
    // the scene is on screen, and not at all under reduced motion
    let raf = 0, t0 = performance.now();
    const loop = (now: number) => { drawSmoke(cSmoke.current!, (now - t0) / 1000); raf = requestAnimationFrame(loop); };
    if (reduced) drawSmoke(cSmoke.current!, 0);
    const io = new IntersectionObserver(([e]) => {
      if (reduced) return;
      if (e.isIntersecting && !raf) { t0 = performance.now() - 1000; raf = requestAnimationFrame(loop); }
      else if (!e.isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0; }
    });
    io.observe(hero.current!);

    let resizeTimer = 0;
    const onResize = () => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => { paintAll(); ScrollTrigger.refresh(); }, 160); };
    window.addEventListener("resize", onResize);

    let ctx: ReturnType<typeof gsap.context> | undefined;
    if (!reduced) {
      ctx = gsap.context(() => {
        const past = { trigger: hero.current, start: "top top", end: "bottom top", scrub: 1 } as const;
        gsap.to(back.current, { yPercent: 9, ease: "none", scrollTrigger: past });
        gsap.to(mid.current, { yPercent: 3, ease: "none", scrollTrigger: past });
        gsap.to(smokeLayer.current, { yPercent: -6, ease: "none", scrollTrigger: past });
        gsap.to(front.current, { yPercent: -12, ease: "none", scrollTrigger: { ...past, onUpdate: (self) => { hero.current!.dataset.t = self.progress.toFixed(3); } } });
        ScrollTrigger.create({
          trigger: fx2.current, start: "top top", end: `+=${small ? 160 : 260}%`, pin: stage2.current, scrub: 1, anticipatePin: 1,
          onUpdate: (self) => { seqT = self.progress; paintSeq(); },
        });
        ScrollTrigger.create({
          trigger: fx3.current, start: "top top", end: `+=${small ? 180 : 280}%`, pin: stage3.current, scrub: 1, anticipatePin: 1,
          onUpdate: (self) => { roomN = self.progress; paintRoom(); },
        });
      });
    }
    return () => {
      alive = false;
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
      ctx?.revert();
    };
  }, []);

  return (
    <section ref={section} id={id} data-scene data-number={number} data-title={title} data-nav={nav} data-theme="dark" data-bg="#0C0908" className="barlab" aria-labelledby={`${id}-title`}>
      {/* 01 the back bar, three planes deep */}
      <div ref={hero} className="bl-hero">
        <div ref={back} className="bl-layer bl-back"><canvas ref={cBack} /></div>
        <div ref={mid} className="bl-layer bl-mid"><canvas ref={cMid} /></div>
        <div ref={smokeLayer} className="bl-layer bl-smoke"><canvas ref={cSmoke} /></div>
        <div ref={front} className="bl-layer bl-front"><canvas ref={cFront} /></div>
        <div aria-hidden className="bl-veil" />
        <div className="bl-copy">
          <p className="bl-eyebrow">{eyebrow}</p>
          <Tag id={`${id}-title`} className="bl-display">Sekuwa on the grill.<br />Coal on the <em>bowl.</em></Tag>
          <p className="bl-lede">Good food, good company, and an atmosphere worth staying for.</p>
          <div className="bl-row">
            <Magnetic><Link href={cta.href} data-cursor={cta.cursor} className="btn btn-ghost-gold bl-btn px-8"><span className="btn-text">{cta.label}</span><span className="arrow" aria-hidden>→</span></Link></Magnetic>
            <p className="bl-cue motion-reduce:hidden"><span aria-hidden />Scroll to drive</p>
          </div>
        </div>
      </div>

      {/* 02 the exhale */}
      <div ref={fx2} className="bl-scene">
        <div ref={stage2} className="bl-stage bl-stage-2" data-t="0" role="img" aria-label="Smoke leaving the hookah's coal and filling the room, and the name Swad Satkar coming up out of the haze">
          <canvas ref={cSeq} />
          <div className="bl-smoke-copy">
            <h3 ref={mark} className="bl-mark">Swad Satkar</h3>
          </div>
          <p ref={sub} className="bl-sub" aria-hidden>Exhale</p>
          <div className="bl-readout" aria-hidden>FRAME <b ref={frameNum}>00</b> / {SEQ_COUNT}</div>
        </div>
      </div>

      {/* 03 day to night */}
      <div ref={fx3} className="bl-scene">
        <div ref={stage3} className="bl-stage" data-t="0" role="img" aria-label="The bar going from daylight to night, the shelf lights coming on and the Swad Satkar sign lighting up">
          <canvas ref={cRoom} />
          <div className="bl-room-copy">
            <div className="bl-neon-block">
              <div className="bl-neon-wrap">
                <h3 ref={neon} className="bl-neon">Swad Satkar</h3>
                <h3 className="bl-neon bl-neon-ghost" aria-hidden>Swad Satkar</h3>
              </div>
            </div>
            <div className="bl-kelvin" aria-hidden>
              <div>Colour temp<b ref={kelvin}>6500K</b></div>
              <div>Service<b ref={service}>Lunch</b></div>
              <div>Room<b ref={roomstate}>Restro</b></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
