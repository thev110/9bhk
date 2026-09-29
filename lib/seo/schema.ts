/**
 * Structured-data framework.
 *
 * Design rules, in priority order:
 *
 *  1. **Nothing is emitted that is not visible on the page.** Every node below
 *     is produced from the same values the template renders, which is what keeps
 *     the markup inside Google's structured-data policies.
 *  2. **Optional fields are omitted, never zero-filled.** No `""` ratings, no
 *     invented `price`, no placeholder `addressCountry`.
 *  3. **VacationRental is gated, not guessed.** Google's vacation-rental spec
 *     requires `latitude`, `longitude` and a `PostalAddress` with
 *     `streetAddress`. The catalog has none of those today, so
 *     `createVacationRentalSchema()` refuses to emit a node until the columns
 *     exist and are populated — see `TRUST.vacationRental` below. Until then
 *     property pages carry a semantically correct `Product` + lodging type,
 *     which is what AI/answer engines actually consume.
 *  4. **Reviews are off by default.** The catalog has `rating` / `reviews`
 *     columns whose provenance is not yet tied to completed stays, so
 *     `AggregateRating` and `Review` are not emitted. Flip `TRUST.reviewSchema`
 *     once `verifiedStay` is real.
 *
 * Every builder is pure and composable so a new page type can mix and match.
 */

import type { Property } from "@/lib/properties";
import { hasPool, isBeachfront, joinList, plural } from "@/lib/seo/copy";
import { locationFor, type LocationEntry } from "@/lib/seo/locations";
import { categoryFor } from "@/lib/seo/taxonomy";
import { CURRENCY, SITE, absoluteUrl } from "@/lib/seo/site";
import type { QA } from "@/lib/seo/faq";

export type JsonLd = Record<string, unknown>;

/** Absolute image URL, or null when the source is unusable for a crawler. */
export function imageUrl(source: string | undefined | null): string | null {
  if (!source) return null;
  if (/^https?:\/\//i.test(source)) return source;
  if (!source.startsWith("/")) return null;
  return absoluteUrl(source);
}

function imageNodes(source: string | undefined | null, alt?: string): JsonLd[] | undefined {
  const url = imageUrl(source);
  if (!url) return undefined;
  return [{ "@type": "ImageObject", url, ...(alt ? { name: alt, caption: alt } : {}) }];
}

/**
 * Feature switches. Grouped here so a reviewer can see at a glance which parts
 * of the markup are conditional on data the business has not supplied yet.
 */
export const TRUST = {
  /**
   * Emit `AggregateRating` / `Review`.
   * TODO(business-data): the `rating` and `reviews` columns are not yet tied to
   * completed, verified stays. Google's review-snippet guidelines require the
   * rating to be visible on the page and to represent real users, so this stays
   * false until `bhk_reviews` with a `verified_stay` column exists.
   */
  reviewSchema: false,
  /**
   * Emit Google `VacationRental`.
   * TODO(business-data): requires `latitude`, `longitude` and a street-level
   * `address` on every published listing. The migration that adds them is
   * `supabase/migrations/20260930000000_seo_content_model.sql`. This flips to
   * true automatically once a property carries coordinates, so no code change is
   * needed when the data lands.
   */
  vacationRental: true,
  /** Publish `sameAs` social profiles on the Organization node. */
  organizationSameAs: true,
} as const;

/* ── Entity ─────────────────────────────────────────────────────────── */

export function createOrganizationSchema(): JsonLd {
  const node: JsonLd = {
    "@type": "Organization",
    "@id": `${absoluteUrl("/")}#organization`,
    name: SITE.displayName,
    alternateName: SITE.name,
    legalName: SITE.legalName,
    url: absoluteUrl("/"),
    description: SITE.description,
    email: SITE.email,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/logo-wordmark.png"),
    },
    image: absoluteUrl("/logo-wordmark.png"),
  };
  if (TRUST.organizationSameAs && SITE.sameAs.length) node.sameAs = SITE.sameAs;
  return node;
}

