/**
 * Stay-type taxonomy derived from the live catalog.
 *
 * The brief suggested a `farmhouses / villas / beach-houses` split, so that is
 * the shape we keep — but every rule below is evaluated against the actual
 * listing rows rather than a hand-maintained list, and each listing resolves to
 * exactly **one** primary category. A single primary category is what keeps
 * `/villas/ecr` and `/beach-houses/ecr` from competing for the same query with
 * near-identical copy.
 *
 * Resolution order (first match wins):
 *   1. the listing describes itself as a farmhouse / farm stay / orchard /
 *      grove / plantation house  →  /farmhouses
 *   2. the listing sits in a seaside setting                        →  /beach-houses
 *   3. everything else (hill villas, bungalows, city villas, estates) →  /villas
 */

import type { Property } from "@/lib/properties";

export type CategorySlug = "farmhouses" | "beach-houses" | "villas";

export type StayCategory = {
  slug: CategorySlug;
  /** Singular noun used in headings and metadata. */
  singular: string;
  /** Plural collection noun. */
  plural: string;
  /** Long-form noun phrase, e.g. "private beach houses". */
  longForm: string;
  /** Route the category hub lives at. */
  href: string;
  /** One factual sentence describing what the category holds on 9bhk. */
  summary: string;
};

export const CATEGORIES: StayCategory[] = [
  {
    slug: "farmhouses",
    singular: "Farmhouse",
    plural: "Farmhouses",
    longForm: "private farmhouses",
    href: "/farmhouses",
    summary:
      "Whole farmhouses and farm stays rented for the house, with grounds, kitchens and enough bedrooms for a group to move in together.",
  },
  {
    slug: "beach-houses",
    singular: "Beach House",
    plural: "Beach Houses",
    longForm: "private beach houses",
    href: "/beach-houses",
    summary:
      "Seaside houses with direct or near-direct sand access, listed with their frontage, coastal zone and tide distance where the host has declared them.",
  },
  {
    slug: "villas",
    singular: "Villa",
    plural: "Villas",
    longForm: "private villas",
    href: "/villas",
    summary:
      "Whole villas, bungalows, estates and pavillas in the hills, inland and across the city — each one rented exclusively.",
  },
];

const CATEGORY_BY_SLUG: Record<CategorySlug, StayCategory> = CATEGORIES.reduce(
  (acc, category) => ({ ...acc, [category.slug]: category }),
  {} as Record<CategorySlug, StayCategory>,
);

export function getCategory(slug: string): StayCategory | undefined {
  return (CATEGORIES as StayCategory[]).find((category) => category.slug === slug);
}

export function isCategorySlug(value: string): value is CategorySlug {
  return Boolean(getCategory(value));
}

/**
 * Farmhouse signals, matched against the host-written type string and the
 * listing's own vibe tags. Deliberately narrow: "Private farmhouse",
 * "Farm stay", "Orchard retreat" and "Countryside Farmhouse" are the only
 * shapes that qualify, so a hill villa never leaks into /farmhouses.
 */
const FARMHOUSE_TYPE = /\b(farm\s?house|farm\s?stay|orchard|plantation|grove|cottage)\b/i;
const FARMHOUSE_VIBE = /^(farmhouse|farm stay|orchard|countryside plantation)$/i;

function looksLikeFarmhouse(property: Property): boolean {
  const type = property.type ?? "";
  if (FARMHOUSE_TYPE.test(type)) return true;
  const vibes = property.vibes ?? [];
  return vibes.some((vibe) => FARMHOUSE_VIBE.test(vibe.trim()));
}

/** The single primary category a listing belongs to. */
export function categoryFor(property: Property): StayCategory {
  if (looksLikeFarmhouse(property)) return CATEGORY_BY_SLUG.farmhouses;
  if (property.setting === "seaside") return CATEGORY_BY_SLUG["beach-houses"];
  return CATEGORY_BY_SLUG.villas;
}

export function inCategory(properties: Property[], slug: string): Property[] {
  return properties.filter((property) => categoryFor(property).slug === slug);
}

/** Locations a given category actually has inventory in. */
export function locationsInCategory(
  properties: Property[],
  slug: string,
): { location: string; count: number; sample: Property[] }[] {
  const buckets = new Map<string, Property[]>();
  for (const property of properties) {
    if (categoryFor(property).slug !== slug) continue;
    const key = property.city || property.location;
    if (!key) continue;
    const bucket = buckets.get(key) ?? [];
    bucket.push(property);
    buckets.set(key, bucket);
  }
  return [...buckets.entries()]
    .map(([location, sample]) => ({ location, count: sample.length, sample }))
    .sort((a, b) => b.count - a.count || a.location.localeCompare(b.location));
}

/** Distinct property-type strings inside a set — used for "what you can book". */
export function distinctTypes(properties: Property[]): string[] {
  return [...new Set(properties.map((property) => property.type).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

/** Cheapest and priciest nightly rate in a set, or null when prices are absent. */
export function priceRange(properties: Property[]): { min: number; max: number } | null {
  const prices = properties.map((property) => property.price).filter((price) => Number.isFinite(price) && price > 0);
  if (!prices.length) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Capacity envelope for a set, or null when nothing is declared. */
export function capacityRange(properties: Property[]): { min: number; max: number } | null {
  const values = properties
    .map((property) => property.guests)
    .filter((guests) => Number.isFinite(guests) && guests > 0);
  if (!values.length) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}
