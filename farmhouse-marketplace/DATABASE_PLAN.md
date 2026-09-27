# Database Plan

Core tables:
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

Important rules:
- UUID primary keys.
- `properties.host_id` references the owning host profile.
- Published properties are publicly readable.
- Hosts may modify only their own properties and related records.
- Guests may access only their own bookings/favorites/notifications.
- Reviews may be created only for eligible completed bookings.
- Payment provider identifiers stay in `payments`.
- Image binaries live in Supabase Storage; PostgreSQL stores metadata/path.
- Do not expose the service role key to the browser.
