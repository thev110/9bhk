import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryView, categoryMetadata } from "@/components/seo/category-view";
import { getIndexableProperties } from "@/lib/server/catalog";
import { categoryLocationSummaries } from "@/lib/seo/locations";
import { categoryFor, getCategory, inCategory } from "@/lib/seo/taxonomy";

/**
 * `/farmhouses` — the farmhouses collection hub.
 *
 * The page exists only while the collection has inventory. With none it
 * returns a real 404 and drops out of the sitemap, rather than serving a thin
 * keyword page that would compete with the other two hubs.
 */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const category = getCategory("farmhouses");
  if (!category) return {};
  const properties = await getIndexableProperties();
  const scoped = inCategory(properties, category.slug);
  if (!scoped.length) return { robots: { index: false, follow: true } };
  return categoryMetadata(
    category,
    scoped,
    categoryLocationSummaries(properties, (property) => categoryFor(property).slug === category.slug),
  );
}

export default async function CategoryHubPage() {
  const category = getCategory("farmhouses");
  if (!category) notFound();

  const properties = await getIndexableProperties();
  const scoped = inCategory(properties, category.slug);
  if (!scoped.length) notFound();

  return (
    <CategoryView
      category={category}
      properties={scoped}
      allProperties={properties}
      locationSummaries={categoryLocationSummaries(properties, (property) => {
        return categoryFor(property).slug === category.slug;
      })}
    />
  );
}
