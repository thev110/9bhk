import path from "path";
import type { NextConfig } from "next";

/**
 * Host-published listing photos live in a Supabase storage bucket. The pattern
 * is derived from the configured project URL rather than hard-coded, so
 * rotating the project does not silently break remote image optimisation.
 */
const supabaseProject = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    if (!url) return null;
    const host = new URL(url).hostname;
    const project = host.split(".")[0];
    return project && /^[a-z0-9]+$/i.test(project) ? { protocol: "https" as const, hostname: host, project } : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /**
   * Pin the tracing root to this project.
   *
   * There is a `package-lock.json` in a parent directory, so without an
   * explicit root Next.js walks up, picks the parent as the workspace and warns
   * on every build. Pinning it here also keeps standalone/serverless output
   * tracing scoped to this app rather than to the whole home directory.
   */
  outputFileTracingRoot: path.join(process.cwd()),
  // Keep the dev server and production builds in separate output directories.
  // A long-running `next dev` (e.g. one supervised by an agent tool) shares this
  // project with `next build`; when both write to `.next`, the dev runtime and
  // manifests overwrite the production ones and the build becomes unusable.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",

  /**
   * One canonical URL form, enforced at the router.
   *
   * `trailingSlash: false` means `/farmhouses/` and `/farmhouses` resolve to the
   * same route with the same canonical — without it a site can serve both forms
   * and split its own signals. Host-level normalisation (www ↔ apex, http ↔
   * https) has to happen at DNS/CDN and is documented in AUDIT.md; the
   * canonical tags this app emits are all built from a single origin, so they
   * are already consistent whichever host serves them.
   */
  trailingSlash: false,

  /**
   * Image optimisation.
   *
   * Previously every listing image was a raw `<img src="/assets/….jpg">` at
   * full source resolution — up to 280 kB for a single photo, with no
   * responsive `sizes`, no `priority` on the LCP element and no aspect-ratio
   * reservation, which is both a Core Web Vitals problem and an image-indexing
   * problem. The new listing cards go through `next/image`; these settings make
   * that work for both local seed assets and host uploads.
   */
  images: {
    // AVIF first, WebP fallback — both are supported by every browser that
    // matters and typically cut these photographs by 50–70%.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 420, 640, 828, 1080, 1200, 1600, 1920],
    imageSizes: [64, 96, 128, 200, 280, 400],
    /*
     * Next.js 15.5 warns for every image whose `quality` is not listed here,
     * and Next.js 16 refuses to run at all. Listing the exact set the UI uses
     * keeps the optimiser output stable and the dev log readable.
     *
     *   68  small thumbnails (96 px cards, related-stay rows)
     *   70  guide card and row-card photos
     *   72  listing cards and the editorial property grid
     *   74  guide hero
     *   78  the property page LCP image
     *   80  the logo marks, which are flat PNGs where artefacts show sooner
     */
    qualities: [68, 70, 72, 74, 78, 80],
    // Listing images are the LCP element on the highest-value pages, so allow
    // the optimiser to serve a large candidate and let `sizes` pick it.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    ...(supabaseProject
      ? {
          remotePatterns: [
            {
              protocol: supabaseProject.protocol,
              hostname: supabaseProject.hostname,
              pathname: "/storage/v1/object/public/property-images/**",
            },
            {
              protocol: supabaseProject.protocol,
              hostname: supabaseProject.hostname,
              pathname: "/storage/v1/render/image/**",
            },
          ],
        }
      : {}),
  },


  /**
   * Response headers.
   *
   * Applied here rather than in `middleware.ts` so they land at the CDN layer
   * on every path, including the static chunks the middleware matcher skips,
   * and so there is only one writer for them.
   *
   * The interesting one for this project is `X-Content-Type-Options`: listing
   * descriptions come from a database and are interpolated into JSON-LD and
   * into metadata, so `nosniff` is a real control rather than boilerplate.
   *
   * `Strict-Transport-Security` must never reach a plain-HTTP origin, because a
   * browser that receives it pins that host to HTTPS for `max-age`. The only
   * such origin this project ever serves is the developer's own machine, so
   * the switch is `NODE_ENV`.
   *
   * It used to be additionally gated on `process.env.SITE_URL` starting with
   * `https`. That was a real production defect: `SITE_URL` is not set on
   * Vercel (the origin is resolved in `lib/seo/site.ts` from
   * `NEXT_PUBLIC_SITE_URL`, falling back to the `https://www.9bhk.app`
   * default), so the expression was `undefined && …` and **HSTS never shipped**.
   * The origin check now reads the same resolved value the rest of the SEO
   * layer uses, and still falls back to the known-https default rather than
   * to `undefined`.
   *
   * `Cross-Origin-Opener-Policy` is `same-origin-allow-popups` rather than
   * `same-origin`: it still severs `window.opener` against tabnabbing, but it
   * leaves popups functional, so the Google sign-in flow cannot be affected by
   * a header added on release day.
   */
  async headers() {
    const resolvedOrigin = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      "https://www.9bhk.app"
    ).trim();
    const isProduction =
      process.env.NODE_ENV === "production" && resolvedOrigin.startsWith("https://");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Origin-Agent-Cluster", value: "?1" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          ...(isProduction
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
      {
        // The image optimiser is content-negotiated (AVIF / WebP) and immutable
        // per query string, so it is the one path that can be cached hard.
        source: "/_next/image",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },

  async redirects() {
    return [
      /* Legacy app routes kept alive for existing deep links. */
      { source: "/splash", destination: "/", permanent: false },
      { source: "/onboarding", destination: "/", permanent: false },

      /*
       * SEO URL normalisation.
       *
       * Single-word category aliases, permanently redirected to the canonical
       * plural paths rather than served as thin duplicates. A permanent redirect
       * hands the link equity over instead of leaving two URLs competing.
       */
      { source: "/farmhouse", destination: "/farmhouses", permanent: true },
      { source: "/farmhouse/:path*", destination: "/farmhouses/:path*", permanent: true },
      { source: "/villa", destination: "/villas", permanent: true },
      { source: "/villa/:path*", destination: "/villas/:path*", permanent: true },
      { source: "/beach-house", destination: "/beach-houses", permanent: true },
      { source: "/beach-house/:path*", destination: "/beach-houses/:path*", permanent: true },
      { source: "/beachhouse", destination: "/beach-houses", permanent: true },
      { source: "/guide", destination: "/guides", permanent: true },
      { source: "/guide/:slug", destination: "/guides/:slug", permanent: true },
      { source: "/location/:slug", destination: "/locations/:slug", permanent: true },
      { source: "/destination/:slug", destination: "/locations/:slug", permanent: true },
      { source: "/stays/all", destination: "/stays", permanent: true },
      { source: "/explore", destination: "/stays", permanent: true },
      { source: "/homes", destination: "/stays", permanent: true },

      /*
       * Legacy technical URL. `/property?id=x` is not in the sitemap and is not
       * linked, but old bookmarks and shared links exist; redirecting to the
       * catalog keeps them from becoming soft 404s.
       */
      { source: "/property", destination: "/stays", permanent: true },
    ];
  },
};

export default nextConfig;
