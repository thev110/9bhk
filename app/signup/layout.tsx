import type { Metadata } from "next";
import { noindexMetadata } from "@/lib/seo/metadata";

/**
 * `signup` — authentication. `noindex, follow`.
 *
 * Kept out of the index on purpose: a sign-in form or a host dashboard is not a
 * search result, and indexing it would put thin, private-area URLs in front of
 * the listings that should rank. `follow` is retained so link equity still
 * passes to the public catalog. The `Disallow` rules in `app/robots.ts` stop
 * the crawl earlier; neither replaces the app's own session check.
 */
export const metadata: Metadata = noindexMetadata(
  "Create an account",
  "Create a 9bhk.app account to book a private stay or list your property.",
  "/signup",
);

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
