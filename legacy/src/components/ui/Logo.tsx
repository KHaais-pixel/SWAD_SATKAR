import Image from "next/image";
import Link from "next/link";
import { restaurant } from "@/data/restaurant";
import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";
type Variant = "wordmark" | "full";

interface LogoProps {
  className?: string;
  size?: Size;
  /** "wordmark" is the two name lines; "full" is the whole plaque. */
  variant?: Variant;
  asLink?: boolean;
  /** On pages where the mark is the largest thing above the fold. */
  priority?: boolean;
}

/** Rendered heights. The wordmark is 900x261, the plaque 1400x1034. */
const wordmarkHeight: Record<Size, number> = { sm: 26, md: 34, lg: 62 };
const plaqueWidth: Record<Size, number> = { sm: 120, md: 200, lg: 340 };

const WORDMARK_RATIO = 900 / 261;
const PLAQUE_RATIO = 1400 / 1034;

/**
 * The restaurant's own plaque, from `public/brand`. Assets are derived from
 * one source artwork by `npm run logo`. The accessible name always carries
 * both scripts, so the identity reads the same to a screen reader as it does
 * on the sign.
 */
export function Logo({ className, size = "md", variant = "wordmark", asLink = true, priority = false }: LogoProps) {
  const alt = `${restaurant.name}, ${restaurant.nameDevanagari}`;

  const inner =
    variant === "full" ? (
      <Image
        src="/brand/logo.webp"
        alt={alt}
        width={plaqueWidth[size]}
        height={Math.round(plaqueWidth[size] / PLAQUE_RATIO)}
        priority={size === "lg"}
        className={cn("h-auto w-full max-w-full", className)}
        sizes={`${plaqueWidth[size]}px`}
      />
    ) : (
      <Image
        src="/brand/logo-wordmark.webp"
        alt={alt}
        width={Math.round(wordmarkHeight[size] * WORDMARK_RATIO)}
        height={wordmarkHeight[size]}
        priority={priority}
        className={cn("w-auto", className)}
        style={{ height: wordmarkHeight[size], width: Math.round(wordmarkHeight[size] * WORDMARK_RATIO) }}
        sizes={`${Math.round(wordmarkHeight[size] * WORDMARK_RATIO)}px`}
      />
    );

  if (!asLink) return inner;

  return (
    <Link href="/" aria-label={`${restaurant.name}, home`} className="inline-flex shrink-0 items-center">
      {inner}
    </Link>
  );
}
