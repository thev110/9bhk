/**
 * Query-parameter / filter SEO policy.
 *
 * The application has a working search at `/search` driven by `q`, `city`,
 * `setting`, `vibe`, `guests`, plus in-page filters for sort and dates. Left
 * alone, that URL space is effectively infinite: every
 * `?guests=7&sort=price` combination is a distinct, crawlable, near-empty URL.
 * That is the classic crawl-budget trap — Google spends requests on
 * permutations instead of on the listings.
 *
 * The policy has two halves, which is what Google's faceted-navigation guidance
 * actually asks for:
 *
 *   • **The bare `/search` is a real page.** It is the full catalog view with
 *     no filters applied, and it gets `index, follow` with a self-canonical.
 *   • **Every parameter combination is `noindex, follow`,** and the ones that
 *     represent a genuine search intent are *consolidated* onto a curated
 *     landing page via `canonicalOverride` — `/locations/ecr` for
 *     `?city=ECR`, `/beach-houses` for `?setting=Seaside`. Those pages are
 *     generated from inventory thresholds in `lib/seo/locations.ts`, never
 *     from permutations.
 *
 * The result: a crawler can reach every listing, one collection per real
 * intent gets indexed, and the permutation space gets zero crawl budget.
 */

/** Query keys the application reads on `/search`. */
export const SEARCH_PARAMS = [
  "q",
  "city",
  "setting",
  "vibe",
  "guests",
  "checkIn",
  "checkOut",
  "sort",
  "minPrice",
  "maxPrice",
  "amenities",
  "page",
] as const;

export type SearchParam = (typeof SEARCH_PARAMS)[number];

export const NON_INDEXABLE_PARAMS: ReadonlySet<string> = new Set<string>(SEARCH_PARAMS);

/** `?setting=` values that resolve to a first-class category page. */
const SETTING_TARGETS: Record<string, string> = {
  seaside: "/beach-houses",
  hill_station: "/villas",
  city: "/villas",
  countryside: "/farmhouses",
};

export type QueryVerdict = {
  /** True when this URL must be excluded from the index. */
  noindex: boolean;
  /** Where an indexable query state should be consolidated, if anywhere. */
  canonicalOverride?: string;
  /** Human-readable reason, surfaced by the validation script. */
  reason: string;
};

/**
 * Classify a `/search` URL.
 *
 * `liveLocationSlugs` is supplied by the caller (which has the catalog) rather
 * than read here, so this module stays a pure function that the route, the
 * sitemap and the test suite can all call.
 */
export function classifySearchUrl(
  params: URLSearchParams,
  liveLocationSlugs: ReadonlySet<string>,
): QueryVerdict {
  const entries = [...params.keys()];

  if (!entries.length) {
    return { noindex: false, reason: "bare /search is the full catalog view" };
  }

  const unknown = entries.filter((key) => !NON_INDEXABLE_PARAMS.has(key));
  if (unknown.length) {
    return { noindex: true, reason: `unknown parameter(s): ${unknown.join(", ")}` };
  }

  /* Single meaningful filters consolidate to a real page. */
  if (entries.length === 1) {
    const city = params.get("city")?.trim().toLowerCase();
    if (city && liveLocationSlugs.has(city)) {
      return {
        noindex: true,
        canonicalOverride: `/locations/${city}`,
        reason: "city-only search consolidates to the destination page",
      };
    }

    const setting = params.get("setting")?.trim().toLowerCase().replace(/[\s-]+/g, "_");
    if (setting && SETTING_TARGETS[setting]) {
      return {
        noindex: true,
        canonicalOverride: SETTING_TARGETS[setting],
        reason: "single-filter search consolidates to the category page",
      };
    }
  }

  return {
    noindex: true,
    reason: `filter state (${entries.join(", ")}) has no curated landing page`,
  };
}

/** Strip every parameter — used for the canonical of a noindex tool page. */
export function stripQuery(pathname: string): string {
  return pathname.split("?")[0].split("#")[0];
}
