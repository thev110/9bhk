# Payment configuration

Credentials previously committed in this document must be revoked and replaced.
Removing them from the current file does not remove them from Git history.
Rotate the Razorpay API key and split-token secret, and review provider access logs.
History cleanup requires a coordinated repository rewrite; it is not performed by this change.

Store new values only in the deployment's secret manager or ignored `.env.local`.

Required settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `RAZORPAY_KEY_ID` (server only; returned as the checkout public key when needed)
- `RAZORPAY_KEY_SECRET` (server only)
- `RAZORPAY_WEBHOOK_SECRET` (server only)
- `SPLIT_TOKEN_SECRET` (server only; use an independent, random secret)
- `NEXT_PUBLIC_SITE_URL` (canonical HTTPS origin)

Apply the reviewed database migrations before enabling transactions. Use a test
Razorpay account to verify booking holds, captured payments, duplicate webhook
delivery, cancellation, refunds, expired holds, and split payments before switching
to live credentials. Configure the webhook to `/api/payments/webhook` with the
matching secret. Never use credentials from repository history for testing.

The gateway integration does not itself establish an escrow arrangement. Host
payout requests and refund requests must display their actual processing state.
Validate listing tax rates, fees, refund terms, and settlement rules against the
business's approved configuration before launch.

The new implementation also includes separate staff-reviewed refund dispatch,
RazorpayX host/provider payouts, deposit cases and service payment/refund flows.
These paths have not yet been verified in staging. Keep
`REFUND_DISPATCH_ENABLED=false` and `PAYOUT_DISPATCH_ENABLED=false` until test
credentials, provider webhook secrets, verified destinations, reconciliation
procedures and business terms have been approved. RazorpayX uses separate
`RAZORPAYX_KEY_ID`, `RAZORPAYX_KEY_SECRET`, `RAZORPAYX_ACCOUNT_NUMBER` and
`RAZORPAYX_WEBHOOK_SECRET`; send its signed events to `/api/payouts/webhook`.
Schedule `/api/bookings/expire`, `/api/services/expire`,
`/api/discovery/alerts` and `/api/notifications/deliver` with `CRON_SECRET`.
The current implementation sends in-app notifications; no email or SMS delivery
provider is configured for new alerts.
