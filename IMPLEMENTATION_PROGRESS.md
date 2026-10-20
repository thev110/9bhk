# Feature implementation progress — 20 October 2026

Branch: `codex/audit-fixes`. Baseline repairs are committed as `994c7dc`; this expansion was pushed as `4ffafa3`. It is not merged into `main`.

The user requested implementation first, with testing afterward, and later retired the Stitch process because the existing UI is complete. The work below implements backend contracts, database permissions, persistence helpers and API routes for the planned scope. The visual baseline is accepted by the user; new feature workflows still require connection to the current pages. This is **not** a claim that all user-facing features or release acceptance criteria are complete.

## Baseline review

The original independent reviewer resumed the `994c7dc` review against `ec74fc1`. Three findings were repaired:

- Missing viewing-request endpoint: authenticated API and database RPC now persist validated enquiries against a live sale listing.
- Premature stay completion/payout: immutable local checkout timestamp now controls both boundaries.
- Wishlist success after failure: mutations now propagate errors to the existing callers.

The reviewer approved these repairs plus the initial listing evidence/CRM scope, and separately reviewed the initial mandates/outbox scope. Subsequent changes, including later edits to the outbox, financial adapters and the full feature expansion, are **not independently approved**. The implementation agent handling the final seller-approval and co-broker milestone pass hit its usage limit after writing files, so that pass did not receive an agent completion sign-off.

Baseline tests and some early targeted checks passed before the user's testing deferral. The latest aggregate code has not been typechecked, built, migration-tested, browser-tested or provider-tested.

## Scope coverage

| IDs | Implementation written | Still required for acceptance |
|---|---|---|
| F01 | Baseline defects repaired and scoped re-review completed | Full final-diff review, migrated staging records, real identity/payment recovery |
| F02 | Staff-approved refund dispatch; RazorpayX host payouts; signed callbacks; retry keys; deposit inspection/dispute/return requests; versioned policy snapshots | Approved business terms/destinations, provider configuration, full reconciliation testing, operator interfaces |
| F03 | Role-scoped backend contracts, audit records, notification queue and source revalidation | New interface translation/accessibility, full test pass, performance and operational review, rollout |
| G01, G04 | Shared live quote calculation, up to four comparisons, bounded flexible-date quotes, viewing/closure/stay constraints | Comparison/date-search screens and end-to-end consistency verification |
| G02, S05, D02 | Structured listing facts, evidence/media, scoped expiring reviews, invalidation and completeness helpers | Filter, listing assistance and staff evidence screens |
| G03 | Explicit occasion requests, host conditions/expiry, capacity checks and checkout integration | Occasion discovery/approval interfaces |
| G05 | Private saved searches, bounded matching, price fingerprints, in-app consent, expiry and revalidation before delivery | Saved-search/preferences interfaces, scheduled deployment, channel/provider choices beyond in-app |
| G06 | Existing shortlist/votes extended with itinerary, room planning, organiser transfer, removed-member controls, booking links/guest roles, private arrival, group messages, payer assignments and funding progress | Shared trip interface and share-invite payment journey integration; payer assignment is planning metadata, while existing signed share links authorize payments |
| G07 | Approved-provider offerings, quote/host approval/acceptance/confirmation/completion/cancellation; separate service ledger, capture/refunds, checkout expiry/order recovery and reviewed provider payout dispatch | Provider operations and screens, approved provider contracts/destinations, sandbox verification |
| B01–B04 | Client-linked qualified opportunities, versioned stage history, tasks, transparent matching and reminder queue | Broker CRM screens, workflow verification |
| B05 | Versioned branded portfolios, authenticated recipient grants, expiry/revocation and live representation checks | Portfolio builder and recipient screens |
| B06 | Viewing proposals/confirmation/rescheduling/cancellation, calendar conflict guards, attendance, feedback and reminders | Viewing screens, calendar/operator validation |
| B07 | Versioned co-broker terms, explicit party acceptance, attribution, milestones with participant claims/acknowledgements, and dispute records | Agreement/milestone screens and operational dispute procedures |
| B08 | Accepted team invitations, explicit assignments, contact-sharing consent, handover history and revocation | Team workspace interfaces and permissions verification |
| S01 | Owner-scoped activity/approval counts from real records | Seller dashboard |
| S02 | Buyer self-reported qualification and versioned seller-configured questions/answers limited to transaction needs | Qualification interfaces and retention decisions |
| S03 | Private storage bucket, immutable document versions, per-recipient grants, withdrawal and audited streamed access | Document room interface; retention/watermark decisions; access verification |
| S04 | Structured immutable offer revisions, seller decisions, withdrawal and optimistic concurrency | Offer comparison and negotiation screens |
| S06 | Attributed asking/completed-sale comparables and scoped review provenance | Price-context interface and permissioned data supply |
| S07 | Capability-specific broker mandates and owner approval; versioned broker edit proposals requiring current permission and owner approval, with accepted changes returned to listing draft | Mandate/approval interfaces |
| S08 | Shared viewing/stay constraints and controlled sold/withdrawn transitions that require unresolved work to be handled | Seller controls and lifecycle scenario verification |
| D01 | Versioned owner opt-in, eligible own-booking enrollment, approved single-use credit/application/reversal records | Trial-stay interface, approved commercial terms and validation |

