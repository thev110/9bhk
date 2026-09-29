/**
 * Internal-linking engine.
 *
 * The brief's example graph —
 *   Property → ECR Farmhouses → ECR Beach Houses → ECR guide → similar stays
 * — is produced here from live inventory rather than hand-written per page, so
 * the graph repairs itself when a listing is added, moved or re-categorised.
 *
 * Scoring is a weighted sum rather than a sort-by-key so a "similar" stay is
 * genuinely comparable: same destination first, then same stay type, then
 * capacity proximity, then the features a group actually shops on.
 */

import type { Property } from "@/lib/properties";
import { hasBonfire, hasPool, isBeachfront } from "@/lib/seo/copy";
import { locationFor } from "@/lib/seo/locations";
import { categoryFor } from "@/lib/seo/taxonomy";

/** Weight table. Location dominates because proximity is the strongest signal. */
const WEIGHTS = {
  sameLocation: 40,
  sameCategory: 22,
  sameSetting: 12,
  capacityProximity: 10,
  priceProximity: 8,
  poolMatch: 4,
  bonfireMatch: 3,
  beachMatch: 6,
  eventCapable: 5,
  forSaleMatch: 2,
} as const;

function capacityDistance(a: number, b: number): number {
  return Math.abs(a - b);
}

function priceDistance(a: number, b: number): number {
  if (!a || !b) return 0;
  const ratio = Math.abs(a - b) / Math.max(a, b);
  return Math.max(0, 1 - ratio);
}

/** Relevance score between two listings. Higher is a better internal link. */
export function similarity(a: Property, b: Property): number {
  if (a.id === b.id) return -1;
  let score = 0;
  if (locationFor(a)?.slug && locationFor(a)?.slug === locationFor(b)?.slug) score += WEIGHTS.sameLocation;
  if (categoryFor(a).slug === categoryFor(b).slug) score += WEIGHTS.sameCategory;
  if (a.setting === b.setting) score += WEIGHTS.sameSetting;
  score += WEIGHTS.capacityProximity * (1 - Math.min(1, capacityDistance(a.guests, b.guests) / 8));
  score += WEIGHTS.priceProximity * priceDistance(a.price, b.price);
  if (hasPool(a) === hasPool(b)) score += WEIGHTS.poolMatch;
  if (hasBonfire(a) === hasBonfire(b)) score += WEIGHTS.bonfireMatch;
  if (isBeachfront(a) === isBeachfront(b)) score += WEIGHTS.beachMatch;
  if (Boolean(a.celebration) === Boolean(b.celebration)) score += WEIGHTS.eventCapable;
  if (Boolean(a.isForSale) === Boolean(b.isForSale)) score += WEIGHTS.forSaleMatch;
  return score;
}

/** The `count` most comparable listings to `property`, excluding itself. */
export function relatedProperties(property: Property, all: Property[], count = 4): Property[] {
  return all
    .filter((candidate) => candidate.id !== property.id)
    .map((candidate) => ({ candidate, score: similarity(property, candidate) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name))
    .slice(0, count)
    .map((entry) => entry.candidate);
}

/**
 * Backfill: when a listing is short of same-destination neighbours, top the
 * list up with the closest listings elsewhere so a property page never renders
 * an empty "you may also like" block.
 */
export function relatedWithFallback(property: Property, all: Property[], count = 4): Property[] {
  const primary = relatedProperties(property, all, count);
  if (primary.length >= count) return primary;
  const seen = new Set([property.id, ...primary.map((item) => item.id)]);
  const filler = all
    .filter((candidate) => !seen.has(candidate.id))
    .sort((a, b) => similarity(property, b) - similarity(property, a))
    .slice(0, count - primary.length);
  return [...primary, ...filler];
}

/**
 * The internal-link payload for a property page, in one call so a new page
 * template never has to remember which links a listing owes the site graph.
 *
 * Guide links are deliberately absent: there is no `/guides` route and no guide
 * registry in the repository, so a `guides` key here could only ever be an empty
 * array. When guides land, add them back here rather than at the call site, so
 * the graph stays data-driven.
 */
export function propertyLinkGraph(property: Property, all: Property[]) {
  const location = locationFor(property);
  const category = categoryFor(property);
  return {
    category,
    location,
    related: relatedWithFallback(property, all, 4),
  };
}
