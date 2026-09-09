"use client";
import { useEffect, useRef } from "react";
import { getGsap, reducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/cn";

/**
 * An editorial headline that rises into view line by line, each line
 * clipped by its own box. Give it the lines; it keeps them as text, so a
 * screen reader hears the sentence and nothing is split into letters.
 */
export function AnimatedHeading({ as: Tag = "h2", lines, className, delay = 0.15, id }: { as?: "h1" | "h2" | "h3"; lines: string[]; className?: string; delay?: number; id?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const { gsap } = getGsap();
    const parts = el.querySelectorAll<HTMLElement>("[data-line-inner]");
    const ctx = gsap.context(() => {
      gsap.fromTo(parts, { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: "power3.out", stagger: 0.11, delay, scrollTrigger: { trigger: el, start: "top 85%", once: true } });
    });
    return () => ctx.revert();
  }, [delay]);
  return (
    <Tag ref={ref} id={id} className={cn("heading-lines", className)}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          <span data-line-inner className="block will-change-transform">{line}</span>
        </span>
      ))}
    </Tag>
  );
}
