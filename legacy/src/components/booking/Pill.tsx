"use client";
import { cn } from "@/lib/cn";

interface PillProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  role?: string;
  "aria-label"?: string;
}

export function Pill({ selected, onClick, children, disabled, className, role = "radio", ...rest }: PillProps) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role === "radio" ? selected : undefined}
      aria-pressed={role !== "radio" ? selected : undefined}
      aria-label={rest["aria-label"]}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-[0.9375rem] transition-[background-color,border-color,color] duration-[var(--dur-micro)]",
        selected ? "border-azure bg-azure text-ink" : "border-hairline text-fg hover:border-azure",
        disabled && "cursor-not-allowed opacity-40 line-through hover:border-hairline",
        className,
      )}
    >
      {children}
    </button>
  );
}
