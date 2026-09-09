"use client";
import { useEffect, useRef } from "react";
import { getGsap, finePointer, reducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/cn";

/** A button that leans a few pixels toward the pointer and springs back. Wrap a single link or button. */
export function Magnetic({ children, className, strength = 0.22, max = 8 }: { children: React.ReactNode; className?: string; strength?: number; max?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const wrap = ref.current;
    const el = wrap?.firstElementChild as HTMLElement | null;
    if (!wrap || !el || !finePointer() || reducedMotion()) return;
    const { gsap } = getGsap();
    const x = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * strength, dy = (e.clientY - (r.top + r.height / 2)) * strength;
      x(Math.max(-max, Math.min(max, dx))); y(Math.max(-max, Math.min(max, dy)));
    };
    const leave = () => { gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.55)" }); };
    wrap.addEventListener("pointermove", move);
    wrap.addEventListener("pointerleave", leave);
    return () => { wrap.removeEventListener("pointermove", move); wrap.removeEventListener("pointerleave", leave); };
  }, [strength, max]);
  return <span ref={ref} className={cn("inline-block p-2 -m-2", className)}>{children}</span>;
}
