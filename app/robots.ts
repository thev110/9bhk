import type { MetadataRoute } from "next";
import { absoluteUrl, PRIVATE_ROUTE_PREFIXES, RESERVED_ROUTE_PREFIXES } from "@/lib/seo/site";

/**
 * robots.txt
 *
 * Built as a Metadata Route so the sitemap reference and the origin can never
 * drift apart from the rest of the SEO configuration — both come from
 * `lib/seo/site.ts`.
 *
 * The disallow rules are a crawl-budget optimisation, **not** a security
 * control. Every private area is additionally protected by a session check in
 * the app and by a `noindex` directive in its layout metadata; this file just
 * stops crawlers spending requests on pages they must not index.
 *
 * `RESERVED_ROUTE_PREFIXES` are routes that do not exist today. Disallowing a
 * path that is not there costs nothing and means a future `/dashboard`,
 * `/account` or `/checkout` is never briefly crawlable while it is being
 * built.
 *
 * Explicitly **not** blocked: `/_next/`, `/assets/`, `/logo-*.png` or any other
 * asset a renderer needs. Blocking render assets is a well-known way to break
 * Core Web Vitals for zero benefit, and `scripts/seo-audit.mjs` fails the build
 * if either ever appears here.
 */
export const revalidate = 86400;

export default function robots(): MetadataRoute.Robots {
  const disallow = [
    ...PRIVATE_ROUTE_PREFIXES,
    ...RESERVED_ROUTE_PREFIXES,
    /* Query-driven filter permutations. The canonical destination for a real
       search intent is a real path — /farmhouses/ecr, /locations/chennai — so
       these permutations never need to be crawled. */
    "/*?*",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
