import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { noindexMetadata } from "@/lib/seo/metadata";

/**
 * `/realtor` â€” private area. `noindex, follow`.
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
 * behind an authentication check in the app â€” robots.txt is a crawl
 * instruction, never an access control.
 *
 * TODO(business-data): if any part of `/realtor` becomes a genuinely public
 * marketing surface, move it out of this group and give it real metadata rather
 * than weakening the directive here.
 */
export const metadata: Metadata = noindexMetadata(
  "realtor",
  "This part of 9bhk is for signed-in users and is not indexed by search engines.",
  "/realtor",
);

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const client = await serverSupabase();
  const account = client ? await client.auth.getUser() : null;
  if (!account?.data.user) redirect("/login?next=/realtor");
  return children;
}
