import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Eyebrow({ children, className, mark }: { children: ReactNode; className?: string; mark?: string }) {
  return (
    <p className={cn("eyebrow flex items-center gap-3", className)}>
      <span aria-hidden className="h-px w-6 bg-azure/70" />
      <span>{children}</span>
      {mark ? (
        <span lang="ne" aria-hidden className="font-devanagari normal-case tracking-normal text-azure">
          {mark}
        </span>
      ) : null}
    </p>
  );
}
