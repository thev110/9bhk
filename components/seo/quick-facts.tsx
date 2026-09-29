import type { SeoProperty } from "@/lib/catalog-rows";
import { hasBonfire, hasPetFriendly, hasPool, isBeachfront, plural } from "@/lib/seo/copy";
import { locationFor } from "@/lib/seo/locations";
import { categoryFor } from "@/lib/seo/taxonomy";

export type Fact = { label: string; value: string; href?: string };

/**
 * "Quick Facts" — the scannable spec block.
 *
 * Built by `propertyFacts()` / `collectionFacts()`, both of which append a row
 * only when the underlying value exists. A listing with no pool, no frontage
 * and no event capacity produces a shorter table, never a `—` filler row. That
 * omission rule is what keeps the block truthful rather than decorative.
 */
export function QuickFacts({
  facts,
  heading = "Quick facts",
  columns = 3,
}: {
  facts: Fact[];
  heading?: string;
  columns?: 2 | 3 | 4;
}) {
  if (!facts.length) return null;
  return (
    <section className="seo-facts" aria-labelledby="quick-facts-heading">
      <h2 id="quick-facts-heading" className="seo-h3">
        {heading}
      </h2>
      <dl className="seo-facts-grid" data-cols={columns}>
        {facts.map((fact) => (
          <div className="seo-fact" key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Spec rows for a single listing. */
export function propertyFacts(property: SeoProperty): Fact[] {
  const location = locationFor(property);
  const facts: Fact[] = [];

  if (location) {
    /*
     * `property.location` is a free-text line that usually already opens with
     * the destination name ("ECR · Mahabalipuram Coastal Strip"). Prepending
     * the name again produced "ECR · ECR · Mahabalipuram Coastal Strip", so the
     * name is only added when the line does not already contain it.
     */
    const line = property.location?.trim() ?? "";
    const value = !line
      ? location.name
      : line.toLowerCase().includes(location.name.toLowerCase())
        ? line
        : `${location.name} · ${line}`;
    facts.push({ label: "Location", value, href: `/locations/${location.slug}` });
  } else if (property.city || property.location) {
    facts.push({ label: "Location", value: property.city || property.location });
  }

  if (property.settingDetail) facts.push({ label: "Setting", value: property.settingDetail });
  if (property.type) facts.push({ label: "Property type", value: property.type });
  if (property.guests > 0) facts.push({ label: "Guests", value: plural(property.guests, "guest", "guests") });
  if (property.bedrooms > 0) facts.push({ label: "Bedrooms", value: plural(property.bedrooms, "bedroom") });
  if (property.beds > 0) facts.push({ label: "Beds", value: plural(property.beds, "bed") });
  if (property.bathrooms > 0) facts.push({ label: "Bathrooms", value: plural(property.bathrooms, "bathroom") });

  if (hasPool(property)) facts.push({ label: "Pool", value: "Private pool" });
  if (isBeachfront(property)) {
    facts.push({ label: "Beach access", value: property.beachFrontage ?? "Private sand access" });
  }
  if (property.coastalZone) facts.push({ label: "Coastal zone", value: property.coastalZone });
  if (property.tideDistanceMeters) {
    facts.push({ label: "High-tide line", value: `${property.tideDistanceMeters} m away` });
  }
  if (property.garage) {
    facts.push({
      label: "Parking",
      value: `${plural(property.garage.capacity, "vehicle")} · ${property.garage.name}`,
    });
  }
  if (property.celebration) {
    facts.push({
      label: "Event capacity",
      value: `Up to ${plural(property.celebration.maxEventGuests, "guest", "guests")}`,
    });
  }
  if (property.landArea) facts.push({ label: "Land", value: property.landArea });
  if (property.minStay) facts.push({ label: "Minimum stay", value: plural(property.minStay, "night") });
  if (hasBonfire(property)) facts.push({ label: "Outdoor fire", value: "Bonfire or barbecue" });
  if (hasPetFriendly(property)) facts.push({ label: "Pets", value: "Pet friendly" });

  if (property.price > 0) {
    facts.push({ label: "Stay", value: `₹${property.price.toLocaleString("en-IN")} a night` });
  }
  if (property.cleaning > 0) {
    facts.push({ label: "Cleaning", value: `₹${property.cleaning.toLocaleString("en-IN")} per stay` });
  }
  if (property.isForSale && property.salePrice) {
    facts.push({ label: "Asking price", value: `₹${property.salePrice.toLocaleString("en-IN")}` });
  }

  facts.push({
    label: "Category",
    value: categoryFor(property).plural,
    href: categoryFor(property).href,
  });

  if (property.verification?.status === "verified") {
    facts.push({ label: "Verification", value: property.verification.type ?? "Verified by 9bhk" });
  }

  return facts;
}

/** Aggregate rows for a collection, derived from the collection itself. */
export function collectionFacts(
  properties: SeoProperty[],
  options: { locationName?: string; categoryName?: string },
): Fact[] {
  const facts: Fact[] = [];
  const guests = properties.map((property) => property.guests).filter(Boolean);
  const bedrooms = properties.map((property) => property.bedrooms).filter(Boolean);
  const prices = properties.map((property) => property.price).filter((price) => price > 0);

  if (options.locationName) facts.push({ label: "Destination", value: options.locationName });
  if (options.categoryName) facts.push({ label: "Stay type", value: options.categoryName });
  facts.push({ label: "Listings", value: String(properties.length) });

  if (guests.length) {
    const min = Math.min(...guests);
    const max = Math.max(...guests);
    facts.push({
      label: "Capacity",
      value: min === max ? plural(min, "guest", "guests") : `${min}–${max} guests`,
    });
  }
  if (bedrooms.length) {
    const min = Math.min(...bedrooms);
    const max = Math.max(...bedrooms);
    facts.push({
      label: "Bedrooms",
      value: min === max ? plural(min, "bedroom") : `${min}–${max} bedrooms`,
    });
  }
  if (prices.length) {
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    facts.push({
      label: "Nightly rate",
      value: min === max ? `₹${min.toLocaleString("en-IN")}` : `₹${min.toLocaleString("en-IN")}–₹${max.toLocaleString("en-IN")}`,
    });
  }

  const poolCount = properties.filter(hasPool).length;
  if (poolCount) facts.push({ label: "With a pool", value: `${poolCount} of ${properties.length}` });

  const beachCount = properties.filter(isBeachfront).length;
  if (beachCount) facts.push({ label: "Beach access", value: `${beachCount} of ${properties.length}` });

  const eventCount = properties.filter((property) => property.celebration).length;
  if (eventCount) {
    facts.push({ label: "Event-capable", value: `${eventCount} of ${properties.length}` });
  }

  return facts;
}
