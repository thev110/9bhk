/**
 * Factual, data-derived copy builders.
 *
 * Every sentence produced here is assembled from values that already exist in
 * the catalog. Nothing is asserted about inventory the database does not hold:
 * if a listing has no beach frontage, no pool and no event capacity, no
 * sentence in this file will mention one.
 *
 * This is what keeps the new landing pages from becoming keyword pages — the
 * words change when the inventory changes, and an empty result set produces
 * no page at all (see the `minInventory` gates in `lib/seo/locations.ts`).
 */

import { formatInrCrores, type Property } from "@/lib/properties";
import { locationFor, type LocationEntry, type LocationSummary } from "@/lib/seo/locations";
import { capacityRange, priceRange, type StayCategory } from "@/lib/seo/taxonomy";
import { SITE } from "@/lib/seo/site";

const nf = new Intl.NumberFormat("en-IN");

/** `₹9,500` — grouped INR, no decimals. */
export function inr(value: number): string {
  return `₹${nf.format(Math.round(value))}`;
}

/** "4 bedrooms" / "1 bedroom". */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${nf.format(count)} ${count === 1 ? singular : pluralForm}`;
}

/** "sleeps 12" — omitted entirely when the field is absent. */
export function sleepsClause(property: Property): string {
  return property.guests > 0 ? `sleeps ${plural(property.guests, "guest", "guests")}` : "";
}

/** Detects a pool from the amenity strings a host actually wrote. */
export function hasPool(property: Property): boolean {
  return (property.amenities ?? []).some((amenity) => /pool/i.test(amenity));
}

export function hasBonfire(property: Property): boolean {
  return (property.amenities ?? []).some((amenity) => /bonfire|fire pit|campfire|barbecue|bbq/i.test(amenity));
}

export function hasPetFriendly(property: Property): boolean {
  return (property.amenities ?? []).some((amenity) => /pet|dog/i.test(amenity));
}

export function isBeachfront(property: Property): boolean {
  return Boolean(property.beachFrontage) || property.privateBeachAccess === true;
}

/** Number of listings in a set, phrased so it stays true at any size. */
export function listingCount(count: number, singular: string, pluralForm: string): string {
  if (count === 0) return "no listings yet";
  if (count === 1) return `1 ${singular.toLowerCase()}`;
  return `${nf.format(count)} ${pluralForm.toLowerCase()}`;
}

/** Inches of unique, data-derived detail used to build a description. */
function propertyTraits(property: Property): string[] {
  const traits: string[] = [];
  if (property.settingDetail) traits.push(property.settingDetail);
  if (property.bedrooms > 0) traits.push(plural(property.bedrooms, "bedroom"));
  if (property.bathrooms > 0) traits.push(plural(property.bathrooms, "bathroom"));
  if (hasPool(property)) traits.push("a private pool");
  if (isBeachfront(property)) traits.push("private sand access");
  if (property.celebration) {
    traits.push(`a sanctioned event capacity of ${plural(property.celebration.maxEventGuests, "guest", "guests")}`);
  }
  if (property.garage) traits.push(`a ${plural(property.garage.capacity, "car")} garage`);
  if (property.isForSale) traits.push("also available to buy");
  return traits;
}

/** Sentence describing a single listing using only its own fields. */
export function propertySummaryLine(property: Property): string {
  const traits = propertyTraits(property);
  const location = locationFor(property);
  const where = location ? location.name : property.city || property.location;
  const lead = `${property.name} is a ${property.type.toLowerCase()} in ${where}`;
  if (!traits.length) return `${lead}, listed for exclusive stays.`;
  return `${lead} with ${joinList(traits)}.`;
}

/** Two-sentence overview for a property page, built from real fields. */
export function propertyIntro(property: Property): string {
  const parts: string[] = [];
  const where = locationFor(property);
  const place = where ? `${where.name}${property.location && property.location !== where.name ? ` (${property.location})` : ""}` : property.location;
  const capacity = [
    sleepsClause(property),
    property.bedrooms > 0 ? plural(property.bedrooms, "bedroom") : "",
    property.bathrooms > 0 ? plural(property.bathrooms, "bathroom") : "",
  ].filter(Boolean);
  if (capacity.length) parts.push(capacity.join(", "));
  if (property.settingDetail) parts.push(property.settingDetail);
  if (hasPool(property)) parts.push("a private pool");
  if (isBeachfront(property) && property.beachFrontage) parts.push(property.beachFrontage);
  const headline = parts.length ? `${property.name} — ${joinList(parts)}.` : `${property.name} is listed on ${SITE.name}.`;
  const body = property.blurb?.trim();
  return body ? `${headline}\n\n${body}` : headline;
}

/** Nightly-rate band for a set, or null when no price is published. */
export function priceBand(properties: Property[]): string | null {
  const range = priceRange(properties);
  if (!range) return null;
  if (range.min === range.max) return `${inr(range.min)} a night`;
  return `${inr(range.min)}–${inr(range.max)} a night`;
}

/** "6 to 12 guests" / "8 guests". */
export function capacityBand(properties: Property[]): string | null {
  const range = capacityRange(properties);
  if (!range) return null;
  if (range.min === range.max) return plural(range.min, "guest", "guests");
  return `${range.min} to ${range.max} guests`;
}

/** Introduction paragraph for a category hub. */
export function categoryIntro(
  category: StayCategory,
  properties: Property[],
  locations: LocationSummary[],
): string {
  const count = properties.length;
  const placeNames = locations.slice(0, 4).map((summary) => summary.entry.name);
  const band = priceBand(properties);
  const capacity = capacityBand(properties);

  const sentences: string[] = [];
  sentences.push(category.summary);
  if (count > 0) {
    const where = placeNames.length ? ` across ${joinList(placeNames)}` : "";
    sentences.push(
      `${SITE.name} currently lists ${listingCount(count, category.singular, category.plural)}${where} on this page.`,
    );
  }
  const facts: string[] = [];
  if (capacity) facts.push(capacity);
  if (band) facts.push(band);
  if (facts.length) {
    sentences.push(`Across the listings here: ${joinList(facts)}.`);
  }
  return sentences.join(" ");
}

/** Introduction paragraph for a location page. */
export function locationIntro(
  location: LocationEntry,
  properties: Property[],
  categories: StayCategory[],
): string {
  const sentences: string[] = [location.overview];
  if (properties.length) {
    const kinds = [...new Set(properties.map((property) => property.type))];
    const capacity = capacityBand(properties);
    const band = priceBand(properties);
    sentences.push(
      `${SITE.name} lists ${listingCount(properties.length, "stay", "stays")} in ${location.name}${
        kinds.length ? `, ${joinList(kinds.slice(0, 3))}` : ""
      }.`,
    );
    const facts: string[] = [];
    if (capacity) facts.push(capacity);
    if (band) facts.push(band);
    if (facts.length) sentences.push(`${joinList(capitalise(facts))}.`);
  }
  if (categories.length) {
    sentences.push(
      `Browse by stay type: ${categories.map((category) => category.plural.toLowerCase()).join(", ")}.`,
    );
  }
  return sentences.join(" ");
}

/** `["A", "B", "C"]` → `"A, B and C"`. */
export function joinList(items: string[]): string {
  const clean = items.filter(Boolean);
  if (!clean.length) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")} and ${clean[clean.length - 1]}`;
}

export function capitalise(items: string[]): string[] {
  return items.map((item) => (item ? item[0].toUpperCase() + item.slice(1) : item));
}

/** Short label for a price, used in cards and list rows. */
export function priceLabel(property: Property): string {
  if (property.isForSale && property.salePrice) return `${formatInrCrores(property.salePrice)} asking`;
  return `${inr(property.price)} a night`;
}
