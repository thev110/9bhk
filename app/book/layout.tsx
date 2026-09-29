import type { Metadata } from "next";
import { noindexMetadata } from "@/lib/seo/metadata";

/**
 * `/book` — private area. `noindex, follow`.
 *
 * Two independent layers keep these pages out of the index:
 *
 *   1. this `noindex` directive, so a crawler that reaches the URL does not
 *      index it even if it is linked or bookmarked;
 *   2. the `Disallow` rules in `app/robots.ts`, which stop the crawl before it
 *      spends a request here.
 *
 * `follow` is kept deliberately: link equity still flows out of these pages
 * into the public catalog, which is where it is useful. The routes are also
 * behind an authentication check in the app — robots.txt is a crawl
 * instruction, never an access control.
 *
 * TODO(business-data): if any part of `/book` becomes a genuinely public
 * marketing surface, move it out of this group and give it real metadata rather
 * than weakening the directive here.
 */
export const metadata: Metadata = noindexMetadata(
  "book",
  "This part of 9bhk is for signed-in users and is not indexed by search engines.",
  "/book",
);

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
