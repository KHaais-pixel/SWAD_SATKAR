"use client";
import { useEffect, useState } from "react";
import { restaurant, telHref, telHrefSecondary, whatsappHref, PLACEHOLDER_HOURS_ARE_EXAMPLE } from "@/data/restaurant";
import { formatTime, getOpenStatus, type OpenStatus } from "@/lib/hours";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

export function Visit({ as: H = "h2" }: { as?: "h1" | "h2" }) {
  const [status, setStatus] = useState<OpenStatus | null>(null);

  useEffect(() => {
    const tick = () => setStatus(getOpenStatus());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const a = restaurant.address;

  const sameEveryDay = restaurant.hours.every((h) => h.open === restaurant.hours[0].open && h.close === restaurant.hours[0].close);

  return (
    <section id="visit" className="section-y relative bg-transparent scroll-mt-16" aria-labelledby="visit-title">
      <div className="container-site grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-6">
        <Reveal className="md:col-span-5">
          <Eyebrow mark="भेट">Visit</Eyebrow>
          <H id="visit-title" className="text-h2 mt-4 text-paper">
            Bhanimandal Marg, Lalitpur.
          </H>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-small",
                status?.isOpen ? "border-basil/60 text-paper" : "border-hairline text-fg-muted",
              )}
              role="status"
              aria-live="polite"
            >
              <span className={cn("h-2 w-2 rounded-full", status?.isOpen ? "bg-basil" : "bg-alert")} aria-hidden />
              {status ? status.line : "Checking hours…"}
            </span>
          </div>

          {sameEveryDay ? (
            <p className="mt-6 max-w-[40ch] text-paper">
              Open every day, {formatTime(restaurant.hours[0].open!)} to {formatTime(restaurant.hours[0].close!)}.
              {" "}
              <span className="text-fg-muted">
                {restaurant.happyHour.label} {restaurant.happyHour.window.toLowerCase()}.
                {PLACEHOLDER_HOURS_ARE_EXAMPLE && " Hours are provisional until confirmed."}
              </span>
            </p>
          ) : (
            <dl className="mt-6 grid max-w-[380px] grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-small">
              {restaurant.hours.map((h) => {
                const today = status?.today === h.day;
                return (
                  <div key={h.day} className="contents" aria-current={today ? "date" : undefined}>
                    <dt className={today ? "text-azure" : "text-fg-muted"}>
                      {h.label}
                      {today && <span className="sr-only"> (today)</span>}
                    </dt>
                    <dd className={cn("text-right tabular-nums", today ? "text-paper" : "text-fg-muted")}>
                      {h.open && h.close ? `${formatTime(h.open)} to ${formatTime(h.close)}` : "Closed"}
                    </dd>
                  </div>
                );
              })}
            </dl>
          )}

          <address className="mt-8 not-italic text-fg-muted">
            {a.street}, {a.locality}
            <br />
            {a.region} {a.postalCode}, {a.country}
          </address>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
            <a href={telHref} className="text-paper underline-offset-4 hover:underline">
              {restaurant.phone}
            </a>
            <span className="text-fg-muted" aria-hidden>/</span>
            <a href={telHrefSecondary} className="text-paper underline-offset-4 hover:underline">
              {restaurant.phoneSecondary}
            </a>
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2">
            <a href={whatsappHref()} target="_blank" rel="noreferrer" className="text-paper underline-offset-4 hover:underline">
              WhatsApp
            </a>
            <span className="text-fg-muted" aria-hidden>/</span>
            <a href={`mailto:${restaurant.email}`} className="text-paper underline-offset-4 hover:underline">
              {restaurant.email}
            </a>
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={restaurant.maps.directionsUrl} target="_blank" rel="noreferrer">
              Get directions
            </Button>
            <Button variant="ghost" href={telHref}>
              Call us
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="md:col-span-7">
          <div className="surface-raised relative aspect-[4/3] overflow-hidden rounded-card md:aspect-auto md:h-full md:min-h-[520px]">
            <iframe
              title="Map showing Swad Satkar on Bhanimandal Marg, Lalitpur"
              src={restaurant.maps.embedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen={false}
              className="absolute inset-0 h-full w-full border-0"
              style={{ filter: "invert(0.93) hue-rotate(185deg) saturate(0.4) brightness(0.9) contrast(0.95) sepia(0.25)" }}
            />
            {/* Azure corner marks: keeps the frame feeling printed */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              {["top-3 left-3 border-t border-l", "top-3 right-3 border-t border-r", "bottom-3 left-3 border-b border-l", "bottom-3 right-3 border-b border-r"].map((c) => (
                <span key={c} className={cn("absolute h-4 w-4 border-azure/70", c)} />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
