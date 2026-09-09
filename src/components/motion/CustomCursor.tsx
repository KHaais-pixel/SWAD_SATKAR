"use client";
import { useEffect, useRef, useState } from "react";
import { getGsap, finePointer, reducedMotion } from "@/lib/gsap";

/**
 * A small ring that follows the pointer and opens into a word over the
 * things that want one: VIEW on a plate, OPEN on a photograph, EXPLORE on a
 * menu, RESERVE on the booking button. Marked with data-cursor="WORD".
 * Never intercepts a click, and does not exist for fingers or under reduced
 * motion.
 */
export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!finePointer() || reducedMotion()) return;
    const { gsap } = getGsap();
    const d = dot.current, r = ring.current;
    if (!d || !r) return;
    d.dataset.on = r.dataset.on = "1";
    document.documentElement.classList.add("has-cursor");
    const dx = gsap.quickTo(d, "x", { duration: 0.12, ease: "power2.out" }), dy = gsap.quickTo(d, "y", { duration: 0.12, ease: "power2.out" });
    const rx = gsap.quickTo(r, "x", { duration: 0.42, ease: "power3.out" }), ry = gsap.quickTo(r, "y", { duration: 0.42, ease: "power3.out" });
    let current = "";
    const onMove = (e: PointerEvent) => {
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      const host = (e.target as Element | null)?.closest<HTMLElement>("[data-cursor]");
      const word = host?.dataset.cursor || "";
      const interactive = !!host || !!(e.target as Element | null)?.closest("a, button, [role=button], input, select, textarea, label");
      if (word !== current) { current = word; setLabel(word); }
      r.dataset.state = word ? "word" : interactive ? "hover" : "";
    };
    const onLeave = () => { r.dataset.state = "off"; };
    const onEnter = () => { r.dataset.state = ""; };
    const onDown = () => r.classList.add("is-down");
    const onUp = () => r.classList.remove("is-down");
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <>
      <div ref={dot} aria-hidden className="cursor-dot" />
      <div ref={ring} aria-hidden className="cursor-ring">
        <span className="cursor-word">{label}</span>
      </div>
    </>
  );
}
