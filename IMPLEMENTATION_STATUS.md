# Audit repairs and feature implementation

## Current update — 20 October 2026

Baseline repairs are committed as `994c7dc`. The original independent reviewer
resumed, identified three further defects, and verified their local repairs.
Backend feature expansion is now underway; see [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md)
for precise scope, remaining interfaces and financial configuration.

The user requested implementation before testing. The latest expansion has not
received a full test/build/migration or independent review pass. The Stitch
workflow was retired at the user's request. The historical results below apply to the earlier
baseline, not all current working-tree files.

## Historical baseline — 13 October 2026

Work branch: `codex/audit-fixes`. Original comparison: `ec74fc1`.

## Implemented code

- Real Supabase password, signup, OTP, recovery, cookie refresh and server auth gates.
- Backend account hydration; no browser authority over identity, payments or subscriptions.
- Safe public inventory projection, private addresses, publication/document guards.
- Server quotes, expiring holds, captured-payment settlement, event replay handling.
- Split funding before payment completion and monthly broker subscription expiry.
- Actual host listings/calendar/rates/earnings and persisted payout review requests.
- Staff listing/document/review/support workflows and durable change audit records.
- Guest/host booking conversations, support tickets, completed-stay review submission.
- Membership-scoped group plans, invitations, shared shortlists and votes (backend).
- Checked viewing requests, real galleries, search date/location handoff, browser zoom.
- Optional first-party coarse usage events and persisted booking transition notifications.

## Interface status

The user considers the existing UI complete and retired the Stitch workflow.
Current page files provide the established guest, host, broker and admin views.
Several new feature contracts still have no connected controls in those pages;
their end-to-end acceptance remains open in [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md).

## Deployment requirements

1. Revoke the exposed payment and signing credentials, review provider access,
   and configure fresh secrets. Current-tree cleanup does not erase Git history.
2. Back up the database before applying the `20261020*` migrations. The four
   `20261013000000`-`20261013030000` migrations, plus `20261013040000`, are
   **already applied in production** (see "Production migration state" below).
   Legacy payment references are marked for review. Legacy inventory below three
   bedrooms is returned to draft for review rather than relabelled with invented
   bedroom counts.
3. Verify email confirmation/recovery URLs and SMS provider settings in Supabase.
4. Test with fresh Razorpay TEST credentials and the signed captured-payment webhook.
5. Schedule authenticated POST `/api/bookings/expire` with the server's `CRON_SECRET`.
   It expires unfunded holds, queues refunds for captured partial funds, and completes
   ended paid stays so eligible guests can submit reviews.
6. Review tax rates, fees, cancellation policy, and recorded host ownership against
   the approved business configuration. The legacy 12% rate is configurable; this
   implementation does not certify its legal applicability to a given property.
7. Refund and payout requests are recorded for staff processing. Actual gateway
   refund dispatch, bank transfers, and deposit return require operational execution;
   a request is never displayed as a completed transfer. No provider escrow is assumed.
8. Metrics are disabled unless `NEXT_PUBLIC_ANALYTICS_ID=first-party`. The optional
   endpoint has bounded per-process throttling; use a deployment-level rate limit
   when enabling it at scale, and adopt a retention policy for usage/audit records.

## Production migration state (read-only check, 20 October 2026)

Production `supabase_migrations.schema_migrations` lists all five `20261013*`
migrations as applied: `20261013000000_secure_transactions`,
`20261013010000_account_persistence`, `20261013020000_community_operations`,
`20261013030000_operational_monitoring` and
`20261013040000_evidence_backed_specifications`. The first four match this repo
apart from whitespace. An earlier version of this file said no production
migrations had been run; that was wrong.

Drift found and now committed to the repo:

- `20261013040000_evidence_backed_specifications` was applied in prod but existed
  in no Git ref. It is now committed verbatim from prod's recorded statements.
- `bhk_properties.is_featured`, `featured_until`, `host_tier` (with
  `bhk_properties_host_tier_check`) and `media_verified`, the
  `public.rls_auto_enable()` event-trigger function and its `ensure_rls` event
  trigger exist in prod with no migration. `20261013050000_prod_schema_drift`
  adds them idempotently (a no-op on prod).

None of the `20261020*` migrations are applied in production yet. External
financial actions, credential rotation and history rewriting are not performed
by this implementation.

## Local validation

Run `npm run validate`. Tests include an isolated PGlite PostgreSQL instance
with modeled Supabase auth/storage schemas. It executes the actual migrations
and exercises RLS, booking and settlement RPCs; it does not connect to production.
Provider delivery and real gateway settlement require staging verification.

Completed local checks on 13 October 2026:

- Typecheck, import-cycle check (177 reachable modules), and clean production build passed.
- All 70 tests passed, including execution of the actual migrations and financial/RLS scenarios.
- 168 script references across ten locally served pages returned successful responses.
- Browser checks verified real date selection, date/location navigation, gallery Escape
  dismissal/focus restoration, and unconfigured authentication failing without local signup.
- Dependency audit reported zero known vulnerabilities; the current-tree credential
  scan found no remaining credential-like values. Previously exposed history still requires rotation.
- The independent review child failed due to the account usage limit. It did not
  produce a final review sign-off. No replacement reviewer was started.

Changes are on a review branch, not main. Production has only the `20261013*` migrations listed above.
