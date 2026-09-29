/**
 * Location registry for local / GEO SEO.
 *
 * Two hard rules govern this file:
 *
 *  1. **No invented geography.** Every `overview` and `reach` string below is
 *     structural geography that a traveller can verify on a map (which road a
 *     destination sits on, which state or union territory it belongs to, what
 *     a town is known for). Numeric distances and drive times are deliberately
 *     *not* hard-coded — `distanceFromChennaiKm` and `driveTimeFromChennai`
 *     exist in the type so the business can add verified figures later, and the
 *     UI omits the line entirely while they are `null`.
 *
 *  2. **No page without inventory.** `publishableLocations()` filters the
 *     registry down to destinations that clear `minInventory`, so a URL is
 *     only reachable, canonical and present in the sitemap when it can carry
 *     real listings. Everything else stays out of the sitemap and 404s.
 */

import type { Property } from "@/lib/properties";
import { SITE } from "@/lib/seo/site";

export type LocationKind = "coast" | "city" | "hills" | "countryside";

export type LocationEntry = {
  slug: string;
  name: string;
  /** State or union territory — written out, never abbreviated. */
  region: string;
  country: string;
  kind: LocationKind;
  /** Additional strings that should resolve to this slug (query params, labels). */
  aliases: string[];
  /** Factual, map-verifiable description of the destination. */
  overview: string;
  /** How the destination is reached, described structurally. */
  reach: string;
  /** Other registered slugs that sit in the same travel area. */
  nearby: string[];
  /** Minimum listings required before this destination gets a public page. */
  minInventory: number;
  /**
   * Verified distance/duration from the Chennai base. Left `null` on purpose:
   * TODO(business-data) — fill from the team's own routing data once confirmed
   * so the location page can show a reliable travel-time line.
   */
  distanceFromChennaiKm: number | null;
  driveTimeFromChennai: string | null;
};

