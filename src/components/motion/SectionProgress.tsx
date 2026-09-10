"use client";
import { useEffect, useState } from "react";
import { getGsap, reducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/cn";

interface Item { id: string; n: string; title: string }

/**
 * The seven chapters of the home page, down the right edge: the one in view
 * turns gold and shows its name with a line that fills as you read it.
 * Clicking one takes you there. Hidden on narrow screens.
 */
export function SectionProgress() {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState("");
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const scenes = Array.from(document.querySelectorAll<HTMLElement>("[data-scene][data-number]"));
    setItems(scenes.map((s) => ({ id: s.id, n: s.dataset.number!, title: s.dataset.title || "" })));
    if (reducedMotion()) return;
    const { gsap, ScrollTrigger } = getGsap();
    const ctx = gsap.context(() => {
      scenes.forEach((s) => {
        ScrollTrigger.create({
          trigger: s, start: "top 50%", end: "bottom 50%",
          onToggle: (self) => { if (self.isActive) setActive(s.id); },
          onUpdate: (self) => { if (self.isActive) setProgress(self.progress); },
        });
      });
    });
    return () => ctx.revert();
  }, []);
  if (!items.length) return null;
  const current = items.find((i) => i.id === active);
  return (
    <nav aria-label="Sections" className="fixed right-[clamp(12px,1.6vw,24px)] top-1/2 z-50 hidden -translate-y-1/2 items-center gap-3 min-[1100px]:flex">
      {current && (
        <span aria-hidden className="flex items-center gap-2 [writing-mode:vertical-rl]">
          <span className="whitespace-nowrap font-mono text-[10.5px] tracking-[0.24em] text-gold-ink transition-opacity duration-700">{current.n} — {current.title}</span>
          <span className="block h-[72px] w-px bg-navy/15">
            <span className="block w-full origin-top bg-gold-deep transition-transform duration-200 ease-linear" style={{ height: "100%", transform: `scaleY(${progress.toFixed(3)})` }} />
          </span>
        </span>
      )}
      <ul className="flex flex-col items-end gap-[1px]">
        {items.map((it) => {
          const isOn = it.id === active;
          return (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                aria-current={isOn ? "true" : undefined}
                aria-label={`${it.n} ${it.title}`}
                onClick={(e) => { e.preventDefault(); const el = document.getElementById(it.id); if (!el) return; if (window.__lenis) window.__lenis.scrollTo(el, { offset: -40 }); else el.scrollIntoView({ behavior: "smooth" }); }}
                className={cn("group flex min-h-6 items-center gap-[8px] py-[4px] font-mono tracking-[0.22em] transition-[color,font-size] duration-500", isOn ? "text-[11.5px] text-gold-ink" : "text-[10.5px] text-navy/70 hover:text-navy")}
              >
                <span>{it.n}</span>
                <span className={cn("block h-px transition-[width,background-color] duration-500", isOn ? "w-5 bg-gold-deep" : "w-2 bg-navy/30 group-hover:bg-navy")} />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
