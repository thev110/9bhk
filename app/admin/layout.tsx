import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { noindexMetadata } from "@/lib/seo/metadata";
import { isAdminEmail } from "@/lib/admin";
import { serverUserEmail } from "@/lib/supabase/server";

/**
 * `/admin` — private area. `noindex, follow`.
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
 * TODO(business-data): if any part of `/admin` becomes a genuinely public
 * marketing surface, move it out of this group and give it real metadata rather
 * than weakening the directive here.
 */
export const metadata: Metadata = noindexMetadata(
  "admin",
  "This part of 9bhk is for signed-in users and is not indexed by search engines.",
  "/admin",
);

/**
 * The console's access control.
 *
 * This runs on the server and resolves before any of `/admin` is rendered, so
 * a non-operator is redirected without ever receiving the console's markup. The
 * client-side link in `/profile` is a convenience; this is the check.
 *
 * It fails closed: with no Supabase configured, or no session, nobody is staff.
 * The database policies behind it stay the real guarantee — see
 * `bhk_is_staff()` in the admin allow-list migration.
 */
export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const email = await serverUserEmail();
  if (!isAdminEmail(email)) redirect("/profile");
  return children;
}
