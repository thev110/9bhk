/**
 * Single source of truth for site identity, canonical URL construction and the
 * entity facts we are allowed to publish in structured data.
 *
 * Rule for this file: every value here must be verifiable. Where a real
 * business fact is not yet known (legal entity, phone, social profiles,
 * physical address) the key is left out and a `TODO(business-data)` marker is
 * recorded in AUDIT.md rather than filled with a plausible guess.
 */

const RAW_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.SITE_URL?.trim() ||
  "https://www.9bhk.app";

/** Normalised origin — no trailing slash, guaranteed https in production. */
export const SITE_URL = RAW_URL.replace(/\/+$/, "");

export const SITE = {
  /** Short brand token used in titles and JSON-LD. */
  name: "9bhk",
  /** Rendered brand lockup (matches the header wordmark). */
  displayName: "9bhk.app",
  domain: SITE_URL.replace(/^https?:\/\//, ""),
  url: SITE_URL,
  locale: "en_IN",
  lang: "en",
  themeColor: "#193527",
  /** Published in the legal pages, so it is a real contact route. */
  email: "hello@9bhk.app",
  /**
   * One-line entity definition. Used in the footer, the About page and the
   * `Organization` node. Describes what the platform *is* — no claims about
   * inventory size, ratings or awards.
   */
  description:
    "9bhk (9bhk.app) is an online marketplace for verified whole-house luxury farmhouses, beach houses, and private villas (3–9+ BHK) across Chennai and ECR, built for group stays, private celebrations, and estate sales.",
  /**
   * TODO(business-data): supply the registered legal entity name so
   * `legalName` can be published in Organization/footer. Until then the brand
   * token is used and no legal entity is asserted.
   */
  legalName: undefined as string | undefined,
  /**
   * TODO(business-data): add `sameAs` profile URLs (Instagram, LinkedIn,
   * Google Business Profile) once the brand's public profiles exist. Emitting
   * placeholder handles would be a fabricated entity signal.
   */
  sameAs: [] as string[],
  /**
   * TODO(business-data): a support phone number. The only verified contact
   * channel today is the email above, so nothing else is published.
   */
  phone: undefined as string | undefined,
} as const;

/** Currency used by every published price on 9bhk. */
export const CURRENCY = "INR";

/**
 * Absolute, canonical URL for a site-relative path.
 * Collapses duplicate slashes, drops the query string and forces a single
 * trailing-slash policy so the same page can never emit two canonical forms.
 *
 * The root path returns the **bare origin**, with no trailing slash, because
 * that is the form Next.js emits for `alternates.canonical` on the homepage:
 * it normalises a root URL to the origin, so a helper returning
 * `https://www.9bhk.app/` made the sitemap advertise a homepage URL that no
 * canonical tag in the site ever pointed at. The site runs
 * `trailingSlash: false`, and `https://www.9bhk.app` is the form every other
 * URL here builds from, so that is what the root resolves to.
 */
export function absoluteUrl(path = "/"): string {
  const clean = path.trim();
  if (!clean || clean === "/") return SITE_URL;
  const withSlash = clean.startsWith("/") ? clean : `/${clean}`;
  const collapsed = withSlash.replace(/\/{2,}/g, "/").replace(/\/+$/, "");
  return `${SITE_URL}${collapsed}`;
}

/** Canonical path for a site-relative path (same normalisation, no origin). */
export function canonicalPath(path = "/"): string {
  return absoluteUrl(path).replace(SITE_URL, "") || "/";
}

/** Per-indexable-page override for when an editor supplies a canonical URL. */
export function resolveCanonical(override?: string | null): string {
  if (!override || !override.trim()) return absoluteUrl("/");
  const trimmed = override.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, "");
  return absoluteUrl(trimmed);
}

/** Google Search Console token, supplied through the environment. */
export const siteVerification = {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || undefined,
  // TODO(business-data): Bing / other engines if the site is submitted there.
};

/**
 * Routes that must never be indexed, exported for robots + tests.
 *
 * `/search` is deliberately **not** here. It is the full public catalog view
 * that the homepage search box sends guests to; it renders server-side and is
 * one of the few indexable listing surfaces the site has. Its query-string
 * permutations (`?q=`, `?vibe=`, `?city=`, …) are consolidated onto the bare
 * URL by the canonical tag the route emits, and `/robots.txt` disallows the
 * obviously unbounded ones.
 */
export const PRIVATE_ROUTE_PREFIXES = [
  "/admin",
  "/auth",
  "/book",
  "/host",
  "/login",
  "/notifications",
  "/onboarding",
  "/profile",
  "/realtor",
  "/saved",
  "/signup",
  "/split",
  "/splash",
  "/trips",
  "/api",
] as const;

/**
 * Routes that redirect away and should never be indexed on their own.
 * Kept out of `robots.txt` (which is a crawl hint) and handled by the
 * `X-Robots-Tag` header instead, so a redirect that lands on an indexable page
 * still transfers the signal correctly.
 */
export const REDIRECT_ROUTES = ["/splash", "/onboarding"] as const;

/**
 * Paths that do not exist yet but must never become crawlable by accident.
 * Disallowing a path that is absent costs nothing, and means a future
 * `/dashboard`, `/account` or `/checkout` is protected from the moment it is
 * added rather than after someone notices it in Search Console.
 */
export const RESERVED_ROUTE_PREFIXES = [
  "/account",
  "/checkout",
  "/dashboard",
  "/inbox",
  "/messages",
  "/payment",
] as const;

/** True when a pathname is application-private or a query-driven view. */
export function isPrivatePath(pathname: string): boolean {
  return [...PRIVATE_ROUTE_PREFIXES, ...RESERVED_ROUTE_PREFIXES].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
