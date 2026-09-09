import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "paper" | "night";
type Size = "md" | "lg" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[0.01em] whitespace-nowrap transition-[background-color,color,border-color,transform,box-shadow] duration-[var(--dur-std)] ease-[var(--ease-out-expo)] active:scale-[0.985] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-azure text-ink border border-azure hover:bg-glow hover:border-glow shadow-[0_12px_28px_-12px_rgb(15_159_224/0.55)]",
  ghost: "bg-transparent text-fg border border-hairline hover:border-azure hover:text-azure",
  paper: "bg-ink text-paper border border-ink hover:bg-char",
  /** a ghost for the dark places: the film hero */
  night: "bg-transparent text-on-night border border-on-night/40 hover:border-on-night hover:text-on-night",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-small",
  md: "h-11 px-6 text-[0.9375rem]",
  lg: "min-h-[52px] px-7 text-body",
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type ButtonProps = StyleProps & Omit<ComponentProps<"button">, "className" | "children"> & { href?: undefined };
type LinkProps = StyleProps & Omit<ComponentProps<typeof Link>, "className" | "children"> & { href: string };

export function Button(props: ButtonProps | LinkProps) {
  if (props.href !== undefined) {
    const { variant = "primary", size = "md", className, children, ...rest } = props;
    return (
      <Link className={cn(base, variants[variant], sizes[size], className)} {...rest}>
        {children}
      </Link>
    );
  }
  const { variant = "primary", size = "md", className, children, type = "button", ...rest } = props;
  return (
    <button type={type} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}
