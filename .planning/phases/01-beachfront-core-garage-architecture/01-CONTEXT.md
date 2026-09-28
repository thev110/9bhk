# Phase 01: Beachfront Core & Garage Architecture - Context

**Gathered:** 2026-09-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 establishes the fundamental data structures, mock data catalogs, Supabase schema migrations, and UI badges for genuine beachfront properties and luxury car garages. It purges all generic inland farmhouses and institutes an uncompromising direct-beachfront filter.

</domain>

<decisions>
## Implementation Decisions

### 1. The Strict Beachfront Standard
- **D-01:** Exclusively list properties with direct coastal frontage. Inland or suburban villas situated more than 100m from the shoreline are strictly excluded.
- **D-02:** Introduce coastal boundary fields to property types:
  - `beachFrontage`: string (e.g., "140 ft private beach frontage")
  - `coastalZone`: "Direct Oceanfront" | "Dune Edge Sanctuary" | "Cove Front"
  - `privateBeachAccess`: boolean (must have private boardwalk or sandy pathway direct to sand)
  - `tideDistanceMeters`: number (distance from property boundary to high tide line)

### 2. Luxury Garage Taxonomy
- **D-03:** Define four standardized coastal garage types:
  1. `collector_vault`: "Subterranean Collector's Vault" (Climate/dehumidified, <8° approach ramp for supercars, interior glass showcase lounge).
  2. `marine_port`: "Beach & Marine Port" (Dual high-clearance bays, jet-ski/boat trailer slip, deionized washdown system).
  3. `ev_pavilion`: "Executive EV Pavilion" (Dual high-speed DC chargers, solar battery storage, smart biometric access).
  4. `teak_portico`: "Coastal Breeze Teak Portico" (Shaded hardwood pergola with sand-trap pavement and salt-mist aeration).
- **D-04:** Garage specification fields on properties:
  - `garageType`: `collector_vault` | `marine_port` | `ev_pavilion` | `teak_portico`
  - `garageCapacity`: number (e.g. 2, 4, 6 cars)
  - `supercarFriendly`: boolean (signaling ground clearance ramp suitability)
  - `evChargingKw`: number (e.g. 22 or 50)
  - `washdownStation`: boolean

### 3. Psychological Positioning
- **D-05:** Frame the properties not as "vacation rentals" or "farmhouses", but as **"Sovereign Coastal Sanctuaries"**.
- **D-06:** Surface garage and oceanfront specs prominently on cards and property headers so high-net-worth buyers immediately see preservation value for high-end vehicles.

### Agent Discretion
- Sample property names, coastal locations (ECR, Mahabalipuram, Kovalam, Pondicherry), photography selections, and exact TypeScript interface naming.

</decisions>

<canonical_refs>
## Canonical References

- `lib/properties.ts` — Existing property definitions and types to be refactored.
- `supabase/migrations/20260927120000_bhk_properties.sql` — Existing database schema to receive garage and coastal columns.
- `app/property/[slug]/page.tsx` — Property detail page to render garage and coastal badges.

</canonical_refs>
