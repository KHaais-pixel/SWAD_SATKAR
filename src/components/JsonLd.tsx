import { site } from "@/data/site";

/** Restaurant schema; the rating is left out until a real review count exists. */
export function JsonLd() {
  const a = site.address;
  const data = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: site.name,
    alternateName: site.nameDevanagari,
    url: site.siteUrl,
    telephone: site.phone,
    email: site.email,
    servesCuisine: ["Thakali", "Nepalese", "Thai"],
    priceRange: "$$",
    address: { "@type": "PostalAddress", streetAddress: a.street, addressLocality: a.locality, addressRegion: a.region, postalCode: a.postalCode, addressCountry: a.countryCode },
    openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: site.hours.opens, closes: site.hours.closes }],
    sameAs: [site.socials.facebook, site.maps.shareUrl],
    acceptsReservations: "True",
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
