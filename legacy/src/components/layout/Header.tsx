"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { NavIcon } from "@/components/ui/Glyphs";
import { useScrolled } from "@/hooks/useScrolled";
import { useBooking } from "@/components/booking/BookingProvider";
import { cn } from "@/lib/cn";

export const NAV = [
  { href: "/menu", label: "Menu" },
  { href: "/story", label: "Story" },
  { href: "/bar", label: "Bar" },
  { href: "/visit", label: "Visit" },
] as const;

export function Header({ solid = false }: { solid?: boolean }) {
  const scrolled = useScrolled(32);
  const pathname = usePathname();
  const { open } = useBooking();
  const [navOpen, setNavOpen] = useState(false);
  const condensed = solid || scrolled;
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(href + "/");

  // The phone panel closes when the page changes or on Escape.
  useEffect(() => setNavOpen(false), [pathname]);
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNavOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,padding] duration-[var(--dur-std)] ease-[var(--ease-out-expo)]",
        condensed || navOpen ? "bg-ink/92 backdrop-blur-sm border-b border-hairline" : "bg-transparent border-b border-transparent",
      )}
    >
      <a
        href="#main"
        className="sr-only-until-focus focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-azure focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <div className={cn("container-site flex items-center justify-between gap-6 transition-[height] duration-[var(--dur-std)]", condensed ? "h-16" : "h-20 md:h-24")}>
        <Logo size={condensed ? "sm" : "md"} priority={solid} />
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV.map((item) => {
              const active = isCurrent(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative text-small font-medium transition-colors duration-[var(--dur-micro)] after:absolute after:-bottom-1 after:left-0 after:h-px after:bg-azure after:transition-[width] after:duration-[var(--dur-std)] after:ease-[var(--ease-out-expo)] hover:after:w-full",
                      condensed ? "hover:text-paper" : "hover:text-on-night",
                      active ? (condensed ? "text-paper" : "text-on-night") + " after:w-full" : (condensed ? "text-fg-muted" : "text-on-night-muted") + " after:w-0",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {/* Display utilities live on a wrapper: passing `hidden` to Button would
            lose to the `inline-flex` in its own base classes. */}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => open()}>
            <span className="hidden sm:inline">Book a Table</span>
            <span className="sm:hidden">Book</span>
          </Button>
          <button
            type="button"
            className={cn("inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-[var(--dur-micro)] hover:border-azure md:hidden", condensed ? "border-hairline text-paper" : "border-on-night/40 text-on-night")}
            aria-expanded={navOpen}
            aria-controls="site-pages"
            aria-label={navOpen ? "Close pages" : "Open pages"}
            onClick={() => setNavOpen((v) => !v)}
          >
            <NavIcon open={navOpen} />
          </button>
        </div>
      </div>
      {/* Phones: the same four pages, in a panel under the mark. Never rendered
          alongside the wide-screen list, so the landmark stays unique. */}
      {navOpen && (
        <nav id="site-pages" aria-label="Primary" className="border-t border-hairline md:hidden">
          <ul className="container-site flex flex-col py-2">
            {NAV.map((item) => {
              const active = isCurrent(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setNavOpen(false)}
                    className={cn("flex items-center justify-between py-3 font-display text-[1.375rem] leading-tight", active ? "text-azure" : "text-paper")}
                  >
                    {item.label}
                    {active && <span className="text-small font-body text-fg-muted">You are here</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
