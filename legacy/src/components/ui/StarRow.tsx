import { cn } from "@/lib/cn";

interface StarRowProps {
  value: number;
  size?: number;
  className?: string;
}

/** Five drawn stars with a fractional fill; decorative, callers add the text. */
export function StarRow({ value, size = 16, className }: StarRowProps) {
  return (
    <span aria-hidden className={cn("inline-flex items-center gap-[3px]", className)}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        const id = `star-${i}-${Math.round(fill * 100)}`;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
            <defs>
              <linearGradient id={id} x1="0" x2="1">
                <stop offset={fill} stopColor="var(--azure)" />
                <stop offset={fill} stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.8L12 17.7 5.9 21l1.3-6.8-5-4.7 6.8-.8z"
              fill={`url(#${id})`}
              stroke="var(--azure)"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </span>
  );
}
