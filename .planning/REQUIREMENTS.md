# 9bhk.app — Requirements Specification

## REQ-01: Direct Beachfront Data Schema & Filtering
- Every listed property must have direct beach frontage. Inland properties or gated villas without direct beach boundaries are strictly excluded.
- Schema fields: `beach_frontage_ft`, `sea_facing_degrees`, `crz_zone`, `private_beach_access` (boolean).

## REQ-02: Luxury Car Garage Taxonomy & Showcase
- Structured garage taxonomy:
  1. `collector_vault`: Subterranean/climate-controlled, low approach ramp (<8° for supercars), glass viewing gallery.
  2. `marine_port`: High-clearance double bay with jet ski/boat trailer slip, deionized washdown system.
  3. `ev_pavilion`: Dual high-speed DC chargers, solar battery storage, smart access.
  4. `teak_portico`: Covered breezy timber canopy with sand-trap pavement and cross-ventilation.
- Garage fields: `garage_type`, `garage_capacity`, `supercar_friendly`, `ev_charging_kw`, `washdown_station`.

## REQ-03: Property Sales Engine & "Buy" Tab
- Dedicated top/bottom navigation tab for **Buy** / **Properties for Sale**.
- Sales listing cards showing Asking Price (in Crores/Lakhs), Plot Area, Built-up Area, and Garage specs.
- "Request Private Viewing" and "Make an Acquisition Offer" modal flows.

## REQ-04: Seller Listing Workflow ("Sell Property")
- Dual listing mode in host/seller wizard: List for Rent vs List for Sale.
- Sales intake captures asking price, legal title status, surveyed boundary, and detailed garage facilities.

## REQ-05: Realtor & Broker Portal with Client Onboarding
- Realtor registration with RERA / Agency verification.
- "Client Roster": Realtors can onboard private clients (name, contact, investment budget, privacy tier).
- Exclusive Realtor Presentation Mode: A client-facing view that hides owner direct contact and stamps the realtor's agency credentials.
- Co-broking & lead locking: Inquiries made for onboarded clients remain tagged to the sponsoring agent.

## REQ-06: Minimalist UI/UX with Tactile Hover Buttons
- Clean typography and restrained coastal palette.
- Hover button system with subtle micro-elevation, specular rim highlight, and spring responsiveness.
- One-click garage inspector pill on listing cards.
