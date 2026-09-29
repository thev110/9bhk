/**
 * Breadcrumb trails.
 *
 * Built centrally so the visible trail and the `BreadcrumbList` JSON-LD are
 * generated from the same array and can never disagree — a mismatch between
 * the two is one of the easiest ways to lose a breadcrumb rich result.
 */

import type { Crumb } from "@/lib/seo/schema";
import { locationFor } from "@/lib/seo/locations";
import { categoryFor } from "@/lib/seo/taxonomy";
import type { Property } from "@/lib/properties";
import { SITE } from "@/lib/seo/site";

export const HOME_CRUMB: Crumb = { name: "Home", href: "/" };

/** `[Home]` — for a page that sits directly under the root. */
export function HomeCrumbs(): Crumb[] {
  return [HOME_CRUMB];
}

export function crumb(name: string, href: string): Crumb {
  return { name, href };
}

/** Home → Stays → Category → Destination → Listing. */
export function propertyCrumbs(property: Property): Crumb[] {
  const category = categoryFor(property);
  const location = locationFor(property);
  const crumbs: Crumb[] = [HOME_CRUMB, crumb("Stays", "/stays"), crumb(category.plural, category.href)];
  if (location) crumbs.push(crumb(location.name, `/locations/${location.slug}`));
  crumbs.push(crumb(property.name, `/property/${property.id}`));
  return crumbs;
}

/** Home → Category → Destination. */
export function categoryCrumbs(
  category: { plural: string; href: string },
  location?: { name: string; slug: string },
): Crumb[] {
  const crumbs: Crumb[] = [HOME_CRUMB, crumb(category.plural, category.href)];
  if (location) crumbs.push(crumb(location.name, `/locations/${location.slug}`));
  return crumbs;
}

/** Home → Locations → Destination. */
export function locationCrumbs(location: { name: string; slug: string }): Crumb[] {
  return [HOME_CRUMB, crumb("Locations", "/locations"), crumb(location.name, `/locations/${location.slug}`)];
}

/** Home → Guides → Guide. */
export function guideCrumbs(guide: { title: string; slug: string }): Crumb[] {
  return [HOME_CRUMB, crumb("Guides", "/guides"), crumb(guide.title, `/guides/${guide.slug}`)];
}

export function staticCrumbs(name: string, path: string): Crumb[] {
  return [HOME_CRUMB, crumb(name, path)];
}

export function categoryIndexCrumbs(): Crumb[] {
  return [HOME_CRUMB];
}

/** `id` reference for the breadcrumb node, used to cross-link a page node. */
export function breadcrumbId(crumbs: Crumb[]): string {
  return `${crumbs[crumbs.length - 1]?.href ?? "/"}#breadcrumb`;
}

export { SITE };
