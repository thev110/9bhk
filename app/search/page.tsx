import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchScreen } from "@/components/search-experience";
import { getIndexableProperties } from "@/lib/server/catalog";
import { publishableLocations } from "@/lib/seo/locations";
import { classifySearchUrl } from "@/lib/seo/queries";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/json-ld";
import { createBreadcrumbSchema, createItemListSchema, graph } from "@/lib/seo/schema";
import { HomeCrumbs } from "@/lib/seo/breadcrumbs";
import { SearchFallback } from "@/components/search-fallback";

/**
 * `/search` — the interactive catalog browser.
 *
 * This route used to be a bare `"use client"` page with a static layout
 * metadata block, which meant every filter state was indistinguishable to a
 * crawler. It is now a **server** component, which is the only way to read
 * `searchParams` and emit a per-URL robots directive.
 *
 * The policy (`lib/seo/queries.ts`):
 *
 *   • **Bare `/search`** — the full catalog with nothing filtered — is
 *     `index, follow` with a self-canonical. It is a real page and it is the
 *     one search URL worth ranking.
 *   • **Any parameter combination** is `noindex, follow`, and the ones that
 *     express genuine search intent are consolidated onto a curated landing
 *     page: `?city=ECR` → `/locations/ecr`, `?setting=Seaside` →
 *     `/beach-houses`. Those pages only exist while inventory supports them, so
 *     the consolidation can never point at a 404.
 *   • `follow` is retained on every noindex state, so link equity still flows
 *     from results into the listings.
 *
 * The screen itself is unchanged — it moved to `components/search-experience.tsx`
 * and still owns all the filter UI, date picking and availability logic.
 */
export const revalidate = 3600;

type Params = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function verdict(searchParams: Record<string, string | string[] | undefined>) {
  const properties = await getIndexableProperties();
  const liveLocationSlugs = new Set(publishableLocations(properties).map((summary) => summary.entry.slug));
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  return { properties, decision: classifySearchUrl(params, liveLocationSlugs) };
}

export async function generateMetadata({ searchParams }: Params): Promise<Metadata> {
  const { decision } = await verdict(await searchParams);

  if (!decision.noindex) {
    return buildMetadata({
      title: "Search every private stay on 9bhk",
      description:
        "Filter the full 9bhk catalog by destination, stay type, guest count, dates and features — pool, beach access, event capacity. Every result is a whole house booked exclusively.",
      path: "/search",
    });
  }

  /*
   * A filter state. If it maps onto a curated page, canonicalise there so the
   * signals consolidate; otherwise canonicalise to itself, which combined with
   * `noindex` keeps the state out of the index without pointing Google at an
   * unrelated page.
   */
  return buildMetadata({
    title: "Search private stays on 9bhk",
    description: "A filtered view of the 9bhk catalog.",
    path: decision.canonicalOverride ?? "/search",
    noindex: true,
  });
}

export default async function SearchPage({ searchParams }: Params) {
  const { properties, decision } = await verdict(await searchParams);

  return (
    <>
      {/*
        The visible breadcrumb and `ItemList` for the *bare* catalog view only.
        On a filter state the result set is a query permutation, not a
        collection worth describing in structured data, so no `ItemList` is
        emitted there — the canonical points at the curated page instead.
      */}
      {decision.noindex ? null : (
        <JsonLd
          data={graph(
            createItemListSchema(
              properties.map((property) => ({
                name: property.name,
                href: `/property/${property.id}`,
                image: property.image,
              })),
              { name: "9bhk stays", path: "/search" },
            ),
            createBreadcrumbSchema(HomeCrumbs()),
          )}
        />
      )}
      <Suspense fallback={<SearchFallback />}>
        <SearchScreen />
      </Suspense>
    </>
  );
}

