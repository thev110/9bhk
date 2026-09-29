/**
 * Centralised metadata system.
 *
 * One `buildMetadata()` core, then one generator per page type. Titles are
 * assembled from real listing and inventory values with a length guard, so a
 * long property name cannot silently push the brand out of the title and two
 * listings can never collide on the same string.
 *
 * Every generator returns a self-canonical page. Nothing canonicalises to the
 * homepage, and query-driven views opt out through `noindexMetadata()`.
 */

import type { Metadata } from "next";
import type { Property } from "@/lib/properties";
import { capacityBand, hasPool, inr, isBeachfront, joinList, listingCount, priceBand } from "@/lib/seo/copy";
import { locationFor, type LocationEntry, type LocationSummary } from "@/lib/seo/locations";
import { categoryFor, type StayCategory } from "@/lib/seo/taxonomy";
import { absoluteUrl, resolveCanonical, SITE, SITE_URL, siteVerification } from "@/lib/seo/site";
import type { Guide } from "@/lib/content/guides";

/** Clamp a title to a SERF-safe length without cutting mid-word when avoidable. */
function clampTitle(value: string, max = 62): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/** Clamp a description to the ~155–160 char window search engines render. */
function clampDescription(value: string, max = 158): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, "")}…`;
}

export type BuildOptions = {
  title: string;
  description: string;
  /** Site-relative path; the canonical is derived from it. */
  path: string;
  image?: string | null;
  imageAlt?: string;
  /**
   * Open Graph type. `website` for collections and hubs, `article` for guides.
   * Product pages deliberately use `website`: a rental listing is not a retail
   * product and claiming otherwise in OG is a mismatch with the `Product` node
   * we do emit in JSON-LD for a different reason (semantic legibility).
   */
  type?: "website" | "article" | "profile";
  noindex?: boolean;
  /** Editor-supplied canonical override. */
  canonical?: string | null;
  publishedTime?: string;
  modifiedTime?: string;
  /** Extra keywords are deliberately not supported — see AUDIT.md. */
};

/**
 * Intrinsic dimensions of the Open Graph images this site ships.
 *
 * `og:image:width` and `og:image:height` used to be hard-coded to 1200x630,
 * which is the conventional landscape social card. The actual catalog images
 * are not that shape: `prop-palm-grove.jpg` is 800x1000 portrait and
 * `prop-blue-horizon.jpg` is 640x640 square, so every page on the site was
 * asserting dimensions that contradicted the file it pointed at. Scrapers that
 * trust the declared size rather than reading the image render the card wrong.
 *
 * The real sizes are listed here so the declaration is true. An image that is
 * not in the table gets **no** width/height at all rather than a guess — an
 * absent dimension is ignored by every consumer, a wrong one is acted upon.
 */
const OG_IMAGE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "/assets/prop-palm-grove.jpg": { width: 800, height: 1000 },
  "/assets/prop-blue-horizon.jpg": { width: 640, height: 640 },
  "/logo-wordmark.png": { width: 1200, height: 630 },
};

function ogImage(url: string, alt: string) {
  const path = url.replace(SITE_URL, "");
  const dimensions = OG_IMAGE_DIMENSIONS[path];
  const type = path.endsWith(".png") ? "image/png" : "image/jpeg";
  return {
    url,
    alt,
    type,
    ...(dimensions ? { width: dimensions.width, height: dimensions.height } : {}),
  };
}

/**
 * Single metadata factory. Every indexable page goes through here so canonical
 * handling, Open Graph, Twitter cards and robots directives stay consistent.
 */
export function buildMetadata(options: BuildOptions): Metadata {
  const title = clampTitle(options.title);
  const description = clampDescription(options.description);
  const canonical = resolveCanonical(options.canonical ?? options.path);
  const image = options.image ? absoluteUrl(options.image) : absoluteUrl("/logo-wordmark.png");
  const imageAlt = options.imageAlt ?? `${SITE.name} — ${SITE.description}`;

  return {
    /*
     * `absolute` opts out of the root layout's `%s · 9bhk.app` template.
     * Every generator here already ends its title with the brand token, so
     * without this the rendered title would read "… | 9bhk · 9bhk.app".
     */
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: options.noindex
      ? { index: false, follow: true, "max-image-preview": "large", "max-snippet": -1 }
      : {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
    openGraph: {
      type: options.type ?? "website",
      url: canonical,
      siteName: SITE.displayName,
      title,
      description,
      locale: SITE.locale,
      images: [ogImage(image, imageAlt)],
      ...(options.publishedTime ? { publishedTime: options.publishedTime } : {}),
      ...(options.modifiedTime ? { modifiedTime: options.modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

/**
 * Metadata for anything that must not be indexed: private areas, query-driven
 * views, sort/filter permutations. `follow` is kept on so link equity still
 * flows out of these pages into the indexable ones.
 */
export function noindexMetadata(title: string, description: string, path: string): Metadata {
  return buildMetadata({ title, description, path, noindex: true });
}

/* ── Per-page generators ─────────────────────────────────────────────── */

export function generateHomeMetadata(properties: Property[]): Metadata {
  const coastal = properties.filter((property) => property.setting === "seaside").length;
  const destinations = [...new Set(properties.map((property) => property.city).filter(Boolean))];
  const capacity = capacityBand(properties);
  const band = priceBand(properties);

  const description = clampDescription(
    `9bhk is a marketplace for private farmhouses, beach houses and villas across the Chennai coast, ECR, Pondicherry and the Tamil Nadu hills. ${
      properties.length
        ? `${properties.length} whole houses listed${
            capacity ? `, sleeping ${capacity}` : ""
          }${band ? `, from ${band}` : ""}.`
        : ""
    }${coastal ? ` ${coastal} sit on the coast.` : ""} Book the whole house.`,
  );

  return buildMetadata({
    title: "Private Farmhouses, Beach Houses & Villas in Chennai & ECR",
    description,
    path: "/",
    image: "/assets/prop-palm-grove.jpg",
    imageAlt: "Private pool and lawn at a 9bhk farmhouse stay",
  });
}

export function generateStaysMetadata(properties: Property[]): Metadata {
  return buildMetadata({
    title: `All private stays on 9bhk — ${listingCount(properties.length, "listing", "listings")}`,
    description: clampDescription(
      `Browse every whole-house stay on 9bhk: ${
        capacityBand(properties) ?? "varying capacity"
      }, ${
        priceBand(properties) ?? "nightly rates on request"
      }, across the Chennai coast, ECR, Pondicherry and the hills.`,
    ),
    path: "/stays",
    image: "/assets/prop-blue-horizon.jpg",
    imageAlt: "Coastal stay on 9bhk",
  });
}

export function generateCategoryMetadata(
  category: StayCategory,
  properties: Property[],
  locations: LocationSummary[],
  location?: LocationEntry,
): Metadata {
  const where = location ? location.name : locations.map((summary) => summary.entry.name).slice(0, 3).join(", ");
  const title = location
    ? `${category.plural} in ${where} — ${listingCount(properties.length, "stay", "stays")}`
    : `${category.plural} near Chennai & along the coast — ${listingCount(properties.length, "stay", "stays")}`;
  const path = location ? `${category.href}/${location.slug}` : category.href;

  const description = clampDescription(
    `${listingCount(properties.length, category.singular, category.plural)} on 9bhk${
      location ? ` in ${where}` : where ? ` across ${where}` : ""
    }. ${
      capacityBand(properties) ? `Sleeps ${capacityBand(properties)}.` : ""
    } ${
      priceBand(properties) ? `${capitaliseFirst(priceBand(properties) ?? "")}.` : ""
    } Whole house, exclusive use.`,
  );

  return buildMetadata({
    title,
    description,
    path,
    image: properties[0]?.image ?? "/assets/prop-palm-grove.jpg",
    imageAlt: properties[0]?.alt ?? `${category.plural} on 9bhk`,
  });
}

export function generateLocationMetadata(
  location: LocationEntry,
  properties: Property[],
  categories: StayCategory[],
): Metadata {
  const title = `Private stays in ${location.name} — ${listingCount(properties.length, "listing", "listings")}`;
  const description = clampDescription(
    `${listingCount(properties.length, "stay", "stays")} in ${location.name}, ${location.region}: ${
      capacityBand(properties) ?? "whole houses"
    }${priceBand(properties) ? `, ${priceBand(properties)}` : ""}. ${
      categories.length
        ? `${capitaliseFirst(joinList(categories.map((category) => category.plural.toLowerCase())))} available.`
        : ""
    }`,
  );

  return buildMetadata({
    title,
    description,
    path: `/locations/${location.slug}`,
    image: properties[0]?.image ?? "/assets/prop-blue-horizon.jpg",
    imageAlt: properties[0]?.alt ?? `Private stays in ${location.name}`,
  });
}

export function generateLocationsIndexMetadata(summaries: LocationSummary[]): Metadata {
  return buildMetadata({
    title: "Destinations — where 9bhk has private stays",
    description: clampDescription(
      `Every destination with inventory on 9bhk: ${joinList(
        summaries.map((summary) => `${summary.entry.name} (${summary.count})`),
      )}. Coastal, hill-station and countryside stays across Tamil Nadu and Puducherry.`,
    ),
    path: "/locations",
    image: "/assets/prop-blue-horizon.jpg",
    imageAlt: "Coastal destination on 9bhk",
  });
}

export function generatePropertyMetadata(property: Property): Metadata {
  const location = locationFor(property);
  const category = categoryFor(property);
  const where = location?.name ?? property.city ?? property.location;

  /*
   * Target title shape: "[NAME] — [TYPE] in [DESTINATION] | 9bhk".
   *
   * The capacity facets that used to be appended pushed long property names past
   * 70 characters, where Google truncates mid-word. Capacity is not a
   * title-worthy differentiator for this catalog — every listing is a
   * multi-bedroom whole house, so the facet repeated the same information on
   * every page while costing the brand token its space. Capacity, pool,
   * frontage and event capacity all live in the description and the quick-facts
   * block instead, where they are still visible to a crawler.
   */
  /*
   * Degrade rather than truncate. A long listing name pushes the property type
   * past the SERP width, and clamping mid-string cost the page its brand token
   * ("… in ECR |…"). Three tiers, longest first, each still unique because the
   * listing name is unique:
   *
   *   1. Name — Type in Destination | 9bhk.app
   *   2. Name in Destination | 9bhk.app
   *   3. Name | 9bhk.app
   */
  const tiers = [
    where && property.type ? `${property.name} — ${property.type} in ${where} | ${SITE.displayName}` : "",
    where ? `${property.name} in ${where} | ${SITE.displayName}` : "",
    `${property.name} | ${SITE.displayName}`,
  ].filter(Boolean);
  const title = tiers.find((candidate) => candidate.length <= 62) ?? clampTitle(tiers[tiers.length - 1]);

  const facts: string[] = [];
  if (property.guests > 0) facts.push(`sleeps ${property.guests}`);
  if (property.bedrooms > 0) facts.push(`${property.bedrooms} bedrooms`);
  if (property.bathrooms > 0) facts.push(`${property.bathrooms} bathrooms`);
  if (hasPool(property)) facts.push("private pool");
  if (isBeachfront(property) && property.beachFrontage) facts.push(property.beachFrontage);
  if (property.garage) facts.push(`${property.garage.capacity}-car garage`);
  if (property.celebration) facts.push(`hosts up to ${property.celebration.maxEventGuests}`);

  /*
   * The nightly rate is its own sentence, not a list item. Joining it into the
   * comma list produced "…private pool and 8,500 a night" — a price glued to a
   * feature with no currency symbol, which is both wrong to read and wrong to
   * quote in a search result.
   */
  const rate = property.price > 0 ? `${inr(property.price)} a night, whole house.` : "";
  const sale = property.isForSale && property.salePrice
    ? ` Also offered for sale at ${inr(property.salePrice)}.`
    : "";

  const description = clampDescription(
    `${property.name}: ${property.type.toLowerCase()}${where ? ` in ${where}` : ""}. ${
      facts.length ? `${joinList(facts).replace(/^./, (c) => c.toUpperCase())}. ` : ""
    }${rate ? `${rate} ` : ""}${property.blurb ? `${property.blurb.split(". ")[0]}.` : ""}`.trim(),
  );

  return buildMetadata({
    title,
    description,
    path: `/property/${property.id}`,
    image: property.image,
    imageAlt: property.alt,
  });
}

export function generateGuideMetadata(guide: Guide): Metadata {
  const title = guide.seoTitle ?? `${guide.title} | ${SITE.displayName}`;
  const description = guide.seoDescription ?? guide.excerpt;
  return buildMetadata({
    title,
    description,
    path: `/guides/${guide.slug}`,
    image: guide.image,
    imageAlt: guide.imageAlt,
    type: "article",
    canonical: guide.canonical ?? null,
    noindex: guide.noindex,
    publishedTime: guide.publishedAt,
    modifiedTime: guide.updatedAt,
  });
}

export function generateGuidesIndexMetadata(count: number): Metadata {
  return buildMetadata({
    title: "Guides — planning a private stay on 9bhk",
    description: clampDescription(
      `${count} guides on choosing, comparing and booking private farmhouses, beach houses and villas across the Chennai coast, ECR, Pondicherry and the hills.`,
    ),
    path: "/guides",
    image: "/assets/prop-sunset-fields.jpg",
    imageAlt: "9bhk travel guide",
  });
}

export function generateFaqMetadata(count: number): Metadata {
  return buildMetadata({
    title: "Frequently asked questions about booking on 9bhk",
    description: clampDescription(
      `How 9bhk works: whole-house private stays, booking requests, host confirmation, payment, refunds and cancellations. ${count} answers covering the questions guests ask most.`,
    ),
    path: "/faq",
    image: "/logo-wordmark.png",
    imageAlt: `${SITE.name} frequently asked questions`,
  });
}

export function generateAboutMetadata(): Metadata {
  return buildMetadata({
    title: `About ${SITE.name} — a marketplace for private whole-house stays`,
    description: clampDescription(
      `What ${SITE.name} is, who it serves, where it operates and how a listing is published. Every field on a 9bhk listing is entered by the host who owns the house.`,
    ),
    path: "/about",
    image: "/logo-wordmark.png",
    imageAlt: `About ${SITE.name}`,
  });
}

export function generateContactMetadata(): Metadata {
  return buildMetadata({
    title: `Contact ${SITE.name}`,
    description: `Reach the ${SITE.name} team about a listing, a booking or a stay. Email ${SITE.email}.`,
    path: "/contact",
    image: "/logo-wordmark.png",
    imageAlt: `Contact ${SITE.name}`,
  });
}

export function generateBuyMetadata(count: number): Metadata {
  return buildMetadata({
    title: `Estates for sale — ${listingCount(count, "property", "properties")} on 9bhk`,
    description: clampDescription(
      `Whole estates offered for sale through ${SITE.name}, with asking price and land area on the listing. ${count} currently on the market alongside the stays bookable by the night.`,
    ),
    path: "/buy",
    image: "/assets/prop-verde-meadow.jpg",
    imageAlt: "Estate listed for sale on 9bhk",
  });
}

function capitaliseFirst(value: string): string {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}

/** Root-layout defaults: brand, verification, and the site-wide entity. */
export const rootMetadataBase: Pick<Metadata, "verification"> = { verification: siteVerification };
