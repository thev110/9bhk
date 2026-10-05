/**
 * Master Competitive Keyword & Search Intent Registry.
 *
 * Built using Laya's semantic decision and search intent classification framework.
 * Categorises the complete competitive landscape across Tamil Nadu's coastal
 * and countryside corridor (ECR, Chennai, Mahabalipuram, Chengalpattu, Pondicherry).
 *
 * Directly maps high-intent search queries to 9bhk landing routes, on-page title hooks,
 * structured schema types, and competitor displacement angles to capture rank #1
 * on Google SERPs and #1 citation authority in AI Answer Engines (ChatGPT, Perplexity, Claude).
 */

export type SearchIntent = "transactional" | "commercial" | "informational" | "navigational";
export type VolumeTier = "very_high" | "high" | "medium" | "long_tail";

export type KeywordEntry = {
  keyword: string;
  intent: SearchIntent;
  volumeTier: VolumeTier;
  competitorsTargeted: string[];
  competitorGap: string;
  targetRoute: string;
  targetTitle: string;
  schema: "VacationRental" | "FAQPage" | "ItemList" | "Product" | "SoftwareApplication";
  priority: number; // 1-10 (10 = highest priority for rank #1)
};

export type KeywordCluster = {
  id: string;
  name: string;
  description: string;
  primaryRoute: string;
  primaryCompetitor: string;
  keywords: KeywordEntry[];
};

