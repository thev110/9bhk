# 9bhk — Technical SEO / AEO / GEO audit

Audit date: 2026-09-29 · Source of truth for the implementation: `lib/seo/`
Validation: `npm run typecheck && npm test && npm run build && npm run seo:audit`

---

## 1. Architecture as found

| Concern | Finding |
|---|---|
| Framework | Next.js **15.5.26**, App Router, React 19 |
| Routing | Every route was a client component (`"use client"` at the top of the file) |
| Metadata | `generateMetadata` existed on **4 of 24 routes** (the legal pages only) |
| Canonical | None anywhere. The root layout's canonical leaked onto every child that did not override it |
| Sitemap | Did not exist |
| robots.txt | Did not exist |
| Structured data | None |
| Breadcrumbs | None |
| Server-side data | The browser catalog (`lib/catalog.tsx`) fetched Supabase inside `useEffect`; the server had **no access to published inventory** |
| Images | Raw `<img src="/assets/*.jpg">` at full source resolution (105–280 kB), no `srcset`, no modern format, no `priority`, no reserved box. Header logo was a **1.8 MB** PNG rendered at 36 px |
| Fonts | `next/font` with `display: swap` — already correct |
| Analytics | None |
| Reviews | `rating` / `reviews` numbers on each listing, no review table, no review UI |
| i18n | Three complete catalogs (en / ta / te) bundled into the client |

### Two data sources, and why that mattered

`lib/properties.ts` is a 13-listing static catalog with a coastal + garage theme.
`supabase/migrations/20260927120000_bhk_properties.sql` seeds a **different**
9-listing catalog (farmhouses, farm stays, orchard retreats) with different
`type` and `city` values. The browser merged them at runtime, so the site
rendered 22–23 listings while the server knew about 13 — and about none of the
structure needed for metadata.

**Fix:** the row → `Property` mapping was extracted to `lib/catalog-rows.ts` and
is now shared by both. `lib/server/catalog.ts` reads Supabase on the server with
a one-hour cache and falls back to the static catalog on any failure, so
`generateMetadata`, JSON-LD and the sitemap all see the same inventory the UI
renders.

---

## 2. Problems found, by class

### A. SEO / metadata
1. No `generateMetadata` on the homepage, search, buy, property, host, login, signup, profile, saved, trips, realtor, admin, notifications or booking routes. Every listing shipped the root default.
2. No canonicals anywhere. The root `alternates.canonical` was inherited by the four legal pages, so **all four canonicalised to `/`** — four pages telling Google they are the homepage.
3. The homepage H1 was a translated client string, `"Villas built for gathering"`, which names neither the marketplace nor the geography.
4. The root description ("Whole villas, bungalows and pool houses for groups") contradicted the actual catalog, which is largely farmhouses and beach houses.
5. No `openGraph` image or Twitter card on any page.

### B. Crawlability
6. No `robots.txt`, so `/host`, `/admin`, `/book/*` and `/profile` were freely crawlable.
7. `/search` exposed `q`, `city`, `setting`, `vibe`, `guests`, `checkIn`, `checkOut`, `sort`, `minPrice`, `maxPrice`, `amenities`, `page` with no directive — an unbounded, near-empty URL space.

### C. Indexability
8. **Soft 404 on every host-published listing.** The server catalog could not see Supabase rows, so `/property/palm-grove` rendered its "this stay is gone" state into the HTML at HTTP 200. Nine of the twenty-three live listings were soft 404s to a crawler, and a guest on a slow connection saw the same.
9. The four legal pages had **two `<h1>` elements** each (the `PageBar` bar title and the document heading).
10. No `noindex` on any private route.

### D–E. Structured data
11. Zero JSON-LD on the entire site. No `Organization`, no `WebSite`, no `BreadcrumbList`, no `ItemList`, no `Product`/`Offer`, no `FAQPage`, no `Article`.

### F. Semantic HTML
12. No `<article>` semantics on listings in the editorial surfaces, no `<nav>` landmarks, no skip link, no `<dl>` spec blocks, no `aria-labelledby` on sections.
13. The FAQ/answer surface did not exist at all.

### G. Internal linking
14. The footer was absent. The only outbound internal links were the bottom tab bar (`/`, `/buy`, `/saved`, `/trips`, `/profile`) and the card links. Nothing linked a property to its category, its destination or a guide.
15. Every category, destination and guide page existed in the sitemap's imagination only — none existed.

