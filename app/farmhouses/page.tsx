import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryView, categoryMetadata } from "@/components/seo/category-view";
import { CollectionEmptyState } from "@/components/seo/collection-empty";
import { EditorialShell } from "@/components/seo/page-frame";
import { getIndexableProperties } from "@/lib/server/catalog";
import { categoryLocationSummaries } from "@/lib/seo/locations";
import { categoryFor, getCategory, inCategory } from "@/lib/seo/taxonomy";

/**
 * `/farmhouses` — the farmhouses collection hub.
 *
 * With no published inventory the hub still answers 200 (it is linked from the
 * site header) and renders an empty state with a host CTA, but stays noindex
 * and out of the sitemap, so it never competes as a thin keyword page.
 */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const category = getCategory("farmhouses");
  if (!category) return {};
  const properties = await getIndexableProperties();
  const scoped = inCategory(properties, category.slug);
  if (!scoped.length) return { title: `${category.plural} coming soon`, robots: { index: false, follow: true } };
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
  if (!scoped.length) {
    return (
      <EditorialShell current={category.href}>
        <CollectionEmptyState titleKey="collection.emptyTitle.farmhouses" />
      </EditorialShell>
    );
  }

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