export const KEYWORD_CLUSTERS: KeywordCluster[] = [
  {
    id: "ecr-beach-houses",
    name: "ECR Beach Houses & Private Seaside Villas",
    description:
      "High-converting coastal queries along East Coast Road (Chennai to Mahabalipuram). Targeting guests seeking full-estate beach rentals with private pools and direct sand access.",
    primaryRoute: "/beach-houses/ecr",
    primaryCompetitor: "Airbnb & Unorganized WhatsApp Brokers",
    keywords: [
      {
        keyword: "ecr beach house with swimming pool",
        intent: "transactional",
        volumeTier: "very_high",
        competitorsTargeted: ["Airbnb", "WhatsApp Brokers", "Justdial"],
        competitorGap:
          "Brokers circulate unverified photos and demand non-refundable UPI advances. 9bhk guarantees verified private pools, direct host specs, and Razorpay escrow protection.",
        targetRoute: "/beach-houses/ecr",
        targetTitle: "ECR Beach Houses with Private Pool — Verified Whole Estates | 9bhk",
        schema: "VacationRental",
        priority: 10,
      },
      {
        keyword: "beach house in ecr for rent",
        intent: "transactional",
        volumeTier: "very_high",
        competitorsTargeted: ["Airbnb", "MakeMyTrip", "Local Brokers"],
        competitorGap:
          "OTAs list fragmented rooms or homestays with hidden checkout fees. 9bhk strictly lists 3+ BHK whole houses with 10% flat transparent fee.",
        targetRoute: "/beach-houses/ecr",
        targetTitle: "Beach House for Rent in ECR — Whole Private Stays | 9bhk",
        schema: "VacationRental",
        priority: 10,
      },
      {
        keyword: "luxury beach house in ecr chennai",
        intent: "commercial",
        volumeTier: "high",
        competitorsTargeted: ["StayVista", "SaffronStays"],
        competitorGap:
          "Luxury villa aggregators charge 25% markups and impose 2-night minimums. 9bhk offers verified luxury beach estates with direct owner specs.",
        targetRoute: "/beach-houses/ecr",
        targetTitle: "Luxury Beach Houses in ECR Chennai — Private Whole Villas | 9bhk",
        schema: "VacationRental",
        priority: 9,
      },
      {
        keyword: "private beach house ecr for family",
        intent: "transactional",
        volumeTier: "high",
        competitorsTargeted: ["Airbnb", "WhatsApp Brokers"],
        competitorGap:
          "Families fear party houses with unauthorized caretakers. 9bhk enforces verified host rules, family-friendly security, and verified sound curfews.",
        targetRoute: "/beach-houses/ecr",
        targetTitle: "Private Beach Houses in ECR for Families — Gated Stays | 9bhk",
        schema: "VacationRental",
        priority: 9,
      },
      {
        keyword: "beach house in kovalam ecr",
        intent: "transactional",
        volumeTier: "medium",
        competitorsTargeted: ["Airbnb", "Local Brokers"],
        competitorGap:
          "Hyper-local coastal searches lack curated platforms. 9bhk indexes exact coastal zones and high-tide setbacks.",
        targetRoute: "/beach-houses/ecr",
        targetTitle: "Beach Houses in Kovalam ECR — Direct Oceanfront Stays | 9bhk",
        schema: "VacationRental",
        priority: 8,
      },
      {
        keyword: "beach house in uthandi ecr",
        intent: "transactional",
        volumeTier: "medium",
        competitorsTargeted: ["Local Brokers"],
        competitorGap:
          "Uthandi has high-end gated beach villas traded only via WhatsApp. 9bhk brings them online with escrow safety.",
        targetRoute: "/beach-houses/ecr",
        targetTitle: "Beach Houses in Uthandi ECR — Luxury Private Villas | 9bhk",
        schema: "VacationRental",
        priority: 8,
      },
      {
        keyword: "beach house in injambakkam ecr",
        intent: "transactional",
        volumeTier: "medium",
        competitorsTargeted: ["Local Brokers"],
        competitorGap:
          "Closest beach stretch to South Chennai; high demand for quick weekend gateways with verified power backup.",
        targetRoute: "/beach-houses/ecr",
        targetTitle: "Injambakkam ECR Beach Houses with Pool — 9bhk",
        schema: "VacationRental",
        priority: 8,
      },
      {
        keyword: "beachfront villa with direct beach access ecr",
        intent: "commercial",
        volumeTier: "high",
        competitorsTargeted: ["StayVista", "Airbnb"],
        competitorGap:
          "OTAs claim 'sea view' when properties are 500m inland. 9bhk publishes exact meter distance to high-tide line.",
        targetRoute: "/beach-houses/ecr",
        targetTitle: "Direct Beachfront Villas in ECR — Verified Sand Access | 9bhk",
        schema: "VacationRental",
        priority: 9,
      },
    ],
  },
  {
    id: "chennai-farmhouses",
    name: "Chennai & Outskirts Farmhouses with Pool",
    description:
      "Searches for spacious green retreats, orchards, and private lawns in Chennai, Chengalpattu, and Kanchipuram for team gatherings and celebrations.",
    primaryRoute: "/farmhouses/chennai",
    primaryCompetitor: "Instagram Farmhouse Pages & OLX",
    keywords: [
      {
        keyword: "farm house in chennai for rent with swimming pool",
        intent: "transactional",
        volumeTier: "very_high",
        competitorsTargeted: ["Instagram Brokers", "Justdial", "OLX"],
        competitorGap:
          "Highest volume query in Tamil Nadu. Flooded with outdated listings and broken pools. 9bhk verifies pool maintenance and electrical loads.",
        targetRoute: "/farmhouses/chennai",
        targetTitle: "Farmhouse in Chennai for Rent with Swimming Pool — 9bhk",
        schema: "VacationRental",
        priority: 10,
      },
      {
        keyword: "farmhouse near chennai for 1 day rent",
        intent: "transactional",
        volumeTier: "very_high",
        competitorsTargeted: ["WhatsApp Brokers"],
        competitorGap:
          "Day outing groups get rejected by traditional OTAs requiring 2-3 night minimums. 9bhk supports flexible 1-night bookings.",
        targetRoute: "/farmhouses",
        targetTitle: "Farmhouses Near Chennai for Rent — 1-Day & Weekend Stays | 9bhk",
        schema: "VacationRental",
        priority: 9,
      },
      {
        keyword: "farm house for rent in chennai for birthday party",
        intent: "commercial",
        volumeTier: "high",
        competitorsTargeted: ["Event Organisers", "Local Brokers"],
        competitorGap:
          "Parties get evicted due to sudden sound complaints. 9bhk explicitly publishes verified sound curfew hours and DJ electrical loads.",
        targetRoute: "/farmhouses",
        targetTitle: "Farmhouses in Chennai for Birthday Parties & Gatherings | 9bhk",
        schema: "FAQPage",
        priority: 9,
      },
      {
        keyword: "private farmhouse in chengalpattu with pool",
        intent: "transactional",
        volumeTier: "medium",
        competitorsTargeted: ["Local Landowners"],
        competitorGap:
          "Secluded mango orchards and lakefront farmhouses with zero broker middleman markup.",
        targetRoute: "/farmhouses",
        targetTitle: "Private Farmhouses in Chengalpattu with Pool — 9bhk",
        schema: "VacationRental",
        priority: 8,
      },
      {
        keyword: "farmhouse in kanchipuram for rent",
        intent: "transactional",
        volumeTier: "medium",
        competitorsTargeted: ["Local Landowners"],
        competitorGap:
          "Countryside agricultural estates with modern amenities, organic groves, and full group privacy.",
        targetRoute: "/farmhouses",
        targetTitle: "Farmhouses in Kanchipuram for Rent — Private Group Stays | 9bhk",
        schema: "VacationRental",
        priority: 8,
      },
      {
        keyword: "pet friendly farmhouse in chennai",
        intent: "commercial",
        volumeTier: "high",
        competitorsTargeted: ["Airbnb"],
        competitorGap:
          "Finding genuinely pet-friendly gated lawns with secure perimeter fencing. 9bhk indexes verified pet-friendly estates.",
        targetRoute: "/farmhouses",
        targetTitle: "Pet-Friendly Farmhouses in Chennai with Private Lawn & Pool | 9bhk",
        schema: "VacationRental",
        priority: 9,
      },
    ],
  },
  {
    id: "luxury-villas",
    name: "Private Luxury Villas & Heritage Estates",
    description:
      "Exclusive high-end villas for discerning travellers in Mahabalipuram, Pondicherry, Ooty, and Kodaikanal.",
    primaryRoute: "/villas",
    primaryCompetitor: "StayVista & SaffronStays",
    keywords: [
      {
        keyword: "luxury private villas in ecr chennai",
        intent: "commercial",
        volumeTier: "very_high",
        competitorsTargeted: ["StayVista", "SaffronStays"],
        competitorGap:
          "StayVista charges inflated fees. 9bhk gives direct owner listings with supercar-friendly garages and EV chargers.",
        targetRoute: "/villas/ecr",
        targetTitle: "Luxury Private Villas in ECR Chennai — Designer Pool Estates | 9bhk",
        schema: "VacationRental",
        priority: 10,
      },
      {
        keyword: "private villas in mahabalipuram with pool",
        intent: "transactional",
        volumeTier: "high",
        competitorsTargeted: ["Airbnb", "MakeMyTrip"],
        competitorGap:
          "Heritage architecture combined with modern private swimming pools near the Shore Temple.",
        targetRoute: "/villas/mahabalipuram",
        targetTitle: "Private Villas in Mahabalipuram with Pool — Shore Estates | 9bhk",
        schema: "VacationRental",
        priority: 9,
      },
      {
        keyword: "private villas in pondicherry with swimming pool",
        intent: "transactional",
        volumeTier: "very_high",
        competitorsTargeted: ["Airbnb", "StayVista"],
        competitorGap:
          "French-inspired coastal villas and quiet beachfront sanctuaries along Serenity Beach corridor.",
        targetRoute: "/villas/pondicherry",
        targetTitle: "Private Villas in Pondicherry with Swimming Pool — 9bhk",
        schema: "VacationRental",
        priority: 9,
      },
      {
        keyword: "luxury villas in ooty for group stay",
        intent: "transactional",
        volumeTier: "high",
        competitorsTargeted: ["StayVista", "SaffronStays"],
        competitorGap:
          "Nilgiri tea estate bungalows with private bonfires, teak porticos, and panoramic valley views.",
        targetRoute: "/villas/ooty",
        targetTitle: "Luxury Villas in Ooty for Large Groups — Estate Stays | 9bhk",
        schema: "VacationRental",
        priority: 8,
      },
    ],
  },
  {
    id: "group-events-offsites",
    name: "Corporate Offsites, Hackathons & Event Stays",
    description:
      "High-value B2B and group gathering queries. Teams and families looking for venues with verified technical capacity (generator kW, parking, WiFi, catering space).",
    primaryRoute: "/stays",
    primaryCompetitor: "Commercial Resorts & Event Brokers",
    keywords: [
      {
        keyword: "villas in ecr for corporate offsite",
        intent: "commercial",
        volumeTier: "high",
        competitorsTargeted: ["Commercial Hotels", "Resorts"],
        competitorGap:
          "Resorts disperse teams into separate rooms. 9bhk provides whole estates with communal lounges, fast WiFi, and uninterrupted privacy.",
        targetRoute: "/stays",
        targetTitle: "Villas in ECR for Corporate Offsites & Team Hackathons | 9bhk",
        schema: "FAQPage",
        priority: 9,
      },
      {
        keyword: "farmhouse near chennai for team outing",
        intent: "commercial",
        volumeTier: "very_high",
        competitorsTargeted: ["Resorts", "Adventure Parks"],
        competitorGap:
          "Overcrowded public resorts ruin team bonding. 9bhk offers exclusive private grounds, catering kitchens, and private pools.",
        targetRoute: "/farmhouses",
        targetTitle: "Private Farmhouses Near Chennai for Team Outings | 9bhk",
        schema: "VacationRental",
        priority: 9,
      },
      {
        keyword: "ecr beach house for family get together",
        intent: "commercial",
        volumeTier: "very_high",
        competitorsTargeted: ["Airbnb", "WhatsApp Brokers"],
        competitorGap:
          "Multi-generational families need 3+ BHK homes with senior-friendly ground floor rooms and secure pools.",
        targetRoute: "/beach-houses/ecr",
        targetTitle: "ECR Beach Houses for Family Get-Togethers — 3+ BHK Stays | 9bhk",
        schema: "VacationRental",
        priority: 9,
      },
      {
        keyword: "villas in ecr with generator power backup",
        intent: "informational",
        volumeTier: "medium",
        competitorsTargeted: ["WhatsApp Brokers"],
        competitorGap:
          "Coastal power cuts regularly ruin celebrations. 9bhk displays verified generator capacity in kW on every listing.",
        targetRoute: "/faq",
        targetTitle: "Verified Power Backup & Generator Specs on 9bhk Stays",
        schema: "FAQPage",
        priority: 8,
      },
    ],
  },
  {
    id: "creator-production-shoots",
    name: "Creator, Film Shoot & Fashion Lookbook Locations",
    description:
      "Production houses, YouTube creators, fashion labels, and wedding photographers looking for verified private shoot locations.",
    primaryRoute: "/creators",
    primaryCompetitor: "Film Location Brokers & WhatsApp Agents",
    keywords: [
      {
        keyword: "beach house in ecr for photoshoot",
        intent: "commercial",
        volumeTier: "high",
        competitorsTargeted: ["Location Brokers", "Instagram Pages"],
        competitorGap:
          "Brokers charge hidden 'shooting surcharges' on arrival. 9bhk publishes transparent creator and commercial rates.",
        targetRoute: "/creators",
        targetTitle: "Beach Houses in ECR for Photoshoots & Brand Campaigns | 9bhk",
        schema: "Product",
        priority: 9,
      },
      {
        keyword: "villas in chennai for pre wedding shoot",
        intent: "commercial",
        volumeTier: "high",
        competitorsTargeted: ["Photo Studios", "Resorts"],
        competitorGap:
          "Public resorts crowd shots with tourists. 9bhk provides secluded private courtyards, infinity pools, and beach frontage.",
        targetRoute: "/creators",
        targetTitle: "Private Villas in Chennai for Pre-Wedding Shoots | 9bhk",
        schema: "Product",
        priority: 9,
      },
      {
        keyword: "farmhouse for film shooting chennai",
        intent: "commercial",
        volumeTier: "medium",
        competitorsTargeted: ["Cinema Location Agents"],
        competitorGap:
          "Film crews need verified sanctioned electrical load (kW) and generator support for heavy lighting rigs.",
        targetRoute: "/creators",
        targetTitle: "Farmhouses in Chennai for Film & Ad Shoots — Power Verified | 9bhk",
        schema: "Product",
        priority: 8,
      },
    ],
  },
  {
    id: "estate-sales",
    name: "Luxury Beach House & Estate Acquisitions (For Sale)",
    description:
      "High-net-worth individuals seeking outright purchase of luxury beach bungalows, agricultural farmhouses, and coastal land.",
    primaryRoute: "/buy",
    primaryCompetitor: "MagicBricks, 99acres & Housing.com",
    keywords: [
      {
        keyword: "beach house for sale in ecr chennai",
        intent: "transactional",
        volumeTier: "very_high",
        competitorsTargeted: ["MagicBricks", "99acres", "Housing.com"],
        competitorGap:
          "Portals are overrun with spam broker listings and stale rates. 9bhk publishes verified whole estates with asking price in Crores and land area.",
        targetRoute: "/buy",
        targetTitle: "Beach Houses for Sale in ECR Chennai — Verified Luxury Estates | 9bhk",
        schema: "Product",
        priority: 10,
      },
      {
        keyword: "luxury villa for sale in ecr",
        intent: "transactional",
        volumeTier: "high",
        competitorsTargeted: ["99acres", "Local Realtors"],
        competitorGap:
          "Ultra-luxury oceanfront villas directly presented with verified architectural details and ownership clearance.",
        targetRoute: "/buy",
        targetTitle: "Luxury Villas for Sale in ECR — Verified Oceanfront Homes | 9bhk",
        schema: "Product",
        priority: 9,
      },
      {
        keyword: "farmhouse for sale near chennai",
        intent: "transactional",
        volumeTier: "high",
        competitorsTargeted: ["MagicBricks", "Local Brokers"],
        competitorGap:
          "Curated agricultural estates and mango farms with clear title verification and verified groundwater records.",
        targetRoute: "/buy",
        targetTitle: "Farmhouses for Sale Near Chennai — Acreage & Private Estates | 9bhk",
        schema: "Product",
        priority: 9,
      },
    ],
  },
  {
    id: "competitor-alternatives",
    name: "Competitor Displacement & Safe Escrow Booking",
    description:
      "Searchers frustrated by OTA fees, deceptive listings, and WhatsApp payment fraud looking for trusted alternatives.",
    primaryRoute: "/about",
    primaryCompetitor: "StayVista, SaffronStays & Airbnb",
    keywords: [
      {
        keyword: "stayvista alternative chennai ecr",
        intent: "commercial",
        volumeTier: "medium",
        competitorsTargeted: ["StayVista"],
        competitorGap:
          "StayVista charges premium markups with limited local Chennai inventory. 9bhk offers direct local estates with 10% flat fee.",
        targetRoute: "/about",
        targetTitle: "9bhk vs StayVista — Transparent Group Villa Booking in ECR",
        schema: "FAQPage",
        priority: 8,
      },
      {
        keyword: "airbnb alternative private villas chennai",
        intent: "commercial",
        volumeTier: "high",
        competitorsTargeted: ["Airbnb"],
        competitorGap:
          "Airbnb hides service fees until checkout and mixes single rooms. 9bhk enforces 3+ BHK whole estates exclusively.",
        targetRoute: "/about",
        targetTitle: "Airbnb Alternative for Whole Villas in Chennai & ECR | 9bhk",
        schema: "FAQPage",
        priority: 9,
      },
      {
        keyword: "how to book ecr beach house without broker scam",
        intent: "informational",
        volumeTier: "high",
        competitorsTargeted: ["WhatsApp Fraud / Direct UPI"],
        competitorGap:
          "Guests lose deposits to bogus Instagram accounts. 9bhk safeguards all booking funds in Razorpay escrow until check-in.",
        targetRoute: "/faq",
        targetTitle: "Safe ECR Beach House Booking — Escrow Protection & Zero Fraud | 9bhk",
        schema: "FAQPage",
        priority: 9,
      },
    ],
  },
  {
    id: "broker-workspace",
    name: "Realtor & Broker Digital Catalog",
    description:
      "Real estate agents and property managers seeking clean catalog sharing tools to replace messy WhatsApp PDFs and chats.",
    primaryRoute: "/realtor",
    primaryCompetitor: "WhatsApp & Generic PDF Catalogs",
    keywords: [
      {
        keyword: "real estate broker catalog app chennai",
        intent: "commercial",
        volumeTier: "medium",
        competitorsTargeted: ["Brokers using WhatsApp"],
        competitorGap:
          "Realtors struggle with chaotic WhatsApp galleries. 9bhk provides a ₹500/month branded catalog with client calendar links.",
        targetRoute: "/realtor",
        targetTitle: "Digital Catalog & Workspace for Real Estate Brokers — ₹500/mo | 9bhk",
        schema: "SoftwareApplication",
        priority: 8,
      },
      {
        keyword: "villa booking link for clients whatsapp",
        intent: "transactional",
        volumeTier: "medium",
        competitorsTargeted: ["Manual Calendars"],
        competitorGap:
          "Brokers manually check dates. 9bhk provides real-time client booking links with live calendar availability.",
        targetRoute: "/realtor",
        targetTitle: "Client Booking & Calendar Links for Property Realtors | 9bhk",
        schema: "SoftwareApplication",
        priority: 8,
      },
    ],
  },
];

/**
 * Return all keywords flattened for AEO / sitemap or audit consumption.
 */
export function getAllKeywords(): KeywordEntry[] {
  return KEYWORD_CLUSTERS.flatMap((cluster) => cluster.keywords);
}

/**
 * Find keywords targeted to a specific page route.
 */
export function getKeywordsForRoute(route: string): KeywordEntry[] {
  return getAllKeywords().filter((k) => k.targetRoute === route);
}
