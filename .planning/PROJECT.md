# 9bhk.app — Group Stay & Villa Marketplace

## What This Is

9bhk is a marketplace for **whole houses you gather in** — villas, bungalows and pool houses with a minimum of three bedrooms. It is not a hotel, and it is not restricted to the coast. A listing can be on the beach, on a hill station, in the city, or out in the countryside; the setting is a filter, not a gate.

Four settings are recognised: **Seaside**, **Hill Station**, **In the City**, and **Countryside**. Seaside is one option among four — beachfront is never a mandate, and a hill or city listing is never a second-class listing. The platform bridges private group stays, direct property sales, and a realtor portal where agents onboard clients and close transactions.

## Core Value

Real group houses, honestly categorised: every listing is a whole home with at least three bedrooms, the setting is always stated plainly, and a garage is a bonus rather than a requirement.

## Requirements

### Validated
- [x] Next.js 15 App router foundation with responsive shell and search rails
- [x] Supabase authentication and property storage integration
- [x] Saved wishlists, booking flows, and host creation wizard

### Active
- [ ] **Setting Taxonomy**: `setting` ∈ `seaside | hill_station | city | countryside`, with `setting_name` and `setting_detail` replacing beachfront-only metadata. Coastal fields (`beach_frontage`, `coastal_zone`, `private_beach_access`, `tide_distance_meters`) are nullable and exclusive to seaside listings.
- [ ] **Optional Garage Engine**: Standardized garage types (Subterranean Collector's Vault, Beach & Marine Port, Executive EV Pavilion, Teak Portico) with clearance and climate specs. A listing may have no garage at all; the detail page says so plainly rather than rendering a fabricated spec.
- [ ] **Property Sales Engine ("Buy" Tab)**: Dedicated tab and view for properties listed for sale, complete with asking price, lot size, title verification, and private walkthrough requests. Sales must span more than one setting.
- [ ] **Direct Seller Listing Flow**: Enable owners to list villas and bungalows for sale with title deeds, garage specs, and asking prices.
- [ ] **Realtor & Broker Portal**: Roster management for agents to onboard clients, protect buyer confidentiality, tag commission splits, and use Client Presentation Mode.
- [ ] **Tactile Minimal UI/UX**: Lightweight, responsive interface with spring-based hover buttons, minimal visual noise, and instant setting badges.

### Out of Scope
- Rooms inside a hotel, serviced apartments, or any listing under three bedrooms.
- Generic mass-market listings or low-ticket single-room rentals.
- Automated instant card purchases for multi-crore transactions (sales require private viewings, LOI, and verified escrow steps).

## Constraints
- **Stack**: Next.js 15, React 19, Vanilla CSS design system, Motion, Supabase SSR.
- **Design Standard**: Restrained luxury, physical spring animations, subtle hover states, zero AI slop.
- **i18n**: English is the source of truth; Tamil and Telugu must stay at 100% key coverage.
