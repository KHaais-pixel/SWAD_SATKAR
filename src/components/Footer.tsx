import Link from "next/link";
import Image from "next/image";
import { photos, site, whatsappHref } from "@/data/site";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/story", label: "Our Story" },
  { href: "/thakali", label: "Thakali" },
  { href: "/thai", label: "Thai" },
  { href: "/bar", label: "Bar" },
  { href: "/gallery", label: "Gallery" },
];

export function Footer() {
  const socials = [
    { label: "fb", name: "Facebook", href: site.socials.facebook },
    ...(site.socials.instagram ? [{ label: "ig", name: "Instagram", href: site.socials.instagram }] : []),
    { label: "wa", name: "WhatsApp", href: whatsappHref("Hello Swad Satkar, I'd like to book a table.") },
  ];
  return (
    <footer className="border-t border-gold/40 bg-navy-deep text-cream-bright">
      <div className="wrap-wide grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-[clamp(28px,4vw,50px)] pb-[30px] pt-[clamp(44px,6vw,80px)]">
        <div>
          <Image src={photos.plaqueSmall.src} alt="" width={400} height={296} sizes="170px" className="h-auto w-[170px] rounded-[6px]" />
          <p className="display mt-[18px] text-[19px] tracking-[0.16em]">SWAD SATKAR</p>
          <p className="mt-2 font-mono text-[9.5px] tracking-[0.3em] text-gold-light">THAKALI • THAI • BAR</p>
          <p className="accent-italic mt-4 text-[17px] text-cream-bright/70">{site.cardTagline}</p>
        </div>
        <nav aria-label="Footer">
          <p className="mono-tag mb-4 text-gold-light">Explore</p>
          <ul className="flex flex-col gap-[11px]">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[14.5px] text-cream-bright/[0.82] hover:text-gold-light">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="mono-tag mb-4 text-gold-light">Hours &amp; Contact</p>
          <p className="text-[14.5px] leading-[1.8] text-cream-bright/[0.82]">
            Every day
            <br />
            {site.hours.long}
          </p>
          <address className="mt-4 text-[14.5px] not-italic leading-[1.8] text-cream-bright/[0.62]">
            {site.address.street}, {site.address.locality}
            <br />
            <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`} className="text-cream-bright/[0.62] hover:text-gold-light">{site.phone}</a>
            <br />
            <a href={`mailto:${site.email}`} className="text-cream-bright/[0.62] hover:text-gold-light">{site.email}</a>
          </address>
          <ul className="mt-[18px] flex gap-[10px]">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.name}
                  className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-gold/50 font-mono text-[11px] text-gold-light transition-colors hover:bg-gold hover:text-navy-deep"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mono-tag mb-4 text-gold-light">Reserve</p>
          <p className="mb-[18px] text-[14.5px] leading-[1.7] text-cream-bright/70">Request a table and we will call you back to confirm.</p>
          <Link href="/book" data-cursor="RESERVE" className="btn btn-gold px-[26px] py-[15px]">
            Book a Table
          </Link>
        </div>
      </div>
      <div className="border-t border-cream-bright/[0.12]">
        <div className="wrap-wide flex flex-wrap items-center justify-between gap-3 py-5">
          <p className="font-mono text-[9.5px] tracking-[0.18em] text-cream-bright/[0.62]">© SWAD SATKAR · ASIAN MIX CUISINE</p>
          <Link href="/staff" className="font-mono text-[9.5px] tracking-[0.18em] text-cream-bright/[0.62] hover:text-gold-light">
            STAFF PANEL →
          </Link>
        </div>
      </div>
    </footer>
  );
}
