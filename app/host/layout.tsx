import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { noindexMetadata } from "@/lib/seo/metadata";

/**
 * `host` â€” host dashboard. `noindex, follow`.
 *
 * Kept out of the index on purpose: a sign-in form or a host dashboard is not a
 * search result, and indexing it would put thin, private-area URLs in front of
 * the listings that should rank. `follow` is retained so link equity still
 * passes to the public catalog. The `Disallow` rules in `app/robots.ts` stop
 * the crawl earlier; neither replaces the app's own session check.
 */
export const metadata: Metadata = noindexMetadata(
  "Hosting",
  "Manage your 9bhk.app farmhouse, photos, UPI ID, and bookings.",
  "/host",
);

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const client = await serverSupabase();
  const account = client ? await client.auth.getUser() : null;
  if (!account?.data.user) redirect("/login?next=/host");
  return children;
}