export const LOCATIONS: LocationEntry[] = [
  {
    slug: "ecr",
    name: "ECR",
    region: "Tamil Nadu",
    country: "India",
    kind: "coast",
    aliases: ["East Coast Road", "ecr", "ecr road"],
    overview:
      "ECR — the East Coast Road — is the coastal highway that runs south out of Chennai past Kovalam toward Mahabalipuram. The stretch 9bhk lists is dune-and-casuarina country: wide sandy setbacks, village roads running to the sand, and long weekend traffic out of the city.",
    reach:
      "Reached directly from Chennai by the East Coast Road; the coastal stretch sits on the highway itself rather than behind a hill or a river crossing.",
    nearby: ["chennai", "mahabalipuram"],
    minInventory: 2,
    distanceFromChennaiKm: null,
    driveTimeFromChennai: null,
  },
  {
    slug: "chennai",
    name: "Chennai",
    region: "Tamil Nadu",
    country: "India",
    kind: "city",
    aliases: ["madras"],
    overview:
      "Chennai is the capital of Tamil Nadu and the coastal city most of the 9bhk catalog is built around. The listings here split between the northern beach road out towards Neelankarai and Muttukadu, and inner-city neighbourhoods such as Adyar and Velachery.",
    reach:
      "The city is the arrival point for every coastal stay on 9bhk — listings sit between roughly half an hour and a little over an hour out of central Chennai depending on which stretch of the coast they hold.",
    nearby: ["ecr", "kanchipuram", "mahabalipuram"],
    minInventory: 2,
    distanceFromChennaiKm: null,
    driveTimeFromChennai: null,
  },
  {
    slug: "mahabalipuram",
    name: "Mahabalipuram",
    region: "Tamil Nadu",
    country: "India",
    kind: "coast",
    aliases: ["mamallapuram", "mamballapuram"],
    overview:
      "Mahabalipuram — Mamallapuram — is a working fishing and temple town on the Coromandel Coast south of Chennai, known for the Pallava rock-cut monuments and the Shore Temple on its beach. Stays here sit inside or just outside the town limits, close enough to walk to the sand.",
    reach:
      "The last coastal town before the highway turns inland toward Pondicherry, which makes it the natural weekend stop for anyone driving down from Chennai.",
    nearby: ["ecr", "chennai", "pondicherry"],
    minInventory: 2,
    distanceFromChennaiKm: null,
    driveTimeFromChennai: null,
  },
  {
    slug: "pondicherry",
    name: "Pondicherry",
    region: "Puducherry (Union Territory)",
    country: "India",
    kind: "coast",
    aliases: ["puducherry", "pondi"],
    overview:
      "Pondicherry — Puducherry — is a Union Territory on the Coromandel Coast south of Chennai, split between the French-plan White Town, the Promenade beachfront and the quieter Ariyankuppam and Serenity Beach coastline.",
    reach:
      "Reached by the East Coast Road from Chennai or by rail to Pondicherry station; the 9bhk listings sit on the coastal side of the territory rather than in the town centre.",
    nearby: ["mahabalipuram", "chennai"],
    minInventory: 2,
    distanceFromChennaiKm: null,
    driveTimeFromChennai: null,
  },
  {
    slug: "kanchipuram",
    name: "Kanchipuram",
    region: "Tamil Nadu",
    country: "India",
    kind: "countryside",
    aliases: ["kanchi", "kanchi"],
    overview:
      "Kanchipuram is the silk-and-temple city west of Chennai, and the farmland around it is mango and sugarcane country. The 9bhk listings sit on the rural edges — orchards, groves and open fields rather than inside the temple town.",
    reach:
      "Reached inland from Chennai through the western corridor; the stays are country-side, so the last stretch is local road rather than highway.",
    nearby: ["chennai", "hosur"],
    minInventory: 2,
    distanceFromChennaiKm: null,
    driveTimeFromChennai: null,
  },
  {
    slug: "ooty",
    name: "Ooty",
    region: "Tamil Nadu",
    country: "India",
    kind: "hills",
    aliases: ["ootacamund", "udagamandalam"],
    overview:
      "Ooty sits at the top of the Nilgiri Hills, where the air changes and the landscape switches from coast to tea slopes and shola forest. Stays here are built for valley views and long, cool evenings.",
    reach:
      "Reached by road up the Coonoor or Gudalur routes, or by rail to Coimbatore and then up to the hills.",
    nearby: ["kodaikanal", "courtallam"],
    minInventory: 2,
    distanceFromChennaiKm: null,
    driveTimeFromChennai: null,
  },
  {
    slug: "kodaikanal",
    name: "Kodaikanal",
    region: "Tamil Nadu",
    country: "India",
    kind: "hills",
    aliases: ["kodaikonal"],
    overview:
      "Kodaikanal is a smaller hill station in the Palani Hills, higher and quieter than Ooty, with shola-framed viewpoints and a lake at the centre of town.",
    reach:
      "Reached by road from Madurai or Dindigul, or as part of a Nilgiris road trip from Ooty.",
    nearby: ["ooty", "courtallam"],
    minInventory: 2,
    distanceFromChennaiKm: null,
    driveTimeFromChennai: null,
  },
  {
    slug: "courtallam",
    name: "Courtallam",
    region: "Tamil Nadu",
    country: "India",
    kind: "hills",
    aliases: ["kutralam", "kutralamalai"],
    overview:
      "Courtallam is a waterfall town in the Tenkasi hills where the Papanasini river runs through a series of falls and forest pools. It is a monsoon and post-monsoon destination rather than a summer hill station.",
    reach:
      "Reached through Nagercoil and the Western Ghats road, or as part of a longer southern hills loop.",
    nearby: ["kodaikanal", "ooty"],
    minInventory: 2,
    distanceFromChennaiKm: null,
    driveTimeFromChennai: null,
  },
  {
    slug: "hosur",
    name: "Hosur",
    region: "Tamil Nadu",
    country: "India",
    kind: "countryside",
    aliases: [],
    overview:
      "Hosur sits on the Tamil Nadu–Karnataka border in the Krishnagiri district, where the orchards and scrub give way to the Bangalore–Chennai corridor. The 9bhk listing is orchard country outside the town.",
    reach:
      "Reached on the Bangalore–Chennai highway, about an hour-and-a-half out of the city — the shortest drive of any listing on 9bhk.",
    nearby: ["kanchipuram", "chennai"],
    minInventory: 2,
    distanceFromChennaiKm: null,
    driveTimeFromChennai: null,
  },
  {
    slug: "chengalpattu",
    name: "Chengalpattu",
    region: "Tamil Nadu",
    country: "India",
    kind: "countryside",
    aliases: ["chengalpat", "chingleput"],
    overview:
      "Chengalpattu sits south-west of Chennai where the coast gives way to lake and farmland. The single 9bhk listing is an orchard retreat rather than a beach house.",
    reach:
      "Reached off the GST road south-west of Chennai, roughly a two-hour drive depending on traffic.",
    nearby: ["chennai", "ecr"],
    minInventory: 2,
    distanceFromChennaiKm: null,
    driveTimeFromChennai: null,
  },
];

