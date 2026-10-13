# 9bhk.app

Whole-property marketplace for private farmhouses, beach houses and villas.

Built with Next.js 15 App Router, React, Supabase auth/PostgreSQL and Razorpay checkout.
Public listings require three bedrooms and staff approval. Server-priced reservation
holds precede checkout; confirmation follows captured-payment reconciliation.

## Local development

Use Node.js 24 or later. Copy .env.example to ignored .env.local and supply fresh,
approved credentials. With no backend configured, public pages show preview inventory;
authentication and reservations fail closed.

Run npm ci, npm run dev, and npm run validate. The tests execute local PostgreSQL
migrations with modeled Supabase roles; they never use live payment credentials.

Read IMPLEMENTATION_STATUS.md and PAYMENTS_SETUP.md before deployment. New database
migrations must be reviewed/applied before these transaction features are enabled.
Refund and host payout requests are persisted for staff processing; the application
does not represent a request as an executed transfer or promise provider escrow.

New Stitch-generated screens are deferred at the user's request. The next design
task is preserved in .stitch/next-prompt.md.

Created by Rathnavel Karthi. All rights reserved.