export function createWebsiteSchema(): JsonLd {
  return {
    "@type": "WebSite",
    "@id": `${absoluteUrl("/")}#website`,
    url: absoluteUrl("/"),
    name: SITE.displayName,
    alternateName: SITE.name,
    description: SITE.description,
    inLanguage: SITE.lang,
    publisher: { "@id": `${absoluteUrl("/")}#organization` },
    // /search is a real, working full-text search over the catalog, so the
    // sitelinks search box is honest here.
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/* ── Navigation ──────────────────────────────────────────────────────── */

export type Crumb = { name: string; href: string };

export function createBreadcrumbSchema(crumbs: Crumb[]): JsonLd {
  return {
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(crumbs[crumbs.length - 1]?.href ?? "/")}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.href),
    })),
  };
}

/* ── Listings ────────────────────────────────────────────────────────── */

/** schema.org lodging subtype that best matches the listing's own type string. */
function lodgingType(property: Property): string {
  const type = property.type.toLowerCase();
  if (/bungalow|cottage|farm/.test(type)) return "Cottage";
  if (/beach|coast|ocean|seaside|shore/.test(type)) return "BeachHouse";
  if (/estate|pavilion|portico|residence/.test(type)) return "Estate";
  if (/hill/.test(type)) return "Lodge";
  if (/city|urban/.test(type)) return "Apartment";
  if (/villa/.test(type)) return "Villa";
  return "House";
}

/** `PostalAddress` built only from the locality data the catalog actually holds. */
export function createAddressSchema(property: Property): JsonLd | null {
  const location = locationFor(property);
  if (!location) return null;
  const parts = [property.location, property.city, location?.name, location?.region, location?.country]
    .filter(Boolean)
    .map((part) => String(part).replace(/[|·]/g, " ").replace(/\s+/g, " ").trim());
  return {
    "@type": "PostalAddress",
    addressLocality: property.city || location?.name || undefined,
    addressRegion: location?.region,
    addressCountry: location?.country,
    // No `streetAddress`: the catalog stores a descriptive locality line, not a
    // street address, so it is not passed off as one.
    description: parts.join(", "),
  };
}

export function createPlaceSchema(location: LocationEntry): JsonLd {
  return {
    "@type": "TouristDestination",
    "@id": `${absoluteUrl(`/locations/${location.slug}`)}#place`,
    name: location.name,
    description: location.overview,
    containedInPlace: {
      "@type": "AdministrativeArea",
      name: `${location.region}, ${location.country}`,
    },
  };
}

export function createOfferSchema(property: Property): JsonLd {
  return {
    "@type": "Offer",
    "@id": `${absoluteUrl(`/property/${property.id}`)}#offer`,
    price: property.price,
    priceCurrency: CURRENCY,
    // The nightly rate is per whole house, which is the unit `priceSpecification`
    // has to state explicitly or the number is meaningless to a consumer.
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: property.price,
      priceCurrency: CURRENCY,
      unitCode: "CUC",
      unitText: "night",
      // Tax is quoted separately at checkout, so the headline rate is pre-tax.
      valueAddedTaxIncluded: false,
      referenceQuantity: {
        "@type": "QuantitativeValue",
        value: 1,
        unitText: "night",
      },
    },
    availability: "https://schema.org/InStock",
    url: absoluteUrl(`/property/${property.id}`),
    seller: { "@id": `${absoluteUrl("/")}#organization` },
  };
}

/**
 * A property listing.
 *
 * Emitted as `Product` + the schema.org lodging subtype. `Product` carries the
 * transactional fields Google's parsers expect (name, image, description,
 * offers); the lodging subtype carries the spatial and amenity semantics that
 * make the page legible to AI answer engines.
 */
