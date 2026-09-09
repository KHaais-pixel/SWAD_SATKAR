"use client";
import { useEffect, useRef } from "react";
import { getGsap, finePointer, reducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/cn";

/**
 * A card that leans two degrees toward the pointer, with its picture
 * shifting the other way for depth, and settles back when the pointer
 * leaves. The picture is whatever inside carries data-tilt-img. Fingers
 * and reduced motion get the plain card.
 */
export function TiltCard({ as: Tag = "div", className, children, ...rest }: { as?: "div" | "figure" | "article"; className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !finePointer() || reducedMotion()) return;
    const { gsap } = getGsap();
    const img = el.querySelector<HTMLElement>("[data-tilt-img]");
    gsap.set(el, { transformPerspective: 900 });
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });
    const ix = img ? gsap.quickTo(img, "x", { duration: 0.8, ease: "power3.out" }) : null;
    const iy = img ? gsap.quickTo(img, "y", { duration: 0.8, ease: "power3.out" }) : null;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      rx(-py * 4); ry(px * 4);
      ix?.(-px * 10); iy?.(-py * 10);
    };
    const leave = () => { rx(0); ry(0); ix?.(0); iy?.(0); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Any = Tag as any;
  return (
    <Any ref={ref} className={cn("tilt-card", className)} {...rest}>
      {children}
    </Any>
  );
}
