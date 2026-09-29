# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-29)

**Core value:** Real group houses, honestly categorised — whole villas, bungalows and pool houses with at least three bedrooms, any setting, no hotel rooms, no forced beachfront.
**Current focus:** Catalog generalised beyond beachfront-only

## Current Position

Phase: Setting generalisation (Complete)
Status: Verified
Last activity: 2026-09-29 — Replaced the beachfront-only mandate with a four-setting taxonomy; garages made optional; 3-bedroom floor enforced in the host wizard.

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**
- Automated Tests: 16/16 passing via `npm test` (`tests/estate_suite.test.mjs`, `tests/i18n_catalog.test.mjs`)
- i18n coverage: 844/844 keys translated in both Tamil and Telugu
- Typecheck & Build: 0 errors across 25 routes (Next.js 15 App Router)

## Accumulated Context

### Decisions
- [2026-09-29]: Introduced `Setting` (`seaside | hill_station | city | countryside`) as a required field. `settingName` and `settingDetail` replaced beach frontage as the general location spec; the badge on every card and gallery now shows the setting, not a shoreline.
- [2026-09-29]: Coastal fields (`beachFrontage`, `coastalZone`, `privateBeachAccess`, `tideDistanceMeters`) are now optional and exclusive to `setting === "seaside"`. The detail page renders the shoreline block only for beachfront listings, so a hill or city house can never show a fabricated high-tide line.
- [2026-09-29]: Garages are optional. `Property.garage` is `GarageSpec | undefined`, the host wizard offers an explicit "No garage" choice, and the detail page states plainly that a house has none instead of inventing a spec. `marine_port` is offered only on seaside listings.
- [2026-09-29]: Enforced a 3-bedroom floor (`MIN_BEDROOMS`) in the host wizard — the step and the publish both block below it. No hotel rooms.
- [2026-09-29]: Expanded `CITIES` to cover the actual footprint (ECR, Mahabalipuram, Pondicherry, Ooty, Kodaikanal, Courtallam, Coimbatore, Kanchipuram, Hosur) and used it for the realtor client's preferred-area picker, replacing a hardcoded coastal strip list.
- [2026-09-29]: `CITIES` stays a flat tuple because `store.tsx` types user/session state as `City`; a structured `LOCATIONS` split would have required widening that state type, which is a larger refactor than this change warranted.
- [2026-09-29]: Renamed the viewing-request `automotiveMandate` / `automotive_mandate` field to `notes` (the brief is now group size, dates, pool/bonfire needs) with a backfilling migration.
- [2026-09-28]: Standardized 4 garage types: Subterranean Collector's Vault, Beach & Marine Port, Executive EV Pavilion, and Teak Portico.
- [2026-09-28]: Enabled crore-denominated sale pricing (`formatInrCrores`) and private architectural viewing requests on property detail pages.
- [2026-09-28]: Applied tactile spring hover dynamics to all primary buttons and interactive cards.

### Superseded
- ~~"Exclusively restricted catalog to genuine coastal/beachfront properties"~~ (2026-09-28) — reversed on 2026-09-29. The restriction read as a product mandate rather than a filter, and excluded legitimate villas, bungalows, and hill and city group houses.
- ~~"Garage engine is a headline feature on every detail page"~~ — garages are now an optional differentiator rather than a universal section.
