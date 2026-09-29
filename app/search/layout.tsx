import type { Metadata } from "next";
import { noindexMetadata } from "@/lib/seo/metadata";

/**
 * `/search` — the interactive browse tool. `noindex, follow`.
 *
 * This is the single most important indexability decision on the site. The
 * page reads `q`, `city`, `setting`, `vibe`, `guests`, `checkIn`, `checkOut`
 * and adds in-page sort/date filters on top, which makes its URL space
 * effectively infinite. Left indexable, Google would spend its crawl budget
 * enumerating `?guests=7&sort=price&vibe=Pool` permutations instead of crawling
 * the listings.
 *
 * So:
 *   • every parameter combination is `noindex`,
 *   • the meaningful combinations are **consolidated** to real curated pages —
 *     `/locations/ecr`, `/farmhouses/ecr`, `/beach-houses` — by
 *     `lib/seo/queries.ts`, which is why those pages exist at all,
 *   • `follow` is kept, so the listings a result set shows still pass their
 *     link equity to the pages that should rank,
 *   • results are rendered as ordinary `<a href="/property/...">` links, so a
 *     crawler can still reach every listing from here.
 */
export const metadata: Metadata = noindexMetadata(
  "Search stays",
  "Search and filter every private stay on 9bhk by destination, stay type, guest count and features.",
  "/search",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
