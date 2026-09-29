import type { Metadata } from "next";
import { noindexMetadata } from "@/lib/seo/metadata";

/**
 * `login` — authentication. `noindex, follow`.
 *
 * Kept out of the index on purpose: a sign-in form or a host dashboard is not a
 * search result, and indexing it would put thin, private-area URLs in front of
 * the listings that should rank. `follow` is retained so link equity still
 * passes to the public catalog. The `Disallow` rules in `app/robots.ts` stop
 * the crawl earlier; neither replaces the app's own session check.
 */
export const metadata: Metadata = noindexMetadata(
  "Sign in",
  "Sign in to 9bhk.app to book a farmhouse or manage your listing.",
  "/login",
);

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
