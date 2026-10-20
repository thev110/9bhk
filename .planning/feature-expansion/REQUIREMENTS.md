# Complete expansion scope and acceptance tracker

Prepared: 13 October 2026. Updated: 20 October 2026. Backend implementation is underway across the scope; [current implementation coverage](../../IMPLEMENTATION_PROGRESS.md) distinguishes written code from remaining feature integration and verification. No entry is end-to-end accepted. The user retired Stitch, accepted the existing UI as the visual baseline, and requested testing after implementation.

| ID | Requirement | Phase | Acceptance evidence |
|---|---|---|---|
| F01 | Reviewed staging-ready repair baseline | 0 | Independent final-diff review, migrated staging data and real auth/payment recovery journeys |
| F02 | Executed refunds, deposits and host payouts with reconciliation | 2 | Provider/ledger references match, safe retries, actual processing statuses and approved operator procedures |
| F03 | Full-system quality, translations, privacy, accessibility, monitoring and rollout | 1/13 | Role/RLS/browser/provider tests, full supported-language journeys, documented recovery and approved release |
| G01 | Compare up to four properties by group cost and suitability | 4 | Same-date totals/features compare consistently and reconcile with checkout |
| G02 | Group/family/accessibility/workspace/pet suitability filters | 3 | Filters use recorded facts with visible evidence; missing information is not asserted |
| G03 | Occasion-based search and restrictions | 4 | Host-approved occasion, overnight/visitor capacity and restrictions survive into reservation review |
| G04 | Flexible-date savings and nearby-date quotes | 4 | Valid live alternative dates/prices respect availability/minimum stays/seasonal rates |
| G05 | Saved-search availability and price alerts | 11 | Consent/preferences enforced, relevant changes rechecked, deduplicated delivery and working unsubscribe |
| G06 | Shared trip organiser: shortlist, votes, roster, rooms, funding, itinerary and instructions | 8 | Multi-account guest journey works after reload/revocation; existing group backend reused |
| G07 | Optional cook/catering/transport/decoration services | 10 | Actual provider confirms compatibility/availability, clear quote, completion/cancellation and financial reconciliation |
| B01 | Qualified enquiry cards | 5 | Requirements/budget/timeline/source and verification provenance visible to the authorised broker |
| B02 | Deal pipeline and stage history | 5 | Enquiry moves through intake/viewing/negotiation/outcome with recorded changes and loss reason |
| B03 | Follow-up tasks and daily work list | 5/11 | Responsible broker, due date, overdue status, consented reminders and completed action history |
| B04 | Explainable client-to-property matching | 5 | Recommendations show declared requirement matches; requirements can be corrected; protected traits not used |
| B05 | Branded, permissioned client portfolios | 7 | Intended client can view on another device; expiry/revocation/attribution work; private sharing cannot bypass publication |
| B06 | Site-visit scheduling, reminders, attendance and feedback | 6 | Concurrent/conflicting slots rejected, rescheduling notified, private directions scoped and feedback persisted |
| B07 | Co-broker attribution, responsibilities and negotiated commission milestones | 9 | Recorded approved agreement/revisions, introduction history and exception workflow; no guaranteed entitlement claims |
| B08 | Team lead assignment, duplicate handling and handover | 5 | Only authorised agency members access records, duplicates reviewed, reassignment preserves history |
| S01 | Seller activity and approvals dashboard | 9 | Enquiries/viewings/feedback/offers/pending tasks correspond to real owned property records |
| S02 | Seller-configured buyer qualification | 6 | Proportionate questions and restricted evidence; self-reported/contact-verified/reviewed statuses distinguished |
| S03 | Private versioned document room | 7 | Scoped grants, expiry, withdrawal and access logs tested; watermark limits accurately communicated |
| S04 | Structured offers, revisions and comparison | 9 | Price/conditions/timing/financing statements and seller decisions versioned; concurrent edits cannot overwrite history |
| S05 | Listing-quality assistance and media/floor-plan checklist | 3 | Missing content actionable, uploaded evidence linked to relevant rooms/features, completeness distinct from verification |
| S06 | Attributed comparable-listing and pricing context | 4 | Source/date/context visible; asking prices never presented as achieved sale prices or guaranteed valuation |
| S07 | Seller-appointed broker mandates and capability controls | 7 | Assignment approval, sensitive-change approval, expiry and withdrawal affect dependent access/shares |
| S08 | Rent-while-selling and one property/two workflows | 9 | Stay/viewing/service calendar conflicts handled; owner approval and guest privacy respected; sold/withdrawn transitions controlled |
| D01 | Seller-approved stay-before-buy with optional purchase credit | 12 | Normal stay links to an acquisition enquiry; approved terms versioned; credit applied once or reversed correctly |
| D02 | Evidence-backed property specification with review provenance | 3 | Each claim exposes supplied/reviewed/missing status, scope, source/date and re-review after relevant change |

## Coverage notes

- The researched “one property, two workflows” concept is covered by S08 rather than duplicated as another requirement.
- Existing messaging, support, reviews, gallery, account persistence and broker subscription foundations are prerequisites and reused journeys. Production readiness is covered by F01–F03.
- The existing UI is the visual baseline. Group and inbox controls still require code integration where the current pages do not expose their new backend contracts.
- No proposed feature is dropped because it is scheduled in a later release.

## Tracking rules

For each requirement, create its implementation task with owner, branch, schema/API/UI changes, tests, evidence and deployment dependencies. Mark accepted only after its end-to-end criterion passes and the release review is complete. Record blocked/deferred status explicitly with the dependency and user decision.

Master plan: [IMPLEMENTATION_PLAN.md](../../IMPLEMENTATION_PLAN.md).
