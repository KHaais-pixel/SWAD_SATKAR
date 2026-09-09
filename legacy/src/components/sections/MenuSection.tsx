"use client";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { MenuBook } from "@/components/menu/MenuBook";
import { ArrowIcon } from "@/components/ui/Glyphs";
import { useMenuArrival } from "@/hooks/useMenuArrival";
import { useMounted } from "@/hooks/useMounted";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Level = "h1" | "h2";

function Intro({ as: H }: { as: Level }) {
  return (
    <Reveal className="mb-10 max-w-[560px] md:mb-12">
      <Eyebrow mark="मेनु">The menu</Eyebrow>
      <H id="menu-title" className="text-h2 mt-4 max-w-[16ch] text-paper">
        Open the book, turn the page.
      </H>
      <p className="mt-4 max-w-[48ch] text-fg-muted">
        Thai on the first spread, Thakali on the second, the bar at the back. Drag a corner, swipe, or use the arrows.
      </p>
      <Link href="#list" className="mt-5 inline-flex items-center gap-2 text-small text-azure underline-offset-4 hover:underline">
        Read it as a list <ArrowIcon direction="down" className="h-4 w-4" />
      </Link>
    </Reveal>
  );
}

/** Pinned: the whole book is scrubbed with scroll. */
function ArrivingMenu({ as }: { as: Level }) {
  const { sectionRef } = useMenuArrival();
  return (
    <section ref={sectionRef} id="menu" className="no-print relative min-h-[100svh] bg-transparent py-20 scroll-mt-16 md:py-24" aria-labelledby="menu-title">
      <div className="container-site">
        <Intro as={as} />
        <MenuBook />
      </div>
    </section>
  );
}

function StillMenu({ as }: { as: Level }) {
  return (
    <section id="menu" className="no-print section-y relative bg-transparent scroll-mt-16" aria-labelledby="menu-title">
      <div className="container-site">
        <Intro as={as} />
        <MenuBook />
      </div>
    </section>
  );
}

export function MenuSection({ as = "h2" }: { as?: Level }) {
  const reduced = useReducedMotion();
  const mounted = useMounted();
  if (reduced || !mounted) return <StillMenu as={as} />;
  return <ArrivingMenu as={as} />;
}
