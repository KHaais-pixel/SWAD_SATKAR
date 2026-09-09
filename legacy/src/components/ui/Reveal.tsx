"use client";
import type { ReactNode } from "react";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/cn";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds, matching the old motion API */
  delay?: number;
}

/**
 * Fade-up on enter, done with a CSS transition and an IntersectionObserver.
 * Under prefers-reduced-motion the global reset collapses it to a plain fade.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn("reveal", inView && "is-in", className)}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
