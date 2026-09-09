"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { getGsap, reducedMotion, motionScale } from "@/lib/gsap";
import { cn } from "@/lib/cn";

interface Props {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  /** how far the picture slides against the scroll, in px each way */
  drift?: number;
  /** how much larger it is drawn than its frame, so the slide never shows an edge */
  scale?: number;
  /** enter with a slow settle from slightly larger */
  reveal?: boolean;
  /** the cursor's word over it */
  cursor?: string;
  className?: string;
  imgClassName?: string;
  style?: React.CSSProperties;
}

/**
 * A photograph floating in its frame. The frame clips; inside it the picture
 * slides a little against the scroll and sits slightly enlarged, with a
 * touch of momentum from the page's velocity. On arrival it settles from
 * 1.05 to 1. Transforms only; nothing that lays out.
 */
export function ParallaxImage({ src, alt, width, height, fill, sizes, priority, drift = 40, scale = 1.08, reveal = true, cursor, className, imgClassName, style }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const f = frame.current, el = inner.current;
    if (!f || !el || reducedMotion()) return;
    const { gsap } = getGsap();
    const k = motionScale();
    const ctx = gsap.context(() => {
      if (reveal) {
        gsap.fromTo(el, { scale: scale + 0.05, opacity: 0 }, { scale, opacity: 1, duration: 1.4, ease: "power3.out", scrollTrigger: { trigger: f, start: "top 88%", once: true } });
      } else {
        gsap.set(el, { scale });
      }
      gsap.fromTo(el, { y: -drift * k }, { y: drift * k, ease: "none", scrollTrigger: { trigger: f, start: "top bottom", end: "bottom top", scrub: 0.7 } });
    });
    return () => ctx.revert();
  }, [drift, scale, reveal]);

  return (
    <div ref={frame} data-cursor={cursor} className={cn("relative overflow-hidden", className)} style={style}>
      <div className="momentum relative h-full w-full">
        <div ref={inner} className="relative h-full w-full will-change-transform">
          {fill ? (
            <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover", imgClassName)} />
          ) : (
            <Image src={src} alt={alt} width={width} height={height} sizes={sizes} priority={priority} className={cn("block h-full w-full object-cover", imgClassName)} />
          )}
        </div>
      </div>
    </div>
  );
}
