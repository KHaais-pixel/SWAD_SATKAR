"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { site, type GalleryItem } from "@/data/site";
import { getGsap, reducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/cn";

/**
 * The gallery page: the house's photographs in albums.
 *
 *   the header     the newest stills crossfading slowly behind the title
 *   the chips      one per album, with a count; the sticky bar under the header
 *   the columns    a masonry of tiles, the shortest column taking the next
 *                  photograph; the columns drift at different rates with the
 *                  scroll, and the whole grid leans on a hard scroll
 *   the viewer     a tile grows into place in the middle of the screen, and
 *                  shrinks back to where it came from
 *
 * What is in it is decided in the staff panel, never here: this is the
 * visitors' view only. Under prefers-reduced-motion nothing drifts, leans
 * or crossfades.
 */

const pad2 = (n: number) => String(n).padStart(2, "0");
const colCount = (w: number) => (w < 620 ? 1 : w < 980 ? 2 : w < 1400 ? 3 : 4);
const idOf = (g: GalleryItem) => g.id || g.src;
interface Props { items: GalleryItem[] }

export function GalleryAlbum({ items }: Props) {
  const [filter, setFilter] = useState("*");
  const [cols, setCols] = useState(3);
  const [open, setOpen] = useState(-1);
  const [ready, setReady] = useState(false);
  const [plate, setPlate] = useState(0);

  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const gallery = useRef<HTMLElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const chrome = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<Element | null>(null);
  const reduced = useRef(false);

  /* what is on screen */
  const albums = useMemo(() => { const m = new Map<string, number>(); items.forEach((g) => m.set(g.album || "Untitled", (m.get(g.album || "Untitled") || 0) + 1)); return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])); }, [items]);
  const view = useMemo(() => (filter === "*" ? items : items.filter((g) => (g.album || "Untitled") === filter)), [items, filter]);
  useEffect(() => { if (filter !== "*" && !albums.some(([a]) => a === filter)) setFilter("*"); }, [albums, filter]);
  const columns = useMemo(() => {
    const out: Array<Array<{ g: GalleryItem; i: number }>> = Array.from({ length: cols }, () => []);
    const heights = new Array<number>(cols).fill(0);
    view.forEach((g, i) => { let s = 0; for (let c = 1; c < cols; c++) if (heights[c] < heights[s]) s = c; heights[s] += g.h / g.w; out[s].push({ g, i }); });
    return out;
  }, [view, cols]);
  const plates = useMemo(() => items.slice(-5), [items]);

  /* the size of the screen */
  useEffect(() => {
    reduced.current = reducedMotion();
    const size = () => setCols(colCount(window.innerWidth));
    size();
    window.addEventListener("resize", size);
    setReady(true);
    return () => window.removeEventListener("resize", size);
  }, []);

  /* the header's crossfade */
  useEffect(() => {
    if (plates.length < 2 || reduced.current) return;
    const t = window.setInterval(() => setPlate((p) => (p + 1) % plates.length), 5200);
    return () => window.clearInterval(t);
  }, [plates]);

  /* the drift of the columns, and the lean */
  useEffect(() => {
    if (!ready || reduced.current || !grid.current) return;
    const { gsap, ScrollTrigger } = getGsap();
    const ctx = gsap.context(() => {
      const colEls = Array.from(grid.current!.querySelectorAll<HTMLElement>(".gal-col"));
      colEls.forEach((col, i) => {
        if (i === 0) return;
        const amt = i % 2 === 1 ? 52 : 96;
        gsap.fromTo(col, { y: amt }, { y: -amt, ease: "none", scrollTrigger: { trigger: gallery.current, start: "top bottom", end: "bottom top", scrub: 0.6 } });
      });
      const skew = gsap.quickTo(grid.current, "skewY", { duration: 0.55, ease: "power3" });
      ScrollTrigger.create({ start: 0, end: "max", onUpdate: (s) => skew(gsap.utils.clamp(-2, 2, s.getVelocity() / -1400)) });
    }, root);
    const late = window.setTimeout(() => ScrollTrigger.refresh(), 500);
    return () => { window.clearTimeout(late); ctx.revert(); };
  }, [ready, cols, view]);

  /* the viewer */
  const fitTo = (w: number, h: number) => {
    const vw = window.innerWidth * (window.innerWidth < 700 ? 0.94 : 0.88), vh = window.innerHeight * 0.82;
    const sc = Math.min(vw / w, vh / h), tw = w * sc, th = h * sc;
    return { left: (window.innerWidth - tw) / 2, top: (window.innerHeight - th) / 2, width: tw, height: th };
  };
  const tileRect = (i: number) => root.current?.querySelector<HTMLElement>(`.gal-tile[data-i="${i}"] .gal-media`)?.getBoundingClientRect() ?? null;
  const openViewer = (i: number) => {
    if (open >= 0) return;
    lastFocus.current = document.activeElement;
    setOpen(i);
    const it = view[i], r = tileRect(i) || { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 10, height: 10 };
    const { gsap } = getGsap();
    const t = fitTo(it.w, it.h), q = reduced.current;
    window.__lenis?.stop();
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      gsap.set(stage.current, { left: r.left, top: r.top, width: r.width, height: r.height, opacity: 1, x: 0 });
      gsap.to(backdrop.current, { opacity: 1, duration: q ? 0 : 0.35, ease: "power2.out" });
      gsap.to(stage.current, { left: t.left, top: t.top, width: t.width, height: t.height, duration: q ? 0 : 0.62, ease: "expo.out", onComplete: () => closeBtn.current?.focus() });
      gsap.to(chrome.current, { opacity: 1, duration: 0.3, delay: q ? 0 : 0.32 });
    });
  };
  const step = useCallback((dir: number) => {
    if (open < 0 || view.length < 2) return;
    const next = (open + dir + view.length) % view.length;
    const { gsap } = getGsap();
    const it = view[next], t = fitTo(it.w, it.h), q = reduced.current;
    gsap.to(stage.current, { opacity: 0, x: dir * 36, duration: q ? 0 : 0.18, ease: "power2.in", onComplete: () => {
      setOpen(next);
      gsap.set(stage.current, { x: -dir * 36 });
      gsap.to(stage.current, { left: t.left, top: t.top, width: t.width, height: t.height, duration: q ? 0 : 0.34, ease: "power3.out" });
      gsap.to(stage.current, { opacity: 1, x: 0, duration: q ? 0 : 0.28, ease: "power2.out" });
    } });
  }, [open, view]);
  const close = useCallback(() => {
    if (open < 0) return;
    const { gsap } = getGsap();
    const r = tileRect(open), q = reduced.current;
    const done = () => {
      setOpen(-1);
      document.body.style.overflow = "";
      window.__lenis?.start();
      (lastFocus.current as HTMLElement | null)?.focus?.();
    };
    gsap.to(chrome.current, { opacity: 0, duration: 0.18 });
    gsap.to(backdrop.current, { opacity: 0, duration: q ? 0 : 0.4, delay: q ? 0 : 0.1 });
    if (r) gsap.to(stage.current, { left: r.left, top: r.top, width: r.width, height: r.height, x: 0, duration: q ? 0 : 0.5, ease: "expo.inOut", onComplete: done });
    else gsap.to(stage.current, { opacity: 0, scale: 0.92, duration: q ? 0 : 0.3, onComplete: done });
  }, [open]);
  useEffect(() => {
    if (open < 0) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); else if (e.key === "ArrowRight") step(1); else if (e.key === "ArrowLeft") step(-1); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step, close]);
  const swipe = useRef<number | null>(null);

  const current = open >= 0 ? view[open] : null;
  const photos = items.length;
  return (
    <div ref={root} className="gal">
      {/* the header */}
      <header className="gal-top">
        <div className="gal-plate" aria-hidden>
          {plates.map((g, i) => (
            <div key={idOf(g)} className={cn("gal-plate-img", i === plate % Math.max(1, plates.length) && "on")}>
              <Image src={g.src} alt="" fill sizes="100vw" priority={i === 0} className="object-cover" />
            </div>
          ))}
        </div>
        <div className="gal-veil" aria-hidden />
        <div className="gal-wrap gal-top-inner">
          <div>
            <p className="gal-eyebrow">{site.name} · <span lang="ne" className="gal-deva">{site.nameDevanagari}</span></p>
            <h1 className="gal-h1">The Gallery</h1>
          </div>
          <div className="gal-side">
            <div><b>{pad2(photos)}</b> {photos === 1 ? "photograph" : "photographs"}</div>
            <div>{albums.length} {albums.length === 1 ? "album" : "albums"}</div>
          </div>
        </div>
      </header>

      {/* the chips and the owner's switch */}
      <div ref={bar} className="gal-bar">
        <div className="gal-wrap gal-bar-inner">
          <div className="gal-chips" role="group" aria-label="Albums">
            <button type="button" className="gal-chip" aria-pressed={filter === "*"} onClick={() => setFilter("*")}>All<span className="c">{items.length}</span></button>
            {albums.map(([a, n]) => (
              <button key={a} type="button" className="gal-chip" aria-pressed={filter === a} onClick={() => { setFilter(a); window.scrollTo({ top: (bar.current?.offsetTop ?? 0), behavior: reduced.current ? "auto" : "smooth" }); }}>{a}<span className="c">{n}</span></button>
            ))}
          </div>
        </div>
      </div>

      {/* the columns */}
      <section ref={gallery} className="gal-gallery" aria-label="Photographs">
        <div className="gal-wrap">
          <div ref={grid} className="gal-grid">
            {columns.map((col, c) => (
              <div key={c} className="gal-col">
                {col.map(({ g, i }) => (
                  <article key={idOf(g)} className="gal-tile" data-i={i}>
                    <div className="gal-media" style={{ paddingBottom: `${((g.h / g.w) * 100).toFixed(2)}%` }}>
                      <Image src={g.src} alt={g.alt} width={g.w} height={g.h} sizes={`(min-width: 1400px) 22vw, (min-width: 980px) 30vw, (min-width: 620px) 46vw, 94vw`} className="gal-img" />
                    </div>
                    <div className="gal-shade" aria-hidden />
                    <div className="gal-cap" aria-hidden><span className="al">{g.album || "Untitled"}</span>{g.note || g.alt}</div>
                    <button type="button" className="gal-open" data-cursor="VIEW" aria-label={`Open: ${g.alt}`} onClick={() => openViewer(i)} />
                  </article>
                ))}
              </div>
            ))}
          </div>
          {view.length === 0 && (
            <div className="gal-empty">
              <div className="big">Nothing in this album yet.</div>
              <div>Photographs are added in the staff panel.</div>
            </div>
          )}
        </div>
      </section>

      {/* the viewer */}
      <div
        className={cn("gal-lb", open >= 0 && "on")}
        role="dialog"
        aria-modal="true"
        aria-label={current ? current.alt : "Photograph viewer"}
        aria-hidden={open < 0}
        onPointerDown={(e) => { swipe.current = e.clientX; }}
        onPointerUp={(e) => { if (swipe.current === null) return; const d = e.clientX - swipe.current; swipe.current = null; if (Math.abs(d) > 60) step(d < 0 ? 1 : -1); }}
      >
        <div ref={backdrop} className="gal-backdrop" onClick={close} />
        <div ref={stage} className="gal-stage">
          {current && <Image src={current.src} alt={current.alt} fill sizes="90vw" quality={88} className="object-contain" />}
        </div>
        <div ref={chrome} className="gal-chrome">
          <button type="button" className="gal-nav prev" onClick={() => step(-1)} aria-label="Previous"><svg viewBox="0 0 24 24" aria-hidden><path d="M15 5l-7 7 7 7" /></svg></button>
          <button type="button" className="gal-nav next" onClick={() => step(1)} aria-label="Next"><svg viewBox="0 0 24 24" aria-hidden><path d="M9 5l7 7-7 7" /></svg></button>
          <button ref={closeBtn} type="button" className="gal-close" onClick={close} aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden><path d="M5 5l14 14M19 5L5 19" /></svg></button>
          <div className="gal-meta">
            <div><div className="al">{current?.album || "Untitled"}</div><div className="alt">{current?.note || current?.alt}</div></div>
            <div className="count">{open >= 0 ? `${pad2(open + 1)} / ${pad2(view.length)}` : ""}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