### H. Content architecture
16. No category hubs, no destination pages, no guides, no FAQ, no About, no Contact.
17. `lib/properties.ts` has `type: string` and `city: string` — no location entity, so no destination could be addressed.

### I–J. Local / AEO
18. No destination pages, so no local relevance could exist.
19. No "quick answer" blocks, so answer engines had nothing extractable to quote.
20. No `Article` schema, so guide content was unaddressable (and there were no guides).

### K. Performance
21. Listing photography at source resolution, no modern format, no `sizes`, no `priority`, no reserved box → LCP and CLS both exposed.
22. A **1.8 MB** PNG as the header logo.
23. The server catalog did not exist, so every SEO surface would have had to be a client component — the root cause of most of the above.

### L. Image SEO
24. No `srcset`, so image search had a single oversized candidate per photograph.
25. Alt text existed in the data (`property.alt`) and was already good — it was simply not being used in the new surfaces.

### M–O
26. No redirects at all. No 404 handling. Private routes exposed.

---

## 3. What was built

### Foundations — `lib/seo/`

| Module | Responsibility |
|---|---|
| `site.ts` | Brand identity, origin normalisation, `absoluteUrl`, private/reserved route lists, Search Console token |
| `taxonomy.ts` | Stay-type taxonomy **derived from listing data**; every listing resolves to exactly one primary category |
| `locations.ts` | Destination registry with map-verifiable geography, an inventory threshold, and a `nearby` graph |
| `copy.ts` | Factual sentence builders. Emits a clause only when the underlying value exists |
| `faq.ts` | Q&A generation. A question is emitted only when the catalog can answer it truthfully |
| `related.ts` | Weighted similarity scoring + the internal-link graph for a property |
| `schema.ts` | JSON-LD builders, the `TRUST` feature switches, and the `VacationRental` eligibility gate |
| `metadata.ts` | One `buildMetadata()` core plus a generator per page type |
| `breadcrumbs.ts` | Central trail builders so the visible trail and the JSON-LD cannot disagree |
| `queries.ts` | The `/search` indexability policy |
| `analytics.ts` | Event vocabulary + a non-blocking, privacy-consistent dispatch point |
| `server/catalog.ts` | Server-authoritative, cached, fail-safe catalog read |

### The category decision

The brief proposed `/farmhouses`, `/villas`, `/beach-houses`. That shape is kept,
but the assignment rule is evaluated against the listing rows rather than a
hand-maintained list, and each listing resolves to exactly **one** category:

1. the listing calls itself a farmhouse / farm stay / orchard / grove → `/farmhouses`
2. the listing is `seaside` → `/beach-houses`
3. everything else → `/villas`

A single primary category is what stops `/villas/ecr` and `/beach-houses/ecr`
competing for the same query with near-identical copy.

### Programmatic SEO safety

No URL is generated from a parameter permutation. Destinations are gated on
`minInventory` (default 2) and category × destination pairings are gated on the
destination's own threshold. `app/sitemap.ts` asserts its own output against
`PRIVATE_ROUTE_PREFIXES` and throws if a private route or an under-threshold
destination ever appears.

---

## 4. Deliberate omissions — and why

These are decisions, not gaps.

**`AggregateRating` and `Review` are not emitted.** `TRUST.reviewSchema` is
`false`. The `rating` / `reviews` numbers on each listing are seed values with no
provenance tied to a completed stay and no review UI behind them. Emitting them
as `AggregateRating` would be a fabricated rich result and a manual-action risk.
`supabase/migrations/20260930000000_seo_content_model.sql` creates
`bhk_reviews` with a `verified_stay` column; flip the switch once real reviews
exist.

**`VacationRental` is gated, not emitted.** Google's vacation-rental
specification requires `latitude`, `longitude` and a street-level
`PostalAddress`. 9bhk deliberately does not publish a host's street address, and
the catalog has no coordinates. `createVacationRentalSchema()` returns `null`
until all three exist, at which point it starts emitting with no code change.
Property pages carry a `Product` + schema.org lodging subtype instead, which is
what AI answer engines actually consume.

**No `LocalBusiness` / `AggregateRating` on the `Organization` node.** There is
no public business address, no phone number and no social profile. `lib/seo/site.ts`
leaves `legalName`, `phone` and `sameAs` undefined rather than filling them in.

**No `sameAs`, no Google Business Profile, no fake local presence.** These are
real businesses, not a facade.

**No occasion-based pages.** `/farmhouses/birthday-party/chennai` and its
siblings need inventory. Two of the three occasion groups the catalog *could*
support (large-group stays, event-capable houses) exist as **data** —
`property.celebration` — but the pages are not published until the inventory
threshold is met. The architecture is in place; the pages are not.

