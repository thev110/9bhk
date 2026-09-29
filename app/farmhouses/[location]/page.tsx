import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryView, categoryMetadata } from "@/components/seo/category-view";
import { getIndexableProperties } from "@/lib/server/catalog";
import { LOCATIONS, getLocation, locationSlugFor } from "@/lib/seo/locations";
import { categoryFor, getCategory } from "@/lib/seo/taxonomy";

/**
 * `/farmhouses/[location]` — a stay-type × destination page.
 *
 * Two gates, both required before a URL can exist:
 *
 *   1. the segment must resolve to a destination in the location registry —
 *      it is never echoed back, so `/farmhouses/atlantis` 404s instead of rendering
 *      an empty page;
 *   2. the `farmhouses` × destination pairing must clear that destination's own
 *      `minInventory` threshold, so `/villas/ooty` with a single listing never
 *      ships.
 *
 * This is the whitelist that keeps programmatic SEO safe: combinations are
 * only ever *filtered* down to what inventory supports. Nothing is generated
 * from a parameter permutation.
 */
export const revalidate = 3600;
export const dynamicParams = true;

type Params = { params: Promise<{ location: string }> };

const category = getCategory("farmhouses");

/** Listings in this category that belong to the given destination. */
function scopedTo(properties: Awaited<ReturnType<typeof getIndexableProperties>>, slug: string) {
  return properties.filter(
    (property) =>
      locationSlugFor(property) === slug && categoryFor(property).slug === "farmhouses",
  );
}

export async function generateStaticParams() {
  if (!category) return [];
  const properties = await getIndexableProperties();
  const counts = new Map<string, number>();
  for (const property of properties) {
    if (categoryFor(property).slug !== "farmhouses") continue;
    const slug = locationSlugFor(property);
    if (!slug) continue;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return LOCATIONS.filter((entry) => (counts.get(entry.slug) ?? 0) >= entry.minInventory).map((entry) => ({
    location: entry.slug,
  }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { location: segment } = await params;
  const location = getLocation(segment);
  if (!category || !location) return { robots: { index: false, follow: true } };

  const properties = await getIndexableProperties();
  const scoped = scopedTo(properties, location.slug);
  if (scoped.length < location.minInventory) return { robots: { index: false, follow: true } };

  return categoryMetadata(category, scoped, [], location);
}

export default async function CategoryLocationPage({ params }: Params) {
  const { location: segment } = await params;
  const location = getLocation(segment);
  if (!category || !location) notFound();

  const properties = await getIndexableProperties();
  const scoped = scopedTo(properties, location.slug);
  // A real 404 for an under-populated pairing, not a thin indexable page.
  if (scoped.length < location.minInventory) notFound();

  return (
    <CategoryView
      category={category}
      properties={scoped}
      allProperties={properties}
      location={location}
      locationSummaries={[]}
    />
  );
}
