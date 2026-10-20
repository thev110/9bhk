# 9bhk.app

Whole-property marketplace for private farmhouses, beach houses and villas.

Built with Next.js 15 App Router, React, Supabase auth/PostgreSQL and Razorpay checkout.
Public listings require three bedrooms and staff approval. Server-priced reservation
holds precede checkout; confirmation follows captured-payment reconciliation.

## Local development

Use Node.js 24 or later. Copy .env.example to ignored .env.local and supply fresh,
approved credentials. With no backend configured, public pages show preview inventory;
authentication and reservations fail closed.

Run npm ci and npm run dev. When the implementation phase is ready for validation,
run npm run validate. The tests execute local PostgreSQL migrations with modeled
Supabase roles; they never use live payment credentials.

Read IMPLEMENTATION_PROGRESS.md and PAYMENTS_SETUP.md before deployment. The
expanded guest, broker and seller backend is local and unvalidated. Refund, host
and service-provider payout dispatch adapters require explicit staff review and
disabled-by-default provider configuration. A request is never displayed as a
completed transfer merely because the dispatch API was called; no escrow is promised.

The existing UI is the accepted visual baseline. The Stitch workflow is retired.
New feature controls still need integration and verification before their
end-to-end requirements can be marked accepted.

Created by Rathnavel Karthi. All rights reserved.