**No distances or drive times.** `distanceFromChennaiKm` and
`driveTimeFromChennai` exist on every `LocationEntry` and are `null`. The
location page omits the travel-time block entirely while they are null rather
than printing a plausible guess.

**No keyword meta tags.** `buildMetadata` has no `keywords` option, by design.

**`Disallow: /*?*` in robots.txt** covers the filter permutation space. It does
not block the bare `/search`, which is a genuine indexable page.

---

## 5. TODOs requiring real business or content data

| # | TODO | Where | Blocks |
|---|---|---|---|
| 1 | Registered legal entity name | `lib/seo/site.ts` → `SITE.legalName` | `Organization.legalName`, footer |
| 2 | Support phone number | `lib/seo/site.ts` → `SITE.phone` | `Organization.telephone`, `/contact` |
| 3 | Social profile URLs | `lib/seo/site.ts` → `SITE.sameAs` | `Organization.sameAs` |
| 4 | Street-level `address` per listing | `bhk_properties.address` | Google `VacationRental` |
| 5 | `latitude` / `longitude` per listing | `bhk_properties` | Google `VacationRental`, map rich results |
| 6 | `check_in_time` / `checkout_time` | `bhk_properties` | `VacationRental.checkinTime` |
| 7 | Verified travel distances and drive times | `bhk_locations` → `distance_from_chennai_km`, `drive_time_from_chennai` | "Getting there" block on destination pages |
| 8 | A real named guide author | `lib/content/guides.ts` → `author` | `Article.author` as a `Person` |
| 9 | Editorial copy for sub-threshold destinations | `lib/seo/locations.ts` | `/locations/ooty`, `/locations/kodaikanal`, `/locations/courtallam`, `/locations/hosur`, `/locations/chengalpattu` |
| 10 | **Existing trust copy needs a business decision** — see below | `app/property` UI | — |

### TODO 10 — the trust-claim strings

The property page renders these labels as unconditional product copy:

- `detail.clearTitle` — "Clear Title", on every listing marked for sale
- `detail.subVerifiedClearance` — under the coastal-zone field
- `detail.subVerifiedSetting` — under the setting field

None is driven by data. There is no title document, no CRZ record and no
verification record behind any of them, so a visitor currently sees an
unconditional verification claim on every beachfront and for-sale listing.

This upgrade **does not propagate those claims into structured data** — no
`additionalProperty`, no schema field and no FAQ answer asserts them, and
`TRUST` has no switch that would. It also does not silently change product copy.

**The decision needed:** either supply real title/CRZ documents and wire
`verification_status` / `verification_type` (columns already added by the
migration, and `propertyFacts()` already renders a "Verified by 9bhk" row the
moment `verification.status === "verified"`), or relabel the copy so it
describes what the listing actually records.

---

## 6. Validation

```
npm run typecheck     # tsc --noEmit           — clean
npm test              # 47 tests               — all pass
npm run build         # next build             — 78 static pages
npm run seo:audit     # scripts/seo-audit.mjs  — 0 errors, 0 warnings
node scripts/render-check.mjs                  — 51/51
node scripts/flow-check.mjs                    — all routes + client bundles
node scripts/perf-check.mjs                    — image policy
```

`seo:audit` checks: missing/duplicate title, missing/duplicate description,
missing/multiple H1, missing or non-self-referencing canonical, missing OG image,
missing breadcrumbs, missing `BreadcrumbList`, missing JSON-LD, missing site
entity, heading-level skips, thin pages, private URLs in the sitemap, noindex
pages in the sitemap, noindex directives on the expected routes, the 404 status,
three redirects, and orphan detection (indexable pages with zero internal links
pointing at them).

### Known non-project warning

`next build` warns that the workspace root was inferred. A stray
`package.json` / `package-lock.json` in the parent directory (`C:\Users\rathn`)
is picked up by Next's root inference. `outputFileTracingRoot` is pinned in
`next.config.ts`; removing the stray parent lockfile would silence it. It does
not affect the build or the emitted site.

---

## 7. Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for every metadata URL, JSON-LD `@id` and the sitemap | `https://www.9bhk.app` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Emits the `google-site-verification` meta tag. Omitted entirely when unset | — |

Both are optional. The site builds and validates with neither set.


---

## 8. Regression suites

Five runnable checks, all against a live server:

