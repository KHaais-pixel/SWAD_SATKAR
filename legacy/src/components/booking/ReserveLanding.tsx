"use client";
import { useEffect } from "react";
import { restaurant, telHref, whatsappHref } from "@/data/restaurant";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { useBooking } from "./BookingProvider";

/** /reserve opens the flow immediately and leaves a fallback page behind it. */
export function ReserveLanding() {
  const { open, isOpen } = useBooking();
  useEffect(() => {
    open();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="container-site min-h-[70vh] pb-24 pt-32 md:pt-40" aria-labelledby="reserve-title">
      <Eyebrow>Reservations</Eyebrow>
      <h1 id="reserve-title" className="text-h2 mt-4 max-w-[16ch] text-paper">
        A table at {restaurant.name}.
      </h1>
      <p className="mt-4 max-w-[46ch] text-fg-muted">
        Book online in under a minute, or call or message us and we&rsquo;ll hold it by hand.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {!isOpen && (
          <Button size="lg" onClick={() => open()}>
            Book a Table
          </Button>
        )}
        <Button size="lg" variant="ghost" href={telHref}>
          Call {restaurant.phone}
        </Button>
        <Button size="lg" variant="ghost" href={whatsappHref("Hello Swad Satkar, I'd like to book a table.")} target="_blank" rel="noreferrer">
          WhatsApp
        </Button>
      </div>
    </section>
  );
}
