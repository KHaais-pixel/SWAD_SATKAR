import { restaurant } from "@/data/restaurant";

/**
 * Restaurant schema. AggregateRating is only emitted when a real review count
 * exists — a rating without a count is never invented.
 */
export function JsonLd() {
  const a = restaurant.address;
  const openingHours = restaurant.hours
    .filter((h) => h.open && h.close)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.label,
      opens: h.open,
      closes: h.close,
    }));

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    alternateName: restaurant.nameDevanagari,
    url: restaurant.siteUrl,
    telephone: restaurant.phone,
    servesCuisine: ["Thai", "Thakali", "Nepalese"],
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: a.street,
      addressLocality: a.locality,
      addressRegion: a.region,
      postalCode: a.postalCode,
      addressCountry: a.countryCode,
    },
    openingHoursSpecification: openingHours,
    sameAs: [restaurant.socials.facebook, restaurant.maps.shareUrl].filter(Boolean),
    acceptsReservations: "True",
  };

  if (restaurant.rating.count !== null) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: restaurant.rating.value,
      bestRating: 5,
      reviewCount: restaurant.rating.count,
    };
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
