# Roadmap: 9bhk Group Stay & Villa Marketplace

## Overview

9bhk is a marketplace for whole houses people gather in — villas, bungalows and pool houses with at least three bedrooms, in any setting: seaside, hill station, city, or countryside. We replaced the earlier direct-beachfront-only mandate with a four-setting taxonomy, made the luxury garage showcase an optional differentiator, kept the property sales engine on a "Buy" tab, and retained the realtor portal with client onboarding.

## Phases

- [x] **Phase 1: Setting Taxonomy & Garage Architecture** - Four-setting taxonomy, optional garage classification, group-house floor, and schema updates.
- [x] **Phase 2: Property Sales Engine & "Buy" Tab** - Dedicated sales marketplace tab, estate acquisition cards, and private viewing workflows.
- [x] **Phase 3: Realtor & Broker Portal** - Agent onboarding, client roster management, presentation mode, and co-broking attribution.
- [x] **Phase 4: Tactile UI/UX & Hover Micro-Interactions** - Refined hover button system, garage inspector pills, and responsive presentation layouts.
- [x] **Phase 5: Setting Generalisation** - Removed the beachfront-only mandate across data model, cards, detail page, search, buy, wizard, i18n, and tests.

## Phase Details

### Phase 5: Setting Generalisation
**Goal**: Stop forcing every listing to be beachfront. Group houses can be on the coast, in the hills, in the city, or in the countryside.
**Depends on**: Phase 1-4
**Requirements**: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05
**Success Criteria**:
  1. `Property.setting` is required and the seed catalog populates all four settings, with seaside a minority of the catalog.
  2. Coastal fields are optional and exclusive to seaside listings; a non-seaside listing never renders a shoreline spec.
  3. Garages are optional end to end — data model, cards, detail page, wizard, filters, and admin all handle a missing garage.
  4. The host wizard blocks listings under three bedrooms and asks for a setting rather than a shoreline.
  5. Home, search, buy, command palette, and the realtor area picker all expose settings instead of coastal-only facets.
  6. English/Tamil/Telugu catalogs stay at 100% key coverage, and the suite asserts the taxonomy rather than beachfront exclusivity.
**Plans**: 1 plan

Plans:
- [x] 05-01: Generalise the catalog across model, surfaces, wizard, schema, i18n, and tests.


### Phase 2: Property Sales Engine & "Buy" Tab
**Goal**: Launch the dedicated "Buy" marketplace tab, sales inquiry flows, and seller listing intake.
**Depends on**: Phase 1
**Requirements**: REQ-03, REQ-04
**Success Criteria**:
  1. Users can switch between "Rentals" and "Buy / For Sale" seamlessly via navigation.
  2. Properties for sale display crore-denominated pricing, land survey area, and title status.
  3. Buyers can submit a confidential "Private Viewing Request" or "Acquisition LOI".
  4. Sellers can list a villa, bungalow or pool house specifically for sale.
**Plans**: 2 plans

Plans:
- [x] 02-01: Implement "Buy" tab, sales listing views, and property acquisition cards.
- [x] 02-02: Build seller listing flow for sales properties and private viewing request modal.

### Phase 3: Realtor & Broker Portal
**Goal**: Enable real estate agents to register, onboard their private buyer/seller clients, and co-broker properties.
**Depends on**: Phase 2
**Requirements**: REQ-05
**Success Criteria**:
  1. Realtors can register with agency details and access a dedicated agent dashboard.
  2. Agents can onboard private client profiles with investment mandates and confidentiality tiers.
  3. Agents can activate "Client Presentation Mode" on any property.
**Plans**: 2 plans

Plans:
- [x] 03-01: Build Realtor registration, workspace dashboard, and client onboarding roster.
- [x] 03-02: Implement Client Presentation Mode and agent lead-tagging on listings.

### Phase 4: Tactile UI/UX & Hover Micro-Interactions
**Goal**: Polish the visual layer with fluid spring animations, tactile hover buttons, and high-end minimalism.
**Depends on**: Phase 3
**Requirements**: REQ-06
**Success Criteria**:
  1. Buttons exhibit spring-based hover elevation, crisp specular rims, and zero layout shift.
  2. Listing cards include interactive garage inspector hover pills.
  3. The interface maintains restraint and high-contrast elegance across mobile and desktop.
**Plans**: 1 plan

Plans:
- [x] 04-01: Implement design tokens, hover button micro-states, and garage inspect drawer.