| Script | What it protects |
|---|---|
| `npm run seo:audit` | Titles, descriptions, canonicals, H1s, breadcrumbs, JSON-LD, robots, sitemap hygiene, the `/search` two-tier policy, the 404, three redirects, orphan detection, and the programmatic-SEO 404 gates |
| `node scripts/render-check.mjs` | 51 assertions that the premium app shell, hero, search bar, card rails, tab bar and design tokens survived the server-render refactor |
| `node scripts/flow-check.mjs` | Every route responds, every client bundle is served, booking / auth / host / search behaviour markers are present in the shipped JS, and the API routes do not crash |
| `node scripts/perf-check.mjs` | Payload sizes and the image policy: no raw `<img>` on a listing surface, priority preload on the LCP element, modern formats, logo and photo byte comparison |
| `npm run seo:layout` | Horizontal overflow at five viewports, plus three named layout contracts — see section 8a |

The programmatic-SEO gate list in `seo-audit.mjs` is the important one. These
all return **404**, and the audit fails if any of them ever starts returning
200:

```
/locations/atlantis              unknown destination
/villas/atlantis                 unknown category x destination
/villas/ooty                     destination below its inventory threshold
/beach-houses/kodaikanal         category x destination below threshold
/farmhouses/weekend-getaway      occasion pages are not published
/farmhouses/2-guests/pool/beach  no attribute permutations
```

---

## 8a. Layout pass — edges and overflow

