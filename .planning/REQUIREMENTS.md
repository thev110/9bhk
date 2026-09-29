# 9bhk.app — Requirements Specification

## REQ-01: Setting Data Schema & Filtering
- Every listing declares exactly one `setting`: `seaside`, `hill_station`, `city`, or `countryside`. Seaside is one option, not a mandate.
- Schema fields: `setting`, `setting_name` (human location line), `setting_detail` (one-line spec, e.g. elevation, frontage, or land size).
- Coastal fields are nullable and reserved for seaside listings: `beach_frontage`, `coastal_zone`, `private_beach_access` (boolean), `tide_distance_meters`. A non-seaside listing must not carry them.
- Every setting must have at least one listing, and seaside must never be the whole catalog.

## REQ-02: Group-House Floor
- Every listing is a whole house for gathering: a minimum of 3 bedrooms (`MIN_BEDROOMS`).
- The host wizard enforces the floor — it blocks advancing and publishing below it.
- No hotel rooms, serviced apartments, or single-room rentals.

## REQ-03: Optional Luxury Car Garage Taxonomy & Showcase
- A garage is **optional**. A listing without one is valid and must render a plain "no garage" note, never a fabricated spec.
- Structured garage taxonomy:
  1. `collector_vault`: Subterranean/climate-controlled, low approach ramp (<8° for supercars), glass viewing gallery.
  2. `marine_port`: High-clearance double bay with jet ski/boat trailer slip, deionized washdown system. Seaside listings only.
  3. `ev_pavilion`: Dual high-speed DC chargers, solar battery storage, smart access.
  4. `teak_portico`: Covered breezy timber canopy with permeable pavement and cross-ventilation.
- Garage fields: `garage_type`, `garage_capacity`, `supercar_friendly`, `ev_charging_kw`, `washdown_station`.

## REQ-04: Property Sales Engine & "Buy" Tab
- Dedicated navigation tab for **Buy** / **Properties for Sale**.
- Sales listing cards showing Asking Price (in Crores/Lakhs), Plot Area, Built-up Area, and Garage specs where present.
- Filterable by setting, so acquisition is not a coastal-only market.
- "Request Private Viewing" and "Make an Acquisition Offer" modal flows.

## REQ-05: Seller Listing Workflow ("Sell Property")
- Dual listing mode in host/seller wizard: List for Stays vs List for Sale.
- The wizard asks for a setting, not a shoreline. Beach frontage is only requested when the setting is seaside.
- Sales intake captures asking price, legal title status, surveyed land area, and garage facilities.

## REQ-06: Realtor & Broker Portal with Client Onboarding
- Realtor registration with RERA / Agency verification.
- "Client Roster": Realtors can onboard private clients (name, contact, investment budget, preferred area, garage need, privacy tier).
- Exclusive Realtor Presentation Mode: A client-facing view that hides owner direct contact and stamps the realtor's agency credentials.
- Co-broking & lead locking: Inquiries made for onboarded clients remain tagged to the sponsoring agent.

## REQ-07: Minimalist UI/UX with Tactile Hover Buttons
- Clean typography and a restrained, setting-neutral palette.
- Hover button system with subtle micro-elevation, specular rim highlight, and spring responsiveness.
- One-tap setting badge and garage inspector pill on listing cards.
