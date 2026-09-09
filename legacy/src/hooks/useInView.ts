"use client";
import { useEffect, useRef, useState } from "react";

/**
 * One-shot IntersectionObserver. Used instead of a motion library so the
 * scroll reveals cost nothing in the first-load bundle.
 */
export function useInView<T extends HTMLElement>(rootMargin = "-10% 0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