const LOCATION_BY_SLUG: Record<string, LocationEntry> = LOCATIONS.reduce(
  (acc, entry) => ({ ...acc, [entry.slug]: entry }),
  {} as Record<string, LocationEntry>,
);

export function getLocation(slug: string): LocationEntry | undefined {
  return LOCATION_BY_SLUG[slug.toLowerCase().trim()];
}

export function isLocationSlug(value: string): boolean {
  return Boolean(getLocation(value));
}

/**
 * Resolve the registry slug that owns a listing.
 * Prefers the curated `city` value, then falls back to matching the free-text
 * `location` / `settingName` against registered names and aliases.
 */
export function locationFor(property: Property): LocationEntry | undefined {
  const candidates = [property.city, property.location, property.settingName]
    .filter(Boolean)
    .map((value) => value!.toLowerCase());

  for (const candidate of candidates) {
    const direct = LOCATIONS.find((entry) => entry.slug === candidate);
    if (direct) return direct;
  }
  for (const candidate of candidates) {
    const match = LOCATIONS.find(
      (entry) =>
        entry.name.toLowerCase() === candidate ||
        entry.aliases.some((alias) => alias === candidate) ||
        candidate.includes(entry.name.toLowerCase()) ||
        candidate.includes(entry.slug),
    );
    if (match) return match;
  }
  return undefined;
}

/** Listings grouped by their owning destination, keyed by slug. */
export function groupByLocation(properties: Property[]): Map<string, Property[]> {
  const map = new Map<string, Property[]>();
  for (const property of properties) {
    const location = locationFor(property);
    if (!location) continue;
    const bucket = map.get(location.slug) ?? [];
    bucket.push(property);
    map.set(location.slug, bucket);
  }
  return map;
}

export type LocationSummary = {
  entry: LocationEntry;
  count: number;
  properties: Property[];
  /** True when the destination clears its own inventory threshold. */
  publishable: boolean;
};

/** Every registered destination that currently has at least one listing. */
export function locationSummaries(properties: Property[]): LocationSummary[] {
  const grouped = groupByLocation(properties);
  return LOCATIONS.map((entry) => {
    const bucket = (grouped.get(entry.slug) ?? []).filter((property) => property.status !== "draft");
    return {
      entry,
      count: bucket.length,
      properties: bucket,
      publishable: bucket.length >= entry.minInventory,
    };
  }).filter((summary) => summary.count > 0);
}

/** Destinations that clear `minInventory` and therefore get a public page. */
export function publishableLocations(properties: Property[]): LocationSummary[] {
  return locationSummaries(properties).filter((summary) => summary.publishable);
}

/**
 * Category × location pages.
 *
 * A `/farmhouses/ecr` page only exists when that specific pairing clears the
 * destination's own `minInventory` threshold — counting the whole destination
 * would publish pages like `/beach-houses/ooty` with a single listing on them.
 */
export function categoryLocationSummaries(
  properties: Property[],
  predicate: (property: Property) => boolean,
): LocationSummary[] {
  const scoped = properties.filter(predicate);
  const grouped = groupByLocation(scoped);
  return LOCATIONS.map((entry) => {
    const bucket = grouped.get(entry.slug) ?? [];
    return {
      entry,
      count: bucket.length,
      properties: bucket,
      publishable: bucket.length >= entry.minInventory,
    };
  })
    .filter((summary) => summary.count > 0 && summary.publishable);
}

/** Related destinations for the internal-link graph on a location page. */
export function nearbyLocations(slug: string, properties: Property[]): LocationSummary[] {
  const entry = getLocation(slug);
  if (!entry) return [];
  const summaries = locationSummaries(properties);
  const bySlug = new Map(summaries.map((summary) => [summary.entry.slug, summary]));
  const linked = entry.nearby
    .map((nearby) => bySlug.get(nearby))
    .filter((summary): summary is LocationSummary => Boolean(summary));
  const rest = summaries.filter(
    (summary) => summary.entry.slug !== slug && !entry.nearby.includes(summary.entry.slug),
  );
  return [...linked, ...rest].slice(0, 6);
}

/** Human label for a listing's location, used in metadata and quick facts. */
export function locationLabel(property: Property): string {
  const entry = locationFor(property);
  if (entry) return entry.name;
  return property.city || property.location || SITE.name;
}

/**
 * Registry slug for a listing, or `null` when the listing sits somewhere the
 * registry does not cover. Route handlers use this instead of echoing the URL
 * segment back, which is what stops `/villas/atlantis` from rendering a page.
 */
export function locationSlugFor(
  property: Pick<Property, "city" | "location" | "settingName">,
): string | null {
  return locationFor(property as Property)?.slug ?? null;
}