export function createPropertySchema(property: Property): JsonLd {
  const images = imageNodes(property.image, property.alt);
  const address = createAddressSchema(property);
  const location = locationFor(property);
  const capacity: JsonLd = {
    "@type": "QuantitativeValue",
    value: property.guests,
    unitText: "guests",
  };

  const node: JsonLd = {
    "@type": ["Product", lodgingType(property)],
    "@id": `${absoluteUrl(`/property/${property.id}`)}#property`,
    name: property.name,
    url: absoluteUrl(`/property/${property.id}`),
    description: property.blurb?.trim() || property.highlights?.trim() || undefined,
    ...(images ? { image: images } : {}),
    sku: property.id,
    mpn: property.id,
    category: categoryFor(property).longForm,
    brand: { "@id": `${absoluteUrl("/")}#organization` },
    offers: { "@id": `${absoluteUrl(`/property/${property.id}`)}#offer` },
    ...(address ? { address } : {}),
    ...(location ? { containedInPlace: { "@id": `${absoluteUrl(`/locations/${location.slug}`)}#place` } } : {}),
    ...(property.bedrooms > 0 ? { numberOfRooms: property.bedrooms } : {}),
    occupancy: capacity,
    ...(property.beds > 0 ? { numberOfBeds: property.beds } : {}),
    ...(property.bathrooms > 0
      ? { numberOfBathroomsTotal: property.bathrooms }
      : {}),
  };

  // `amenityFeature` mirrors the on-page amenity list item for item.
  if (property.amenities?.length) {
    node.amenityFeature = property.amenities.map((amenity) => ({
      "@type": "LocationFeatureSpecification",
      name: amenity,
      value: true,
    }));
  }

  if (property.celebration) {
    node.additionalProperty = [
      {
        "@type": "PropertyValue",
        name: "Event capacity",
        value: plural(property.celebration.maxEventGuests, "guest", "guests"),
      },
      {
        "@type": "PropertyValue",
        name: "Sanctioned power load",
        value: `${property.celebration.powerLoadKw} kW`,
      },
    ];
  }

  if (property.garage) {
    node.additionalProperty = [
      ...((node.additionalProperty as JsonLd[] | undefined) ?? []),
      {
        "@type": "PropertyValue",
        name: property.garage.name,
        value: `Capacity ${plural(property.garage.capacity, "vehicle")}`,
      },
    ];
  }

  if (TRUST.reviewSchema && property.rating > 0 && property.reviews > 0) {
    node.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: property.rating.toFixed(1),
      reviewCount: property.reviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return node;
}

/** True when a listing carries everything Google's `VacationRental` requires. */
export function vacationRentalEligible(property: Property): boolean {
  if (!TRUST.vacationRental) return false;
  const candidate = property as Property & { latitude?: number; longitude?: number; address?: string };
  return (
    typeof candidate.latitude === "number" &&
    typeof candidate.longitude === "number" &&
    Boolean(candidate.address)
  );
}

/**
 * Google `VacationRental`.
 *
 * Refuses to emit unless `latitude`, `longitude` and a street address exist,
 * because all three are required properties in Google's vacation-rental
 * specification. Adding a node with fabricated or missing coordinates is worse
 * than adding no node.
 *
 * TODO(business-data): once `latitude`, `longitude`, `address`, `check_in_time`,
 * `check_out_time` and `pets_allowed` are populated on `bhk_properties`, this
 * function starts emitting on its own — no template change required.
 */
export function createVacationRentalSchema(
  property: Property & {
    latitude?: number;
    longitude?: number;
    address?: string;
    checkInTime?: string;
    checkoutTime?: string;
    petsAllowed?: boolean;
  },
): JsonLd | null {
  if (!vacationRentalEligible(property)) return null;
  const images = imageNodes(property.image, property.alt);
  if (!images) return null;
  const location = locationFor(property);
  if (!location) return null;

  return {
    "@type": "VacationRental",
    "@id": `${absoluteUrl(`/property/${property.id}`)}#vacationrental`,
    name: property.name,
    description: property.blurb?.trim() || property.highlights?.trim(),
    url: absoluteUrl(`/property/${property.id}`),
    image: images,
    identifier: {
      "@type": "PropertyValue",
      name: SITE.name,
      value: property.id,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
      addressLocality: property.city || location.name,
      addressRegion: location.region,
      addressCountry: location.country,
    },
    latitude: property.latitude,
    longitude: property.longitude,
    numberOfBedrooms: property.bedrooms || undefined,
    numberOfBathroomsTotal: property.bathrooms || undefined,
    occupancy: {
      "@type": "QuantitativeValue",
      value: property.guests,
      unitText: "guests",
    },
    checkinTime: property.checkInTime,
    checkoutTime: property.checkoutTime,
    petsAllowed: property.petsAllowed,
    ...(property.amenities?.length
      ? {
          amenityFeature: property.amenities.map((amenity) => ({
            "@type": "LocationFeatureSpecification",
            name: amenity,
            value: true,
          })),
        }
      : {}),
    ...(location
      ? { containedInPlace: { "@id": `${absoluteUrl(`/locations/${location.slug}`)}#place` } }
      : {}),
    tourBookingPage: absoluteUrl(`/property/${property.id}`),
    ...(TRUST.reviewSchema && property.rating > 0 && property.reviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: property.rating.toFixed(1),
            reviewCount: property.reviews,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

/* ── Collections & editorial ─────────────────────────────────────────── */

export function createItemListSchema(
  items: Array<{ name: string; href: string; image?: string | null }>,
  options?: { name?: string; path?: string },
): JsonLd {
  return {
    "@type": "ItemList",
    ...(options?.name ? { name: options.name } : {}),
    ...(options?.path
      ? {
          "@id": `${absoluteUrl(options.path)}#itemlist`,
          url: absoluteUrl(options.path),
        }
      : {}),
    numberOfItems: items.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.href),
      ...(imageUrl(item.image) ? { image: imageUrl(item.image) } : {}),
    })),
  };
}

