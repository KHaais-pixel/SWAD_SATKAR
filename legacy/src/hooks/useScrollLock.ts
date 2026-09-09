"use client";
import { useEffect } from "react";

/** Locks page scroll (and Lenis) while `locked`. */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const { body, documentElement } = document;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    window.__lenis?.stop();
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
      window.__lenis?.start();
    };
  }, [locked]);
}
