import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isCanonicalPortalHost,
  resolveCrossPortalRedirect,
  resolvePortalFromHost,
  resolveSubdomainLandingPath,
} from "@/lib/portal-domains";
import { PRIVATE_ROUTE_PREFIXES, SITE_URL } from "@/lib/seo/site";

/**
 * Edge middleware.
 *
 * Three jobs:
 *
 *  1. **4-Subdomain Portal Routing & Canonical Host Enforcement.**
 *     Recognizes `www.9bhk.app` (Guest), `realtor.9bhk.app` (Realtor),
 *     `owners.9bhk.app` (Owners & Buyers), and `admin.9bhk.app` (Staff Admin),
 *     plus local `*.localhost` equivalents. Rewrites `/` on dedicated portal
 *     subdomains to their workspace root (`/realtor`, `/host`, `/admin`) while
 *     redirecting unknown hosts to `CANONICAL_HOST`.
 *
 *  2. **Strict Host-Only Auth Cookies Per Subdomain.**
 *     Strips any `domain` attribute when refreshing Supabase SSR cookies so
 *     sessions never bleed across `www`, `realtor`, `owners`, and `admin`.
 *
 *  3. **`X-Robots-Tag: noindex, nofollow, noarchive` on Private & Portal Routes.**
 *     Every non-guest portal subdomain (`realtor`, `owners`, `admin`) and every
 *     application-private pathname receives `X-Robots-Tag: noindex, nofollow, noarchive`.
 */

const CANONICAL_HOST = new URL(SITE_URL).host;

/** Hosts that must never be bounced: local dev, and Vercel's own aliases. */
function isPassthroughHost(host: string): boolean {
  const clean = host.trim().toLowerCase().replace(/:\d+$/, "");
  if (clean.endsWith(".vercel.app")) return true;
  if (
    clean === "localhost" ||
    clean.endsWith(".localhost") ||
    clean === "127.0.0.1" ||
    clean === "[::1]"
  ) {
    return true;
  }
  return process.env.NODE_ENV === "development";
}

function isPrivate(pathname: string): boolean {
  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");

  if (
    host &&
    !isCanonicalPortalHost(host, CANONICAL_HOST) &&
    !isPassthroughHost(host)
  ) {
    const target = request.nextUrl.clone();
    target.host = CANONICAL_HOST;
    target.protocol = "https:";
    return NextResponse.redirect(target, 308);
  }

  const portal = resolvePortalFromHost(host);
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!userAgent.includes("9bhk-seo-audit")) {
    const crossPortalTarget = resolveCrossPortalRedirect(host, pathname);
    if (crossPortalTarget) {
      const redirectUrl = crossPortalTarget.startsWith("http")
        ? new URL(crossPortalTarget)
        : new URL(crossPortalTarget, request.url);
      return NextResponse.redirect(redirectUrl, 307);
    }
  }

  const rewritePath = resolveSubdomainLandingPath(host, pathname);
  const effectivePathname = rewritePath ?? pathname;

  const makeResponse = () => {
    if (rewritePath) {
      const targetUrl = request.nextUrl.clone();
      targetUrl.pathname = rewritePath;
      return NextResponse.rewrite(targetUrl, { request });
    }
    return NextResponse.next({ request });
  };

  let response = makeResponse();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (
    url &&
    key &&
    !/\.(?:avif|gif|ico|jpe?g|png|svg|webp|woff2?|css|js|map|txt|xml)$/i.test(pathname)
  ) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = makeResponse();
          values.forEach(({ name, value, options }) => {
            const { domain: _ignoredDomain, ...hostOnlyOptions } = options ?? {};
            response.cookies.set(name, value, hostOnlyOptions);
          });
        },
      },
    });
    await supabase.auth.getUser();
  }

  if (portal !== "guest" || isPrivate(effectivePathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  response.headers.set("x-9bhk-portal", portal);

  return response;
}

export const config = {
  // Everything except Next's own build output and static files. The matcher is
  // deliberately wide: a private route that is *not* matched would silently
  // stay indexable, and the cost of matching a static asset is one cheap early
  // return.
  matcher: ["/((?!_next/static|_next/image|_next/webpack-hmr).*)"],
};
