import type { MetadataRoute } from "next";
import { getIndexableProperties } from "@/lib/server/catalog";
import { CATEGORIES, categoryFor, inCategory } from "@/lib/seo/taxonomy";
import { categoryLocationSummaries, publishableLocations } from "@/lib/seo/locations";
import { CONTENT } from "@/lib/content/guides";
import { absoluteUrl, PRIVATE_ROUTE_PREFIXES } from "@/lib/seo/site";

/**
 * Dynamic sitemap.
 *
 * Everything in this file is computed from live inventory, so publishing a
 * listing or a guide adds its URL on the next revalidation without a redeploy.
 * Three structural guarantees:
 *
 *   • **No private URLs.** `PRIVATE_ROUTE_PREFIXES` is asserted against the
 *     emitted set before it is returned, so a future refactor that accidentally
 *     lists `/host/new` fails loudly in `scripts/seo-audit.mjs` rather than
 *     quietly leaking it.
 *   • **No noindex URLs.** Only listings that clear the `noindex` flag are
 *     included, and destination pages only exist once they clear their
 *     `minInventory` threshold — the same gate the route itself uses, so the
 *     sitemap can never advertise a 404.
 *   • **No thin pages.** Category × destination combinations are only emitted
 *     when that specific pairing has enough listings to justify a page.
 *
 * Re-validated hourly; a `sitemap index` is not needed at this catalog size and
 * is noted in AUDIT.md as the scale threshold to revisit.
 */
export const revalidate = 3600;

type Entry = {
  path: string;
  lastModified?: Date;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority?: number;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await getIndexableProperties();
  const destinations = publishableLocations(properties);
  const destinationSlugs = new Set(destinations.map((summary) => summary.entry.slug));

  const entries: Entry[] = [];

  /* Core surfaces. */
  entries.push({ path: "/", changeFrequency: "daily", priority: 1 });
  entries.push({ path: "/stays", changeFrequency: "daily", priority: 0.9 });
  entries.push({ path: "/locations", changeFrequency: "weekly", priority: 0.6 });
  entries.push({ path: "/guides", changeFrequency: "weekly", priority: 0.6 });
  entries.push({ path: "/faq", changeFrequency: "monthly", priority: 0.5 });
  entries.push({ path: "/about", changeFrequency: "monthly", priority: 0.4 });
  entries.push({ path: "/contact", changeFrequency: "monthly", priority: 0.4 });
  entries.push({ path: "/buy", changeFrequency: "weekly", priority: 0.7 });

  /* Legal. */
  for (const path of ["/legal/terms", "/legal/privacy", "/legal/refunds", "/legal/cookies"]) {
    entries.push({ path, changeFrequency: "yearly", priority: 0.2 });
  }

  /* Category hubs, but only where the category actually has inventory. */
  for (const category of CATEGORIES) {
    const scoped = inCategory(properties, category.slug);
    if (!scoped.length) continue;
    entries.push({ path: category.href, changeFrequency: "daily", priority: 0.8 });

    /* Category × destination, gated on the destination's own threshold. */
    for (const summary of categoryLocationSummaries(properties, (property) => {
      return categoryFor(property).slug === category.slug;
    })) {
      entries.push({
        path: `${category.href}/${summary.entry.slug}`,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
  }

  /* Destination pages. */
  for (const summary of destinations) {
    entries.push({
      path: `/locations/${summary.entry.slug}`,
      changeFrequency: "daily",
      priority: 0.75,
    });
  }

  /* Guides. */
  for (const guide of CONTENT) {
    if (guide.noindex) continue;
    entries.push({
      path: `/guides/${guide.slug}`,
      lastModified: new Date(`${guide.updatedAt}T00:00:00Z`),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  /* Property pages — the highest-value surface on the site. */
  for (const property of properties) {
    entries.push({
      path: `/property/${property.id}`,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  /* Guard: nothing private, ever. */
  for (const entry of entries) {
    for (const prefix of PRIVATE_ROUTE_PREFIXES) {
      if (entry.path === prefix || entry.path.startsWith(`${prefix}/`)) {
        throw new Error(
          `sitemap attempted to emit the private route "${entry.path}" (prefix "${prefix}")`,
        );
      }
    }
    if (!destinationSlugs.has(entry.path.split("/").pop() ?? "") && entry.path.startsWith("/locations/")) {
      throw new Error(`sitemap attempted to emit "${entry.path}" for a destination below its inventory threshold`);
    }
  }

  return entries.map((entry) => ({
    url: absoluteUrl(entry.path),
    lastModified: entry.lastModified ?? new Date(),
    changeFrequency: entry.changeFrequency ?? "weekly",
    priority: entry.priority ?? 0.5,
  }));
}
