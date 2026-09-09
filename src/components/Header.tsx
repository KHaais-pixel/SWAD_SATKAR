"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { photos, site } from "@/data/site";
import { cn } from "@/lib/cn";
import { Magnetic } from "@/components/motion/Magnetic";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/story", label: "Our Story" },
  { href: "/thakali", label: "Thakali" },
  { href: "/thai", label: "Thai" },
  { href: "/bar", label: "Bar" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

/**
 * The bar across the top. On the home page it stays out of the way until the
 * hero has been scrolled past; everywhere else it is there from the start and
 * the page leaves room for it. It tightens once the page moves.
 */
export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(isHome);
  const [open, setOpen] = useState(false);
  const [inView, setInView] = useState("");

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      setScrolled(y > 40);
      setHidden(isHome && y < window.innerHeight * 0.55);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);
  useEffect(() => setOpen(false), [pathname]);
  // the motion root writes the section in view onto <html>; watch it
  useEffect(() => {
    const root = document.documentElement;
    const mo = new MutationObserver(() => setInView(root.dataset.navActive || ""));
    mo.observe(root, { attributes: true, attributeFilter: ["data-nav-active"] });
    return () => mo.disconnect();
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "site-header fixed inset-x-0 top-0 z-[60] border-b border-navy/10 bg-cream/[0.94] backdrop-blur-[14px] transition-[padding,box-shadow,opacity,transform,background-color,border-color] duration-[450ms] ease-out",
          scrolled ? "py-[9px] shadow-[0_8px_30px_rgb(14_42_74/0.1)]" : "py-[18px]",
          hidden && !open && "pointer-events-none -translate-y-full opacity-0",
        )}
      >
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-parchment">
          Skip to content
        </a>
        <div className="wrap-wide flex items-center gap-[clamp(12px,2vw,28px)]">
          <Link href="/" className="flex flex-none items-center gap-3" aria-label={`${site.name}, home`}>
            <Image
              src={photos.plaqueSmall.src}
              alt=""
              width={400}
              height={296}
              priority
              className={cn("w-auto rounded-[4px] transition-[height] duration-[350ms]", scrolled ? "h-[34px]" : "h-[44px]")}
              sizes="60px"
            />
            <span className="flex flex-col leading-none">
              <span className="brand-name display text-[17px] tracking-[0.16em] text-navy transition-colors duration-[450ms]">SWAD SATKAR</span>
              <span className="mt-[5px] font-mono text-[10px] tracking-[0.26em] text-gold-ink">THAKALI · THAI · BAR</span>
            </span>
          </Link>
          <div className="flex-1" />
          <nav aria-label="Primary" className="hidden items-center gap-[clamp(10px,1.6vw,24px)] min-[1080px]:flex">
            {NAV.map((item) => {
              const active = isHome ? (inView ? inView === item.href : item.href === "/") : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  data-on={active}
                  data-cursor={["/thakali", "/thai", "/bar"].includes(item.href) ? "EXPLORE" : undefined}
                  className={cn(
                    "nav-link relative whitespace-nowrap py-[6px] text-[12.5px] font-medium uppercase tracking-[0.13em] transition-colors duration-[450ms] hover:text-gold-ink",
                    active ? "text-gold-ink" : "text-navy",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Magnetic max={5}>
              <Link href="/book" data-cursor="RESERVE" className="btn btn-navy ml-[6px] px-[22px] py-[13px] text-[12px] tracking-[0.14em]">
                <span className="btn-text">Book a Table</span>
              </Link>
            </Magnetic>
          </nav>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="menu-toggle flex h-[46px] w-[46px] flex-col items-center justify-center gap-[5px] rounded-full border border-navy/25 bg-transparent transition-colors duration-[450ms] min-[1080px]:hidden"
          >
            <span className={cn("block h-[1.5px] w-5 bg-navy transition-transform", open && "translate-y-[6.5px] rotate-45")} />
            <span className={cn("block h-[1.5px] w-5 bg-navy transition-opacity", open && "opacity-0")} />
            <span className={cn("block h-[1.5px] bg-gold-deep transition-all", open ? "w-5 -translate-y-[6.5px] -rotate-45" : "w-[14px]")} />
          </button>
        </div>
        {open && (
          <nav id="site-menu" aria-label="Primary" className="flex flex-col gap-[2px] border-t border-navy/[0.12] bg-cream px-5 pb-[26px] pt-[14px] [animation:ssRise_.35s_ease_both] min-[1080px]:hidden">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className="display border-b border-navy/[0.07] px-1 py-[14px] text-[20px]">
                {item.label === "Contact" ? "Contact / Visit Us" : item.label}
              </Link>
            ))}
            <Link href="/book" className="btn btn-navy mt-4 py-[17px] text-[13px]">
              Book a Table
            </Link>
          </nav>
        )}
      </header>
      {!isHome && <div aria-hidden className="h-[81px]" />}
    </>
  );
}
