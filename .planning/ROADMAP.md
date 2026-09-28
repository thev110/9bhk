# Roadmap: 9bhk Coastal & Supercar Estate Marketplace

## Overview

Transform 9bhk from a generic farmhouse rental site into an ultra-exclusive coastal beach estate marketplace. We enforce a direct-beachfront-only mandate, introduce a dedicated luxury garage showcase, launch a property sales engine with a "Buy" tab, build a realtor portal with client onboarding, and wrap it all in a minimal UI with tactile hover interactions.

## Phases

- [x] **Phase 1: Beachfront Core & Garage Architecture** - Strict beach-only taxonomy, luxury car garage classification, and schema updates.
- [x] **Phase 2: Property Sales Engine & "Buy" Tab** - Dedicated sales marketplace tab, estate acquisition cards, and private viewing workflows.
- [x] **Phase 3: Realtor & Broker Portal** - Agent onboarding, client roster management, presentation mode, and co-broking attribution.
- [x] **Phase 4: Tactile UI/UX & Hover Micro-Interactions** - Refined hover button system, garage inspector pills, and responsive presentation layouts.

## Phase Details

### Phase 1: Beachfront Core & Garage Architecture
**Goal**: Establish the strict beachfront catalog and standardized luxury garage taxonomy across mock data and Supabase schemas.
**Depends on**: Nothing (first phase)
**Requirements**: REQ-01, REQ-02
**Success Criteria**:
  1. All properties strictly adhere to direct beachfront boundaries with ocean frontage footage and sea-facing metrics.
  2. Four standardized garage types (Collector Vault, Marine Port, EV Pavilion, Teak Portico) are represented with vehicle capacities, clearance specs, and washdown capabilities.
  3. Catalog and detail views display garage and coastal badges clearly.
**Plans**: 2 plans

Plans:
- [x] 01-01: Update property catalog data model and sample estates to strictly beachfront with luxury garage specifications.
- [x] 01-02: Update database schema and property detail view to display coastal frontage and garage specs.

### Phase 2: Property Sales Engine & "Buy" Tab
**Goal**: Launch the dedicated "Buy" marketplace tab, sales inquiry flows, and seller listing intake.
**Depends on**: Phase 1
**Requirements**: REQ-03, REQ-04
**Success Criteria**:
  1. Users can switch between "Rentals" and "Buy / For Sale" seamlessly via navigation.
  2. Properties for sale display crore-denominated pricing, land survey area, and title status.
  3. Buyers can submit a confidential "Private Viewing Request" or "Acquisition LOI".
  4. Sellers can list a beachfront property specifically for sale.
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
**Depends on**: Phase 3
**Requirements**: REQ-06
**Success Criteria**:
  1. Buttons exhibit spring-based hover elevation, crisp specular rims, and zero layout shift.
  2. Listing cards include interactive garage inspector hover pills.
  3. The interface maintains restraint and high-contrast elegance across mobile and desktop.
**Plans**: 1 plan

Plans:
- [ ] 04-01: Implement design tokens, hover button micro-states, and garage inspect drawer.
