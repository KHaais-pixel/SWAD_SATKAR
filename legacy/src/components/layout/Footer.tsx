"use client";
import Link from "next/link";
import { restaurant, telHref, whatsappHref } from "@/data/restaurant";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useBooking } from "@/components/booking/BookingProvider";

const nav = [
  { href: "/menu", label: "Menu" },
  { href: "/story", label: "Story" },
  { href: "/bar", label: "Bar" },
  { href: "/visit", label: "Visit" },
  { href: "/reserve", label: "Reserve" },
];

export function Footer() {
  const { open } = useBooking();
  const a = restaurant.address;
  return (
    <footer className="relative border-t border-hairline bg-transparent">
      {/* Final booking band */}
      <div className="container-site py-16 md:py-24">
        <div className="surface-raised rounded-card px-6 py-10 md:px-14 md:py-14 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <p className="eyebrow mb-4">Tonight, or any night</p>
            <h2 className="text-h2 text-paper">Your table is set.</h2>
            <p className="mt-3 text-fg-muted max-w-[46ch]">
              Two kitchens, one bar, and a chair with your name on it. Booking takes under a minute.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" onClick={() => open()}>
              Book a Table
            </Button>
            <Button size="lg" variant="ghost" href={whatsappHref("Hello Swad Satkar, I'd like to book a table.")} target="_blank" rel="noreferrer">
              WhatsApp us
            </Button>
          </div>
        </div>
      </div>

      <div className="container-site grid grid-cols-1 gap-10 pb-12 md:grid-cols-12 md:gap-6">
        <div className="md:col-span-4">
          <Logo size="md" />
          <p className="mt-4 text-small text-fg-muted max-w-[34ch]">{restaurant.cuisineLine}: {restaurant.descriptor}. {restaurant.cardTagline}</p>
        </div>
        <nav aria-label="Footer" className="md:col-span-2">
          <p className="eyebrow mb-4">Explore</p>
          <ul className="space-y-2">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-small text-fg-muted hover:text-paper transition-colors duration-[var(--dur-micro)]">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-3">
          <p className="eyebrow mb-4">Find us</p>
          <address className="not-italic text-small text-fg-muted leading-relaxed">
            {a.street}
            <br />
            {a.locality}, {a.region} {a.postalCode}
            <br />
            {a.country}
          </address>
          <p className="mt-3 text-small">
            <a href={telHref} className="text-fg-muted hover:text-paper">
              {restaurant.phone}
            </a>
          </p>
          <p className="mt-1 text-small">
            <a href={`mailto:${restaurant.email}`} className="text-fg-muted hover:text-paper">
              {restaurant.email}
            </a>
          </p>
        </div>
        <div className="md:col-span-3">
          <p className="eyebrow mb-4">Hours</p>
          <p className="text-small text-fg-muted">{restaurant.hoursSummary}</p>
          <p className="mt-1 text-small text-fg-muted">
            {restaurant.happyHour.label}: {restaurant.happyHour.window}
          </p>
          <ul className="mt-5 flex gap-4">
            <li>
              <a href={restaurant.socials.facebook} target="_blank" rel="noreferrer" className="text-small text-fg-muted hover:text-azure">
                Facebook
              </a>
            </li>
            {restaurant.socials.instagram && (
              <li>
                <a href={restaurant.socials.instagram} target="_blank" rel="noreferrer" className="text-small text-fg-muted hover:text-azure">
                  Instagram
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="container-site flex flex-col gap-2 border-t border-hairline py-6 text-[0.8125rem] text-fg-muted md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} {restaurant.name} <span lang="ne" className="font-devanagari">{restaurant.nameDevanagari}</span>. {restaurant.meaning}.
        </p>
        <p>Lalitpur, Nepal</p>
      </div>
    </footer>
  );
}
