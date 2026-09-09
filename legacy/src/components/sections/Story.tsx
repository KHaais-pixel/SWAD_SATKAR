"use client";
import { useEffect, useRef } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getGsap } from "@/lib/gsap";

export function Story({ as: H = "h2" }: { as?: "h1" | "h2" }) {
  const ruleRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ruleRef.current;
    if (!el || reduced) return;
    const { gsap } = getGsap();
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.6 },
        },
      );
    });
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section id="story" className="section-y relative scroll-mt-16 bg-transparent" aria-labelledby="story-title">
      <div className="container-site">
        <Reveal>
          <Eyebrow mark="कथा">The story</Eyebrow>
          <H id="story-title" className="text-h2 mt-4 max-w-[22ch] text-paper">
            Bangkok on the left, the Kali Gandaki on the right.
          </H>
        </Reveal>

        <div className="relative mt-14 grid grid-cols-1 gap-12 md:mt-20 md:grid-cols-[1fr_auto_1fr] md:gap-14 lg:gap-20">
          <Reveal delay={0.05} className="max-w-[46ch]">
            <h3 className="text-h3 text-paper">
              <span lang="th" className="mr-3 text-azure">ไทย</span>
              Thai: bright, sharp, herb‑forward.
            </h3>
            <p className="mt-5 text-fg-muted">
              Holy basil goes into the wok when it is smoking. Lime is squeezed at the table. The green curry paste is
              pounded fresh each service, and the chilli count on the menu is honest.
            </p>
          </Reveal>

          {/* The rule draws itself on scroll */}
          <div aria-hidden className="relative hidden md:block">
            <div
              ref={ruleRef}
              className="absolute inset-y-0 left-1/2 w-px origin-top bg-azure"
              style={{ transform: reduced ? undefined : "scaleY(0)" }}
            />
          </div>
          <div aria-hidden className="h-px w-16 bg-azure md:hidden" />

          <Reveal delay={0.1} className="max-w-[46ch]">
            <h3 className="text-h3 text-paper">
              <span lang="ne" className="font-devanagari mr-3 text-azure">थकाली</span>
              Thakali: earthy, ghee‑rich, from the mountains.
            </h3>
            <p className="mt-5 text-fg-muted">
              The thali arrives on brass and keeps arriving: black dal thick enough to hold a spoon, timur pickle that
              hums on the tongue, mutton on a low flame since morning. Ghee rice is refilled until you say stop.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