export function createCollectionPageSchema(options: {
  name: string;
  description: string;
  path: string;
  breadcrumbId?: string;
}): JsonLd {
  return {
    "@type": "CollectionPage",
    "@id": `${absoluteUrl(options.path)}#page`,
    url: absoluteUrl(options.path),
    name: options.name,
    description: options.description,
    isPartOf: { "@id": `${absoluteUrl("/")}#website` },
    ...(options.breadcrumbId ? { breadcrumb: { "@id": options.breadcrumbId } } : {}),
  };
}

export function createArticleSchema(guide: {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  image: string;
  imageAlt: string;
  locations: string[];
}): JsonLd {
  return {
    "@type": "Article",
    "@id": `${absoluteUrl(`/guides/${guide.slug}`)}#article`,
    headline: guide.title,
    description: guide.excerpt,
    url: absoluteUrl(`/guides/${guide.slug}`),
    mainEntityOfPage: { "@id": `${absoluteUrl(`/guides/${guide.slug}`)}#page` },
    image: imageUrl(guide.image) ?? undefined,
    author: {
      "@type": "Organization",
      name: guide.author,
      // TODO(business-data): swap for a real `Person` node with a public profile
      // URL once a named writer exists. A brand byline is truthful as-is.
      url: absoluteUrl("/about"),
    },
    publisher: { "@id": `${absoluteUrl("/")}#organization` },
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    inLanguage: SITE.lang,
    about: guide.locations.map((slug) => ({
      "@type": "Place",
      name: slug,
    })),
  };
}

export function createFAQSchema(items: QA[]): JsonLd | null {
  if (!items.length) return null;
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function createAboutPageSchema(options: { name: string; description: string; path: string }): JsonLd {
  return {
    "@type": "AboutPage",
    "@id": `${absoluteUrl(options.path)}#page`,
    url: absoluteUrl(options.path),
    name: options.name,
    description: options.description,
    isPartOf: { "@id": `${absoluteUrl("/")}#website` },
    about: { "@id": `${absoluteUrl("/")}#organization` },
  };
}

export function createContactPageSchema(options: { name: string; description: string; path: string }): JsonLd {
  return {
    "@type": "ContactPage",
    "@id": `${absoluteUrl(options.path)}#page`,
    url: absoluteUrl(options.path),
    name: options.name,
    description: options.description,
    isPartOf: { "@id": `${absoluteUrl("/")}#website` },
  };
}

/* ── Graph assembly ──────────────────────────────────────────────────── */

/** Wraps nodes in a single `@graph`, de-duplicating by `@id`. */
export function graph(...nodes: Array<JsonLd | null | undefined>): JsonLd {
  const seen = new Set<string>();
  const unique = nodes.filter((node): node is JsonLd => Boolean(node)).filter((node) => {
    const id = typeof node["@id"] === "string" ? node["@id"] : null;
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return { "@context": "https://schema.org", "@graph": unique };
}

/** Convenience for a single node without an `@graph` wrapper. */
export function node(value: JsonLd): JsonLd {
  return { "@context": "https://schema.org", ...value };
}

/**
 * Property-page graph: listing + offer + destination + breadcrumbs, plus the
 * FAQ block when questions were actually generated.
 */
export function propertyPageSchema(
  property: Property & Record<string, unknown>,
  crumbs: Crumb[],
  faq: QA[],
): JsonLd {
  const location = locationFor(property);
  return graph(
    createPropertySchema(property),
    createOfferSchema(property),
    createVacationRentalSchema(property as never),
    location ? createPlaceSchema(location) : undefined,
    createBreadcrumbSchema(crumbs),
    createFAQSchema(faq),
  );
}

/** Re-exported so pages do not need a second import for the common helpers. */
export { hasPool, isBeachfront, joinList };
