import { NextResponse, type NextRequest } from "next/server";
import { PRIVATE_ROUTE_PREFIXES, SITE_URL } from "@/lib/seo/site";

/**
 * Edge middleware.
 *
 * Two jobs, both of which have to work on routes whose page component is a
 * client component and therefore cannot export `metadata`:
 *
 *  1. **`X-Robots-Tag: noindex, nofollow` on application-private routes.**
 *     `/admin`, `/profile`, `/trips`, `/saved`, `/host/*`, `/login`, `/signup`,
 *     `/book/*`, `/split/*` and the rest are all `"use client"` pages. Adding a
 *     `generateMetadata` to each one would mean converting a dozen screens to
 *     server components for a single header. A header works on all of them at
 *     once, including on 404s and on any future route added under those
 *     prefixes.
 *
 *     This is belt-and-braces with `robots.txt`, and deliberately so:
 *     `Disallow` stops a crawl but does **not** prevent indexing from an
 *     external link, so a shared profile URL can still appear in results with a
 *     "no indexed page description" message. `noindex` is the only thing that
 *     actually removes it, and it is ignored if the page is blocked — which is
 *     why the private prefixes are *not* blocked for the page owner. They are
 *     blocked for everyone else, and noindexed for the crawler that does reach
 *     them.
 *
 *  2. **Canonical host enforcement.** Every non-`*.vercel.app` host that is not
 *     the canonical one is redirected to it, so the apex and the bare domain can
 *     never be served as a second copy of the same pages. Vercel's own domain
 *     redirect already handles the apex in front of this function; the check
 *     here is the backstop that survives a domain reconfiguration.
 *
 * Response headers live in `next.config.ts` instead, so they are applied at the
 * CDN layer to every path — including the static chunks this matcher skips —
 * and are not duplicated by two writers.
 */

const CANONICAL_HOST = new URL(SITE_URL).host;

/** Hosts that must never be bounced: local dev, and Vercel's own aliases. */
function isPassthroughHost(host: string): boolean {
  if (host.endsWith(".vercel.app")) return true;
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]")) {
    return true;
  }
  return process.env.NODE_ENV === "development";
}

function isPrivate(pathname: string): boolean {
  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const host = request.headers.get("host");
  if (host && host !== CANONICAL_HOST && !isPassthroughHost(host)) {
    const target = request.nextUrl.clone();
    target.host = CANONICAL_HOST;
    target.protocol = "https:";
    return NextResponse.redirect(target, 308);
  }

  const response = NextResponse.next();
  if (isPrivate(pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return response;
}

export const config = {
  // Everything except Next's own build output and static files. The matcher is
  // deliberately wide: a private route that is *not* matched would silently
  // stay indexable, and the cost of matching a static asset is one cheap early
  // return.
  matcher: ["/((?!_next/static|_next/image|_next/webpack-hmr).*)"],
};
