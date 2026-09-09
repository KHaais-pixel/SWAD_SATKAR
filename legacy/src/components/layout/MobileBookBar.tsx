"use client";
import { useBooking } from "@/components/booking/BookingProvider";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/** Appears on small screens once the user is 40% down the page. */
export function MobileBookBar() {
  const progress = useScrollProgress();
  const { open, isOpen } = useBooking();
  const show = progress > 0.4 && !isOpen;

  return (
    <div
      aria-hidden={!show}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-ink/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-sm transition-[transform,opacity] duration-[var(--dur-expr)] ease-[var(--ease-out-expo)] md:hidden",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
      )}
    >
      <Button size="lg" className="w-full" onClick={() => open()} tabIndex={show ? 0 : -1}>
        Book a Table
      </Button>
    </div>
  );
}
