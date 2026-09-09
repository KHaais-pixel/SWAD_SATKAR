"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { photos, site } from "@/data/site";
import { getGsap, reducedMotion, motionScale } from "@/lib/gsap";
import { Magnetic } from "@/components/motion/Magnetic";

/**
 * The front door. On arrival the house fades and settles into place, then
 * the plaque, the name, the line, the tagline, the words, the buttons and
 * the hours, one after another: the doors opening. As you scroll, the
 * picture pushes in and drifts slower than the words; the name lifts,
 * spreads its letters a little and fades; the rest goes first. The section
 * is pinned under the page, so the story slides up over it.
 */
export function HomeHero() {
  const section = useRef<HTMLElement>(null);
  const img = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const sub = useRef<HTMLDivElement>(null);
  const cta = useRef<HTMLDivElement>(null);
  const hours = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (reducedMotion() || !section.current) return;
    const { gsap } = getGsap();
    const k = motionScale();
    const ctx = gsap.context(() => {
      const st = { trigger: section.current, start: "top top", end: "bottom top", scrub: 0.6 };
      gsap.fromTo(img.current, { scale: 1, y: 0 }, { scale: 1.08, y: 90 * k, ease: "none", scrollTrigger: st });
      gsap.to(logo.current, { y: -50 * k, ease: "none", scrollTrigger: st });
      gsap.to(title.current, { y: -90 * k, letterSpacing: "0.12em", opacity: 0, ease: "none", scrollTrigger: { ...st, end: "80% top" } });
      gsap.to(sub.current, { y: -40 * k, opacity: 0, ease: "none", scrollTrigger: { ...st, end: "50% top" } });
      gsap.to(cta.current, { y: -30 * k, opacity: 0, ease: "none", scrollTrigger: { ...st, end: "65% top" } });
      gsap.to(hours.current, { opacity: 0, ease: "none", scrollTrigger: { ...st, end: "40% top" } });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="hero-stage">
      <section ref={section} className="relative h-[100svh] min-h-[560px] overflow-hidden bg-navy-deep" aria-labelledby="hero-title">
        <div className="absolute inset-0 [animation:ssZoom_1.9s_cubic-bezier(.2,.8,.2,1)_both]">
          <div ref={img} className="absolute inset-0 will-change-transform">
            <Image src={photos.exterior.src} alt="" fill priority sizes="100vw" className="object-cover object-[center_45%]" />
          </div>
        </div>
        <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(11,31,54,.66) 0%,rgba(11,31,54,.3) 42%,rgba(11,31,54,.86) 100%)" }} />
        <div aria-hidden className="pointer-events-none absolute inset-[clamp(14px,2.4vw,30px)] rounded-[6px] border border-gold/[0.34] [animation:ssIn_1.4s_ease_.9s_both]" />

        <div className="relative flex h-full flex-col items-center justify-center px-[22px] text-center">
          <div className="[animation:ssRise_1.1s_cubic-bezier(.2,.8,.2,1)_.35s_both]">
            <div ref={logo} className="will-change-transform">
            <Image src={photos.plaque.src} alt="" width={1200} height={887} sizes="210px" priority className="block h-auto w-[min(210px,44vw)] rounded-[6px] shadow-[0_20px_50px_rgba(0,0,0,.35)]" />
            </div>
          </div>
          <div className="mt-[26px] [animation:ssRise_1.1s_cubic-bezier(.2,.8,.2,1)_.6s_both]">
            <h1 ref={title} id="hero-title" className="display text-[clamp(36px,7.2vw,86px)] leading-[1.02] tracking-[0.03em] text-cream-bright will-change-transform [text-shadow:0_2px_30px_rgba(0,0,0,.45)]">
              SWAD SATKAR
            </h1>
          </div>
          <div ref={sub} className="flex flex-col items-center will-change-transform">
            <p className="mt-[14px] font-mono text-[clamp(10px,1.5vw,13px)] tracking-[0.4em] text-gold-light [animation:ssRise_1s_ease_.8s_both]">THAKALI • THAI • BAR</p>
            <div aria-hidden className="my-[26px] h-px w-16 bg-gold/75 [animation:ssWide_1.1s_cubic-bezier(.2,.8,.2,1)_1s_both]" />
            <p className="accent-italic max-w-[18ch] text-[clamp(21px,3.4vw,38px)] font-medium leading-[1.22] text-cream-bright [animation:ssRise_1.1s_cubic-bezier(.2,.8,.2,1)_1.15s_both]">{site.tagline}</p>
            <p className="mt-5 max-w-[54ch] text-[clamp(13.5px,1.6vw,16px)] leading-[1.65] text-cream-bright/[0.86] [text-wrap:pretty] [animation:ssRise_1.1s_ease_1.35s_both]">
              Experience the warmth of Thakali tradition, the vibrant flavors of Thailand, and a place made for gathering.
            </p>
          </div>
          <div className="mt-[34px] [animation:ssRise_1.1s_cubic-bezier(.2,.8,.2,1)_1.55s_both]">
          <div ref={cta} className="flex flex-wrap justify-center gap-[14px] will-change-transform">
            <Magnetic>
              <Link href="/thakali" data-cursor="EXPLORE" className="btn btn-gold">
                <span className="btn-text">Explore Menu</span><span className="arrow" aria-hidden>→</span>
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="/book" data-cursor="RESERVE" className="btn btn-ghost-light">
                <span className="btn-text">Book a Table</span>
              </Link>
            </Magnetic>
          </div>
          </div>
          <div className="mt-[30px] [animation:ssIn_1.2s_ease_1.8s_both]">
          <p ref={hours} className="inline-flex items-center gap-[10px] rounded-full border border-gold/50 px-[18px] py-2">
            <span aria-hidden className="h-[6px] w-[6px] rounded-full bg-mint [animation:ssGlow_2.4s_ease-in-out_infinite]" />
            <span className="font-mono text-[10px] tracking-[0.28em] text-gold-pale">{site.hours.short}</span>
          </p>
          </div>
        </div>

        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[26px] flex flex-col items-center gap-[10px] [animation:ssIn_1.4s_ease_2.1s_both]">
          <span className="font-mono text-[10.5px] tracking-[0.32em] text-cream-bright/70">SCROLL TO EXPLORE</span>
          <span className="h-[34px] w-px bg-[linear-gradient(180deg,rgba(201,162,74,.9),transparent)] [animation:ssBob_2.6s_ease-in-out_infinite]" />
        </div>
      </section>
    </div>
  );
}