Nothing in this table is marked end-to-end accepted. The requirements tracker remains the acceptance authority.

## Runtime integration

New migrations are additive and ordered under `supabase/migrations/20261020*.sql`. Apply only after the later migration review and staging pass; no database was changed during this implementation.

Relevant endpoints:

- `POST /api/viewings` — validated acquisition enquiry.
- `POST /api/discovery/quotes` — live comparison/flexible quotes.
- `POST /api/discovery/alerts` — authenticated scheduled saved-search evaluation.
- `POST /api/notifications/deliver` — authenticated scheduled reminders and in-app delivery.
- `POST /api/bookings/prepare` — ordinary hold or approved `occasionRequestId`.
- `GET /api/documents/[id]` — authorized private document bytes, with `download=1` for separately permitted downloads.
- `GET /api/groups/[id]/arrival` — current approved booked guests only.
- `POST /api/admin/refunds/[id]/dispatch` — explicit staff approval/dispatch or retry.
- `POST /api/admin/payouts/[id]/dispatch` — destination-attested staff approval/dispatch.
- `POST /api/payments/webhook` — signed stay/subscription/service capture and refund reconciliation.
- `POST /api/payouts/webhook` — separately signed RazorpayX payout state.
- `POST /api/services/[id]/order`, `/api/services/verify` — authenticated service checkout.
- `POST /api/admin/services/refunds/[id]/dispatch` — staff service-refund processing.
- `POST /api/services/expire` — authenticated scheduled unpaid-service checkout expiry.
- `POST /api/admin/services/orders/[id]/reconcile` — staff recovery of uncertain provider order creation.
- `POST /api/admin/services/payouts/[id]/dispatch` — approved provider payout processing.

Existing Supabase browser helpers in `lib/supabase/` expose the new role-scoped RPCs for integration into the current UI. Direct financial mutations remain unavailable to browser roles.

## Configuration and decisions

`.env.example` now includes disabled-by-default refund/payout switches and separate RazorpayX settings. No credentials were added, no provider requests were executed, and no funds moved.

- Use fresh keys; previously exposed historical credentials still require rotation.
- Approve actual cancellation/deposit/settlement text through the policy-version workflow. Missing approval remains explicitly unreviewed; the code does not invent commercial percentages.
- Staff must verify a payout destination and record its reference before approval.
- Provision approved service providers and decide service settlement responsibilities.
- Configure scheduled endpoints with `CRON_SECRET`; in-app delivery has no email/SMS provider dependency.
- Document access is revocable for future server requests. Downloaded/viewed bytes cannot be recalled; no copy-prevention claim is made.
- The Stitch workflow is retired. The existing pages are the visual baseline; remaining feature controls should be integrated there without a separate design-generation dependency.

Refund retry handling follows Razorpay's [normal-refund idempotency documentation](https://github.com/razorpay/markdown-docs/blob/master/api/refunds/normal-refunds-idempotent.md). Payout processing follows the documented [idempotency contract](https://d6xcmfyh68wv8.cloudfront.net/docs/api/x/payout-idempotency/) and [payout lifecycle](https://github.com/razorpay/markdown-docs/blob/master/x/payouts/states-life-cycle.md). These references informed implementation; they do not constitute provider verification.

## Next verification phase

When testing resumes: review the complete diff and migration order first; run actual PostgreSQL/RLS/concurrency tests, typecheck and build; then test role workflows and signed provider callbacks in staging. Recheck refunds, unknown network outcomes, payout reversals, duplicate events, permissions removed during a session, appointment conflicts, and service cancellation after capture. Do not treat earlier green checks as evidence for the latest code.
