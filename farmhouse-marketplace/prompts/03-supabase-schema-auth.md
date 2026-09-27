# Prompt 03 — Supabase Schema, Auth, and RLS

Read `../DATABASE_PLAN.md`.

## Task
Create the first database migration set and authentication foundation.

### Database
Create migrations for:
- profiles
- host_profiles
- properties
- property_images
- amenities
- property_amenities
- availability
- pricing_rules
- favorites
- bookings
- booking_guests
- payments
- reviews
- host_verifications
- property_verifications
- notifications
- conversations
- messages
- admin_actions

Add indexes for property search, availability, bookings, and foreign keys.

### Auth
Implement Supabase Auth with Google OAuth as the first provider.
Create callback handling and a session-aware server/client setup.

### RLS
Enable RLS on all app tables.
Public users can read only published property data.
Hosts can modify only their own property-related data.
Guests can access only their own private data.
Admin policies should be explicit and isolated.

### Acceptance
- migrations apply cleanly
- RLS policies are included in migrations
- no service-role secret reaches client bundles
- authenticated session can be read server-side and client-side where required
- unauthenticated users can still browse published properties

Stop after completing this task.