A screenshot review of the homepage and the editorial pages turned up three
distinct defects, only one of which was actual document overflow. Because CSS
cannot be reasoned about from source reliably, `scripts/layout-probe.mjs` was
written to **measure** it: it drives a headless Chrome over the DevTools
Protocol (no dependencies — Node's built-in `WebSocket` speaks CDP directly) and
reports `document.scrollWidth` against the viewport, plus every element whose
box escapes the app column, with the ancestor chain that produced the width.

### 8a.1 The primary nav could not shrink — real, and serious

`.seo-header nav` is a flex item of `.seo-header-inner`. A flex item defaults to
`min-width: auto`, which resolves to its **min-content** width, so the nav
stayed **612px wide inside a 360px column** on all ten editorial pages. The
`ul` inside it already had `overflow-x: auto`, but a scroller cannot help a box
that refuses to shrink. The result: *Destinations*, *Guides* and *For sale* were
pushed off-screen with no scrollbar and no way to reach them on a phone.

Two changes, in `app/seo.css`:

- `min-width: 0` on the nav so it can shrink at all.
- The list **wraps** below 760px instead of scrolling. A scrollable primary nav
  hides destinations behind a gesture; wrapping does not. Type size and padding
  are trimmed at `max-width: 519px` specifically so seven labels land on **two**
  rows rather than three — the header is sticky, and three rows of it is 172px
  of a 780px screen.

That `@media` block has to come *after* the base rules. Same specificity, so
source order decides; the first attempt placed it above them and silently did
nothing. The header-height assertion caught it immediately.

### 8a.2 `.home-seo` had no gutters

Every other app-shell section (`.greet`, `.section-head`, `.searchwrap`) uses
`padding: … var(--gutter) …`. `.home-seo` set only `margin-top` and
`padding-bottom`, so its cards, link lists and FAQ rows ran **flush against
both edges** of the column. Nothing overflowed, and `scrollWidth` equalled the
viewport, which is why no overflow detector would ever have flagged it — the
text simply touched the column boundary with no breathing room and read as
clipped. Fixed by applying the gutter once at `.home-seo` and zeroing the one
child (`.pad`) that used to bring its own.

### 8a.3 The rail's scroll edge

A 280px card cannot fit twice in a 430px column, so the listing rail always
ends on a fragment, and the fragment sliced a text line in half exactly at the
column boundary — which reads as a rendering fault, not as "more this way". A
30px gradient mask on the rail's right edge turns the same fragment into an
explicit affordance. It is safe on a rail that does not overflow: with one card
the card ends at x=300 and the fade begins at x=400, so a non-scrolling rail is
never dimmed.

### 8a.4 Two false positives worth recording

The probe was wrong twice before it was right, and both are the kind of thing
that makes people distrust a linter:

- **Cards inside the rail were reported as overflowing.** Each card is wrapped
  in an `<article>`, so checking only the *immediate* parent missed that `.rail`
  is a horizontal scroller two levels up. The fix walks the whole ancestor chain.
- **A bare `<section>` "escaping the app column" on every app-shell page.** That
  is sonner's `<Toaster>` notification region — a body-level portal shell that
  spans the viewport by design. The "escaped the column" rule does not apply to
  nodes mounted on `<body>`; genuine document overflow on those is still caught
  by the `scrollWidth` assertion.

### 8a.5 What the probe asserts

Beyond raw overflow it now enforces the three contracts above by name, so a
regression identifies itself instead of requiring someone to compare
screenshots:

- no primary-nav link is off-screen, and `.seo-header` is under 150px tall;
- `.home-seo` carries at least a 12px gutter;
- `.rail` has its right-edge mask.

Current state: **15 pages × 5 viewports (360 / 390 / 430 / 768 / 1440) = 75
combinations, zero overflow**, on both the dev server and a production build.

```bash
npm run seo:layout                                    # 127.0.0.1:3000
BASE_URL=https://www.9bhk.app npm run seo:layout      # a preview deployment

# visual inspection, when an assertion is not enough
PROBE_SHOTS=./shots PROBE_SHOT_AT=".home-seo" npm run seo:layout
PROBE_SHOTS=./shots PROBE_SHOT_CLIP="0,0,360,560"     npm run seo:layout
PROBE_DUMP_BODY=1 BASE_URL=… npm run seo:layout       # list <body> children
```

---

## 9. Infrastructure added alongside the SEO work

Two changes that were not asked for but that the SEO work made necessary or
that a reviewer would otherwise have to flag as missing:

**`middleware.ts`** — sets `X-Robots-Tag: noindex, nofollow, noarchive` on
every application-private prefix and 308-redirects any non-canonical host to
`SITE_URL`. The layout-level `noindex` metadata covers the private pages
directly; the header covers routes whose page component is a client component,
plus 404s and anything added under those prefixes later.

**`next.config.ts` `headers()`** — `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and
`Strict-Transport-Security` in production only, plus a one-year immutable
`Cache-Control` on the image optimiser.

---

## 10. Environment note

There is a stray `package.json` and `package-lock.json` in the parent
directory (`C:\Users\rathn`), which is why `next build` prints a
"inferred your workspace root" warning. `outputFileTracingRoot` is pinned in
`next.config.ts`; removing the parent lockfile silences the warning. It does
not affect the build or the emitted site.

---

## 11. Dev-server false alarm: "Cannot read properties of undefined (reading 'call')"

**Symptom.** Running `npm run dev`, `/` failed with:

```
TypeError: Cannot read properties of undefined (reading 'call')
  at HomePage (app/page.tsx:78:9)
```

which reads as "the server component received `undefined` for a client
component it imported".

**It was not a code defect.** `components/home-experience.tsx` had its
`"use client"` directive and its `export function HomeExperience` in place the
whole time, and `npm run build` plus `next start` rendered the page correctly.

**Actual cause.** The dev server was mid-restart. Every edit to
`next.config.ts` — the `images` block, then `headers()`, then
`images.qualities` — triggers `⚠ Found a change in next.config.ts. Restarting
the server`, and the crawler was hitting `/` inside that window. During a
restart Next rebuilds its client-reference manifest; a server component that
renders a client reference whose manifest entry is not yet written receives
`undefined`, and React fails calling the element type. The 400-odd errors the
audit reported at the same moment were the same window.

**How to tell the two apart**

| | Restart race | Real missing export |
|---|---|---|
| `npm run build` | passes | fails |
| `next start` | renders | 500s |
| Dev log | shows `Restarting the server` | silent |
| Second request | 200 | still broken |

**Resolution.** Restart the dev server and re-request. To confirm the module
graph is sound rather than assuming it, `npm run seo:cycles` now walks the
import graph from every page entry point and fails on a real cycle. It
currently reports:

```
No import cycles reachable from any page entry point. (150 modules scanned)
```

It counts value imports only. A `import type { X } from "./y"` is erased at
compile time and creates no runtime edge, so counting it reported a phantom
cycle on `lib/supabase/sync.ts` -> `lib/store.tsx` that does not exist in the
emitted graph.

**Also fixed while investigating.** Next 15.5 logs a warning for every image
whose `quality` is not listed in `images.qualities`, and Next 16 refuses to
run without it. `images.qualities` is now `[68, 70, 72, 74, 78, 80]` — the
exact set the UI uses — which removed roughly two hundred log lines per crawl
and closes the Next 16 upgrade path.

**Rule of thumb for this repo:** do not edit `next.config.ts` while a
`next dev` server is running and then crawl. Use `npm run build && npm start`
for validation, or restart dev and wait for `✓ Ready` first.
