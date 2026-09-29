export type GarageType = "collector_vault" | "marine_port" | "ev_pavilion" | "teak_portico";

/**
 * Where an estate sits. Seaside is one option among four — it is never a
 * mandate. Anything with `setting === "seaside"` additionally carries the
 * optional coastal fields below (frontage, zone, tide distance).
 */
export type Setting = "seaside" | "hill_station" | "city" | "countryside";

export const SETTINGS: Setting[] = ["seaside", "hill_station", "city", "countryside"];

/** English display identity. `matchesFilter` and `?setting=` both use these. */
export const SETTING_LABEL: Record<Setting, string> = {
  seaside: "Seaside",
  hill_station: "Hill Station",
  city: "In the City",
  countryside: "Countryside",
};

export type CoastalZone = "Direct Oceanfront" | "Dune Edge Sanctuary" | "Cove Front";

export type GarageSpec = {
  type: GarageType;
  name: string;
  capacity: number;
  supercarFriendly: boolean;
  evChargingKw: number;
  washdownStation: boolean;
  description: string;
};

/**
 * Event capacity. Almost every OTA specs a house for *sleeping*; a celebration
 * booking turns on whether the property can actually host a function. A DJ rig
 * needs sanctioned electrical load, and a sangeet needs a sound curfew that
 * permits it — neither is visible in a bedroom count.
 *
 * Optional: a house not set up for events simply omits this, and the listing is
 * never asked to invent an event spec it cannot honour.
 */
export type CelebrationSpec = {
  /** Largest event the property is permitted to host. */
  maxEventGuests: number;
  /** Sanctioned electrical load in kW — a DJ rig and lighting trip a house without it. */
  powerLoadKw: number;
  /** Latest hour amplified sound is allowed, 24-hour clock. */
  soundCurfewHour: number;
  /** Off-street spaces for guest cars and vendor vans. */
  parkingCars: number;
  /** On-site generator capacity in kW. */
  generatorKw: number;
  /** Whether outside caterers may work on site. */
  catererKitchen: boolean;
};

export type Property = {
  id: string;
  name: string;
  location: string;
  city: string;
  /** Setting category — drives filtering, badges and the detail page layout. */
  setting: Setting;
  /** Human location line for the setting, e.g. "Ooty · Nilgiri Hills". */
  settingName: string;
  /** The one-line spec that replaces coastal frontage everywhere. */
  settingDetail: string;
  rating: number;
  reviews: number;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  price: number;
  cleaning: number;
  highlights: string;
  searchLine: string;
  amenities: string[];
  vibes: string[];
  image: string;
  alt: string;
  blurb: string;
  type: string;
  guestFavourite?: boolean;
  group: "featured" | "nearby" | "popular";
  status?: "published" | "draft";
  /** Optional. Listings without a garage simply omit it. */
  garage?: GarageSpec;
  /** Optional. Only whole houses actually set up for functions carry this. */
  celebration?: CelebrationSpec;
  /** Nights the host has closed off independently of any booking. */
  blockedDates?: string[];
  isForSale?: boolean;
  salePrice?: number;
  landArea?: string;
  // ── Seaside-only. Undefined on every non-seaside listing. ────────────────
  beachFrontage?: string;
  coastalZone?: CoastalZone;
  privateBeachAccess?: boolean;
  tideDistanceMeters?: number;
};

/**
 * 9bhk is a group-stay marketplace: every listing is a whole villa, bungalow
 * or pool house meant to be gathered in, never a room inside a hotel. Three
 * bedrooms is the floor — enforced when hosting, assumed in the seed catalog.
 */
export const MIN_BEDROOMS = 3;

export function isSeaside(property: Property): boolean {
  return property.setting === "seaside";
}

export function hasGarage(property: Property): property is Property & { garage: GarageSpec } {
  return Boolean(property.garage);
}

export const PROPERTIES: Property[] = [
  {
    id: "bay-breakers-vault",
    // Closed for a private family week — proves the host can hold nights back
    // without a booking existing.
    blockedDates: ["2026-10-04", "2026-10-05", "2026-10-18"],
    name: "The Dunes Oceanfront & Vault",
    location: "ECR · Mahabalipuram Coastal Strip",
    city: "ECR",
    setting: "seaside",
    settingName: "Mahabalipuram Dunes · ECR",
    settingDetail: "180 ft direct beach frontage",
    rating: 4.96,
    reviews: 142,
    guests: 8,
    bedrooms: 4,
    beds: 4,
    bathrooms: 4,
    price: 32000,
    cleaning: 3000,
    highlights: "180 ft Beachfront · 4-Car Climate Vault · Supercar Ramp",
    searchLine: "Direct Beach · 4-Car Vault · Pool · Supercar Ramp",
    amenities: [
      "Direct beach boardwalk",
      "Subterranean 4-car climate vault",
      "Low-approach supercar ramp (<7°)",
      "Infinity ocean pool",
      "Deionized washdown station",
      "Air conditioning",
      "High-speed Wi-Fi",
      "Full chef kitchen",
      "24/7 security & caretaker",
      "Backup power generator",
    ],
    vibes: ["Seaside", "Collector Garage", "Pool", "Large Groups"],
    image: "/assets/prop-palm-grove.jpg",
    alt: "Oceanfront infinity pool and curved lawn meeting direct sand at The Dunes Oceanfront",
    blurb: "Positioned directly on the pristine Mahabalipuram dunes with 180 feet of uninterrupted private beach frontage. A four-bedroom villa with an underground, dehumidified automotive vault engineered for low-clearance supercars.",
    type: "Oceanfront Estate",
    guestFavourite: true,
    group: "featured",
    beachFrontage: "180 ft direct beach frontage",
    coastalZone: "Direct Oceanfront",
    privateBeachAccess: true,
    tideDistanceMeters: 38,
    garage: {
      type: "collector_vault",
      name: "Subterranean Collector's Vault",
      capacity: 4,
      supercarFriendly: true,
      evChargingKw: 50,
      washdownStation: true,
      description: "Fully sealed, dehumidified climate vault with a 6.8° low-approach ramp and floor-to-ceiling glass viewing wall visible from the lower gallery lounge.",
    },
    isForSale: true,
    salePrice: 285000000,
    landArea: "4.5 Grounds (10,800 sq.ft)",
  },
  {
    id: "ooty-pine-court",
    name: "Ooty Pine Court",
    location: "Coonoor Road · Ooty",
    city: "Ooty",
    setting: "hill_station",
    settingName: "Ooty · Nilgiri Hills",
    settingDetail: "7,400 ft elevation · Valley-facing",
    rating: 4.94,
    reviews: 118,
    guests: 10,
    bedrooms: 5,
    beds: 6,
    bathrooms: 5,
    price: 19000,
    cleaning: 2200,
    highlights: "5 Bedrooms · Heated Pool · Bonfire Lawn · Nilgiri Valley View",
    searchLine: "Hill Station · 5 Bedrooms · Heated Pool · Bonfire",
    amenities: [
      "Heated outdoor pool with valley view",
      "Bonfire lawn and wood-fired barbecue deck",
      "Five ensuite bedrooms with reading nooks",
      "Cedar, pine and local stone construction",
      "Filter coffee and breakfast bar",
      "Chartered jeeps to Coonoor and Doddabetta",
      "Fibre Wi-Fi and a wood-panelled library",
      "Caretaker and daily housekeeping",
      "Rain-fed rainwater harvesting",
    ],
    vibes: ["Hill Station", "Pool", "Large Groups", "Bonfire"],
    image: "/assets/prop-verde-meadow.jpg",
    alt: "Pine-fringed stone villa with a heated pool looking down into the Nilgiri valley at Ooty",
    blurb: "A five-bedroom hill villa at 7,400 feet, built into the Coonoor Road slope in local stone and pine. The whole floor plate is given over to a common hall so a large family or two families can gather in one place — the pool deck, the library and the kitchen all open onto the valley.",
    type: "Hill Station Villa",
    guestFavourite: true,
    group: "popular",
    isForSale: true,
    salePrice: 125000000,
    landArea: "1.4 Acres (60,984 sq.ft)",
  },
  {
    id: "kovalam-dune-residence",
    celebration: {
      maxEventGuests: 80,
      powerLoadKw: 32,
      soundCurfewHour: 22,
      parkingCars: 25,
      generatorKw: 20,
      catererKitchen: true,
    },
    name: "Kovalam Dune & Teak Sanctuary",
    location: "Kovalam Coastline · ECR",
    city: "ECR",
    setting: "seaside",
    settingName: "Kovalam Coast · ECR",
    settingDetail: "240 ft direct oceanfront",
    rating: 4.88,
    reviews: 110,
    guests: 10,
    bedrooms: 5,
    beds: 5,
    bathrooms: 5,
    price: 36000,
    cleaning: 3500,
    highlights: "240 ft Beachfront · 6-Car Gallery · EV Pavilion",
    searchLine: "Direct Beach · 6-Car Vault · EV Pavilion · Pool",
    amenities: [
      "Uninterrupted 240 ft beach frontage",
      "6-vehicle enclosed gallery",
      "50kW DC fast charging",
      "Ocean-facing lap pool",
      "Private teak dune boardwalk",
      "Outdoor barbecue deck",
      "Air conditioning in all suites",
      "High-speed fiber connectivity",
      "Solar storage backup",
    ],
    vibes: ["Seaside", "Collector Garage", "EV Ready", "Pool", "Large Groups"],
    image: "/assets/prop-blue-horizon.jpg",
    alt: "Sprawling coastal residence looking directly over the surf at Kovalam Coast",
    blurb: "An expansive coastal compound set across private dunes, five bedrooms deep so two families travel together without splitting. An executive EV gallery with solar microgrid buffering handles a full convoy of cars.",
    type: "Oceanfront Estate",
    group: "featured",
    beachFrontage: "240 ft direct oceanfront",
    coastalZone: "Dune Edge Sanctuary",
    privateBeachAccess: true,
    tideDistanceMeters: 52,
    garage: {
      type: "ev_pavilion",
      name: "Executive EV Pavilion",
      capacity: 6,
      supercarFriendly: true,
      evChargingKw: 50,
      washdownStation: true,
      description: "6-vehicle enclosed pavilion with dedicated dual 50kW DC hyperchargers backed by a 40kWh rooftop solar battery bank.",
    },
    isForSale: true,
    salePrice: 380000000,
    landArea: "6.0 Grounds (14,400 sq.ft)",
  },
  {
    id: "courtallam-falls-bungalow",
    celebration: {
      maxEventGuests: 40,
      powerLoadKw: 20,
      soundCurfewHour: 21,
      parkingCars: 12,
      generatorKw: 10,
      catererKitchen: true,
    },
    name: "Courtallam Falls Bungalow",
    location: "Main Falls Road · Courtallam",
    city: "Courtallam",
    setting: "hill_station",
    settingName: "Courtallam · Tenkasi Hills",
    settingDetail: "4,100 ft elevation · Waterfall road access",
    rating: 4.91,
    reviews: 87,
    guests: 8,
    bedrooms: 4,
    beds: 5,
    bathrooms: 4,
    price: 14000,
    cleaning: 1800,
    highlights: "4 Bedrooms · Waterfall Road · Courtyard Pool · Teak Portico",
    searchLine: "Hill Station · 4 Bedrooms · Courtyard Pool · Teak Portico",
    amenities: [
      "Walking distance to the main falls and spa trail",
      "Plunge pool in a walled courtyard",
      "Colonial-era teak bungalow, restored",
      "Four bedrooms opening onto a shared veranda",
      "Rainwater-fed garden with giant bamboo",
      "Outdoor barbecue and a covered porch",
      "Air conditioning in all bedrooms",
      "Caretaker, cook on request, daily housekeeping",
    ],
    vibes: ["Hill Station", "Pool", "Teak Portico", "Large Groups"],
    image: "/assets/prop-coconut-grove.jpg",
    alt: "A restored teak bungalow with a walled courtyard pool set among giant bamboo at Courtallam",
    blurb: "A restored four-bedroom teak bungalow a short walk from the main Courtallam falls. Water comes off the hills, so the courtyard plunge pool is fed by gravity and the garden stays green without a single pump.",
    type: "Hill Station Bungalow",
    group: "featured",
    garage: {
      type: "teak_portico",
      name: "Teak Portico",
      capacity: 2,
      supercarFriendly: false,
      evChargingKw: 11,
      washdownStation: false,
      description: "Roofed hardwood portico with permeable granite paving for two cars, a charging socket, and a covered cycle store for the hill roads.",
    },
    isForSale: false,
  },
  {
    id: "neelankarai-marine-pavilion",
    name: "Neelankarai Tide & Marine Port",
    location: "Neelankarai Beach Road · Chennai",
    city: "Chennai",
    setting: "seaside",
    settingName: "Neelankarai · Chennai Coast",
    settingDetail: "120 ft private beach frontage",
    rating: 4.91,
    reviews: 88,
    guests: 6,
    bedrooms: 3,
    beds: 3,
    bathrooms: 3,
    price: 24000,
    cleaning: 2500,
    highlights: "120 ft Beachfront · Dual Marine Slipway · 22kW EV",
    searchLine: "Direct Beach · Marine Port · Jet Ski Slip · Pool",
    amenities: [
      "Direct beach boardwalk",
      "Dual marine trailer bay",
      "Salt-stripping washdown rig",
      "Private saltwater plunge pool",
      "22kW dual EV chargers",
      "Air conditioning",
      "Equipped modern kitchen",
      "Wi-Fi & Sonos audio",
      "Pet friendly beach lawn",
    ],
    vibes: ["Seaside", "Marine Port", "EV Ready", "Pool"],
    image: "/assets/prop-lakeview-courtyard.jpg",
    alt: "Modern coastal courtyard opening straight onto the beach at Neelankarai Marine Pavilion",
    blurb: "Direct shoreline residence designed for marine enthusiasts. Three bedrooms share one open-plan living floor, with dual high-clearance bays for trailers and a deionized system to strip corrosive coastal mist.",
    type: "Marine Beachfront Villa",
    group: "nearby",
    beachFrontage: "120 ft private beach frontage",
    coastalZone: "Direct Oceanfront",
    privateBeachAccess: true,
    tideDistanceMeters: 45,
    garage: {
      type: "marine_port",
      name: "Beach & Marine Port",
      capacity: 3,
      supercarFriendly: false,
      evChargingKw: 22,
      washdownStation: true,
      description: "Dual oversized bays with 3.4m vertical clearance for watercraft trailers, dry gear lockers, and high-pressure deionized rinse lines.",
    },
    isForSale: true,
    salePrice: 195000000,
    landArea: "3.2 Grounds (7,680 sq.ft)",
  },
  {
    id: "adyar-courtyard-villa",
    // In-city villa: plenty of room, but residential noise rules mean no
    // amplified sound late and no outside catering operation on site.
    celebration: {
      maxEventGuests: 60,
      powerLoadKw: 25,
      soundCurfewHour: 22,
      parkingCars: 15,
      generatorKw: 15,
      catererKitchen: false,
    },
    name: "Adyar Courtyard Villa",
    location: "Kasturba Nagar · Adyar, Chennai",
    city: "Chennai",
    setting: "city",
    settingName: "Adyar · Chennai",
    settingDetail: "In a gated city lane · 2 minutes to school",
    rating: 4.86,
    reviews: 63,
    guests: 10,
    bedrooms: 4,
    beds: 5,
    bathrooms: 4,
    price: 12000,
    cleaning: 1500,
    highlights: "4 Bedrooms · City Courtyard · Terrace Pool · 2 min to Adyar",
    searchLine: "In the City · 4 Bedrooms · Terrace Pool · Large Groups",
    amenities: [
      "Private walled courtyard with a plunge pool",
      "Roof terrace with a barbecue deck",
      "Four bedrooms across two floors",
      "Covered parking for two cars",
      "Split AC in every bedroom",
      "Fibre Wi-Fi and a home theatre lounge",
      "Piped gas, induction and a full kitchen",
      "Caretaker and power backup",
    ],
    vibes: ["In the City", "Pool", "Large Groups", "Bonfire"],
    image: "/assets/prop-terracotta-courtyard.jpg",
    alt: "A modern city courtyard villa with a plunge pool and roof terrace in Adyar, Chennai",
    blurb: "A four-bedroom villa on a quiet gated lane in Adyar, ten minutes from IIT and the beach. This is the one you book when the family wants a whole house in the city for a weekend, with a courtyard pool and enough floor to actually talk to each other.",
    type: "City Villa",
    guestFavourite: true,
    group: "nearby",
    isForSale: true,
    salePrice: 95000000,
    landArea: "3,200 sq.ft (2,975 sq.m plot)",
  },
  {
    id: "kodaikanal-cloud-villa",
    name: "Kodaikanal Cloud Villa",
    location: "Pallavasani Hill · Kodaikanal",
    city: "Kodaikanal",
    setting: "hill_station",
    settingName: "Kodaikanal · Palani Hills",
    settingDetail: "6,900 ft elevation · Lake-facing ridge",
    rating: 4.93,
    reviews: 105,
    guests: 8,
    bedrooms: 4,
    beds: 4,
    bathrooms: 4,
    price: 17000,
    cleaning: 2000,
    highlights: "4 Bedrooms · Lake View · Heated Pool · 3-Car Vault",
    searchLine: "Hill Station · 4 Bedrooms · Lake View · Heated Pool",
    amenities: [
      "Lake-facing ridge with a Belur view",
      "Heated pool deck, usable in hill evenings",
      "4 bedrooms, all with valley views",
      "Enclosed 3-car collector garage off the drive",
      "Wood stove and fireplace in the common room",
      "Kitchen garden and a small terrace orchard",
      "Caretaker, cook and daily housekeeping",
      "Doctor on call in town, 20 minutes away",
    ],
    vibes: ["Hill Station", "Pool", "Collector Garage", "Large Groups"],
    image: "/assets/prop-mango-orchard.jpg",
    alt: "A hill villa at Kodaikanal with a heated pool deck facing the lake and distant hills",
    blurb: "Four bedrooms on a ridge above Kodaikanal Lake, a short walk to the shopping stretch and the boat club. Warm in the evenings because of the wood stove, and the drive is steep enough that the estate keeps a proper enclosed garage.",
    type: "Hill Station Villa",
    group: "popular",
    garage: {
      type: "collector_vault",
      name: "Hill Collector Garage",
      capacity: 3,
      supercarFriendly: true,
      evChargingKw: 22,
      washdownStation: false,
      description: "Enclosed concrete garage with a low 7.4° approach built for the ridge gradient, a pressure-washed floor for monsoon grit, and a 22kW charger.",
    },
    isForSale: false,
  },
  {
    id: "mahabs-dune-residence",
    celebration: {
      maxEventGuests: 120,
      powerLoadKw: 45,
      soundCurfewHour: 22,
      parkingCars: 40,
      generatorKw: 30,
      catererKitchen: true,
    },
    name: "Mahabalipuram Shore Sanctuary",
    location: "Historic Coastline · Mahabalipuram",
    city: "Mahabalipuram",
    setting: "seaside",
    settingName: "Mahabalipuram Heritage Shore",
    settingDetail: "210 ft direct beach frontage",
    rating: 4.95,
    reviews: 130,
    guests: 12,
    bedrooms: 5,
    beds: 6,
    bathrooms: 5,
    price: 38000,
    cleaning: 4000,
    highlights: "210 ft Beachfront · 4-Car Climate Vault · EV Fast Charge",
    searchLine: "Direct Beach · 4-Car Vault · EV Fast Charge · Pool",
    amenities: [
      "210 ft private ocean frontage",
      "Subterranean 4-car climate gallery",
      "Supercar ramp (<6°)",
      "Dual 22kW EV chargers",
      "Full salt-spray rinse arch",
      "Ocean-facing pool and jacuzzi",
      "Private chef and caretaker",
      "Wi-Fi & cinema room",
    ],
    vibes: ["Seaside", "Collector Garage", "EV Ready", "Pool", "Large Groups"],
    image: "/assets/prop-guava-house.jpg",
    alt: "Dune grass and stone architecture overlooking the ocean surf at Mahabalipuram",
    blurb: "A grand coastal compound neighboring the Mahabalipuram heritage shoreline, sleeping twelve across five bedrooms. An uncompromised automotive gallery provides continuous positive air filtration to block marine salt crystals.",
    type: "Oceanfront Estate",
    group: "popular",
    beachFrontage: "210 ft direct beach frontage",
    coastalZone: "Direct Oceanfront",
    privateBeachAccess: true,
    tideDistanceMeters: 42,
    garage: {
      type: "collector_vault",
      name: "Subterranean Collector's Vault",
      capacity: 4,
      supercarFriendly: true,
      evChargingKw: 44,
      washdownStation: true,
      description: "HEPA-filtered, dehumidified underground gallery with a 5.9° approach angle and flush pneumatic door seals.",
    },
    isForSale: true,
    salePrice: 340000000,
    landArea: "5.5 Grounds (13,200 sq.ft)",
  },
  {
    id: "muttukadu-cove-haven",
    name: "Muttukadu Cove Beach House",
    location: "Muttukadu Coast · Chennai",
    city: "Chennai",
    setting: "seaside",
    settingName: "Muttukadu Cove · Chennai",
    settingDetail: "135 ft sheltered cove frontage",
    rating: 4.9,
    reviews: 65,
    guests: 8,
    bedrooms: 4,
    beds: 4,
    bathrooms: 4,
    price: 26000,
    cleaning: 2600,
    highlights: "135 ft Beachfront · Marine Slipway · Plunge Pool",
    searchLine: "Direct Beach · Marine Port · Cove View · Pool",
    amenities: [
      "135 ft private beach shoreline",
      "Direct boat and jet ski launch access",
      "Enclosed dual-car garage",
      "Freshwater washdown line",
      "Private swimming pool",
      "Air conditioning throughout",
      "Wi-Fi and satellite tv",
      "Full power backup",
    ],
    vibes: ["Seaside", "Marine Port", "Pool", "Large Groups"],
    image: "/assets/prop-sunset-fields.jpg",
    alt: "Golden hour sunset over private beachfront lawn and ocean pool at Muttukadu",
    blurb: "Tucked inside a sheltered natural cove, offering serene waters and a dedicated marine slipway for personal watercraft, coupled with protected vehicle storage and four bedrooms around one pool.",
    type: "Cove Beachfront Villa",
    group: "nearby",
    beachFrontage: "135 ft sheltered cove frontage",
    coastalZone: "Cove Front",
    privateBeachAccess: true,
    tideDistanceMeters: 32,
    garage: {
      type: "marine_port",
      name: "Beach & Marine Port",
      capacity: 2,
      supercarFriendly: false,
      evChargingKw: 22,
      washdownStation: true,
      description: "Direct-drive trailer turn with marine rinse equipment and sealed electrical sub-panels rated for coastal salt humidity.",
    },
    isForSale: false,
  },
  {
    id: "velachery-lake-view-villa",
    name: "Velachery Lake Terrace",
    location: "Rajiv Gandhi Salai · Velachery, Chennai",
    city: "Chennai",
    setting: "city",
    settingName: "Velachery · Chennai",
    settingDetail: "Lake-facing terrace · Inner city, 6 min to IT corridor",
    rating: 4.82,
    reviews: 47,
    guests: 6,
    bedrooms: 3,
    beds: 3,
    bathrooms: 3,
    price: 9500,
    cleaning: 1200,
    highlights: "3 Bedrooms · Lake Terrace · Compact · Weekly Base",
    searchLine: "In the City · 3 Bedrooms · Lake Terrace · Weekly Base",
    amenities: [
      "Lake-facing terrace over the velachery tank",
      "Three bedrooms on a single floor",
      "Compact plunge pool on the terrace",
      "Covered parking for one car",
      "Split AC and a fully fitted kitchen",
      "Fibre Wi-Fi and work desk",
      "On-site power backup and lift",
      "Caretaker, weekly housekeeping included",
    ],
    vibes: ["In the City", "Pool", "Weekly Base"],
    image: "/assets/prop-lakeview-courtyard.jpg",
    alt: "A compact three-bedroom lake-facing terrace villa in Velachery, Chennai",
    blurb: "Three bedrooms stacked on one floor above a city lake, six minutes from the IT corridor. Small enough for a short weekly base, private enough that a birthday party doesn't need a permit.",
    type: "City Villa",
    group: "popular",
    isForSale: false,
  },
  {
    id: "kanchipuram-mango-grove-retreat",
    celebration: {
      maxEventGuests: 150,
      powerLoadKw: 60,
      soundCurfewHour: 23,
      parkingCars: 60,
      generatorKw: 40,
      catererKitchen: true,
    },
    name: "Kanchipuram Mango Grove Retreat",
    location: "Vallam · Kanchipuram",
    city: "Kanchipuram",
    setting: "countryside",
    settingName: "Vallam · Kanchipuram Countryside",
    settingDetail: "2.6 acres · Sand mango grove, well-road access",
    rating: 4.89,
    reviews: 79,
    guests: 12,
    bedrooms: 5,
    beds: 8,
    bathrooms: 5,
    price: 16000,
    cleaning: 2000,
    highlights: "5 Bedrooms · 2.6 Acres · Mango Grove · Pool & Camp",
    searchLine: "Countryside · 5 Bedrooms · Mango Grove · Large Groups",
    amenities: [
      "2.6 acres of sand mango and coconut grove",
      "Heated swimming pool in a walled garden",
      "Five bedrooms across two cottages",
      "Outdoor camping lawn and fire pit",
      "Bicycles, croquet and a badminton court",
      "Covered parking for four cars",
      "Solar hot water and rainwater harvesting",
      "Caretaker, cook and daily housekeeping",
    ],
    vibes: ["Countryside", "Pool", "Large Groups", "Bonfire"],
    image: "/assets/prop-sunset-fields.jpg",
    alt: "A mango grove retreat with a walled pool, camping lawn and two cottages at Vallam",
    blurb: "Two cottages and a bungalow under a two-acre sand mango grove, forty minutes past Kanchipuram. This is the large-gathering house: twelve people, one pool, a lawn you are allowed to put a tent on, and no neighbours within a kilometre.",
    type: "Countryside Estate",
    guestFavourite: true,
    group: "nearby",
    garage: {
      type: "ev_pavilion",
      name: "Four-Car EV Pavilion",
      capacity: 4,
      supercarFriendly: true,
      evChargingKw: 22,
      washdownStation: false,
      description: "Shaded open-air pavilion for four cars with a 22kW charger, a pressure-washed monsoon floor, and a covered cycle store.",
    },
    isForSale: true,
    salePrice: 70000000,
    landArea: "2.6 Acres (1,12,040 sq.ft)",
  },
  {
    id: "hosur-orchard-farmhouse",
    celebration: {
      maxEventGuests: 100,
      powerLoadKw: 40,
      soundCurfewHour: 23,
      parkingCars: 50,
      generatorKw: 25,
      catererKitchen: true,
    },
    name: "Hosur Orchard Farmhouse",
    location: "Denkanikottai Road · Hosur",
    city: "Hosur",
    setting: "countryside",
    settingName: "Denkanikottai · Hosur Countryside",
    settingDetail: "3.2 acres · Mango and sapota orchards",
    rating: 4.81,
    reviews: 58,
    guests: 10,
    bedrooms: 4,
    beds: 6,
    bathrooms: 4,
    price: 11000,
    cleaning: 1500,
    highlights: "4 Bedrooms · 3.2 Acres · Orchards · Pool & Kitchen Garden",
    searchLine: "Countryside · 4 Bedrooms · Orchards · Pool",
    amenities: [
      "3.2 acres of mango and sapota orchards",
      "Swimming pool with a shaded sit-out deck",
      "Four bedrooms, two of them en-suite",
      "Kitchen garden you can pick from",
      "Outdoor dining under a mango tree",
      "Bonfire pit and open lawns for the kids",
      "Unpowered gravel parking for any number of cars",
      "Caretaker, cook and daily housekeeping",
    ],
    vibes: ["Countryside", "Pool", "Large Groups", "Bonfire"],
    image: "/assets/prop-verde-meadow.jpg",
    alt: "An orchard farmhouse with a swimming pool, lawn and mango trees near Hosur",
    blurb: "A working orchard farmhouse an hour out of Chennai, with four bedrooms, a pool, and a kitchen garden the caretaker plants every season. Cheap on the meter, expensive on the weekends.",
    type: "Countryside Farmhouse",
    group: "popular",
    isForSale: false,
  },
  {
    id: "pondicherry-promenade-house",
    name: "Pondicherry Coastal Teak Estate",
    location: "White Town Coastal Bluff · Pondicherry",
    city: "Pondicherry",
    setting: "seaside",
    settingName: "White Town Bluff · Pondicherry",
    settingDetail: "95 ft coastal boundary",
    rating: 4.93,
    reviews: 96,
    guests: 6,
    bedrooms: 3,
    beds: 3,
    bathrooms: 3,
    price: 21000,
    cleaning: 2000,
    highlights: "95 ft Beachfront · Teak Portico · Sand Trap Pavers",
    searchLine: "Direct Shoreline · Teak Portico · Courtyard",
    amenities: [
      "Direct oceanfront boardwalk",
      "Covered teak louver portico",
      "Natural cross-ventilation bays",
      "Courtyard reflection pool",
      "Air conditioning",
      "High-speed Wi-Fi",
      "Teak sun deck",
      "Private beach gate",
    ],
    vibes: ["Seaside", "Teak Portico", "Pool"],
    image: "/assets/prop-coconut-grove.jpg",
    alt: "Terracotta and teak coastal courtyard opening directly onto the coastal breeze",
    blurb: "Warm French-coastal architecture sitting against the high-tide line. Three bedrooms wrap a teak portico and a small courtyard reflection pool, five minutes from White Town's cafés.",
    type: "Coastal Villa",
    group: "popular",
    beachFrontage: "95 ft coastal boundary",
    coastalZone: "Direct Oceanfront",
    privateBeachAccess: true,
    tideDistanceMeters: 28,
    garage: {
      type: "teak_portico",
      name: "Teak Portico",
      capacity: 2,
      supercarFriendly: false,
      evChargingKw: 11,
      washdownStation: true,
      description: "Aero-ventilated hardwood canopy with sand-trap basalt pavers, shading cars from direct sun while venting ocean humidity.",
    },
    isForSale: true,
    salePrice: 165000000,
    landArea: "2.8 Grounds (6,720 sq.ft)",
  },
];

export const VIBES = [
  "Seaside",
  "Hill Station",
  "In the City",
  "Countryside",
  "Pool",
  "Large Groups",
  "Bonfire",
  "Celebration Ready",
  "Collector Garage",
  "EV Ready",
] as const;

export const FILTERS = [
  "Seaside",
  "Hill Station",
  "In the City",
  "Countryside",
  "Pool",
  "Large Groups",
  "Celebration Ready",
  "Supercar Garage",
  "EV Ready",
  "For Sale",
] as const;

export function getProperty(id: string): Property | undefined {
  return PROPERTIES.find((p) => p.id === id);
}

export function formatInrCrores(value: number): string {
  if (value >= 10000000) {
    const cr = (value / 10000000).toFixed(value % 10000000 === 0 ? 0 : 2);
    return `₹${cr} Cr`;
  }
  if (value >= 100000) {
    const lk = (value / 100000).toFixed(value % 100000 === 0 ? 0 : 1);
    return `₹${lk} Lakh`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
}

/** Resolve a filter/vibe token back to a `Setting`, if it names one. */
function settingForFilter(filter: string): Setting | null {
  const entry = (Object.keys(SETTING_LABEL) as Setting[]).find(
    (key) => SETTING_LABEL[key].toLowerCase() === filter.toLowerCase(),
  );
  return entry ?? null;
}

export function matchesFilter(property: Property, filter: string): boolean {
  const key = filter.toLowerCase();
  const garage = property.garage;

  if (key === "for sale") return Boolean(property.isForSale);

  const setting = settingForFilter(filter);
  if (setting) return property.setting === setting;

  if (key === "supercar garage") {
    return Boolean(garage && (garage.supercarFriendly || garage.type === "collector_vault"));
  }
  if (key === "ev ready") {
    return Boolean(garage && (garage.evChargingKw >= 22 || garage.type === "ev_pavilion"));
  }
  if (key === "collector garage") return garage?.type === "collector_vault";
  if (key === "marine port") return garage?.type === "marine_port";
  if (key === "celebration ready") return Boolean(property.celebration);
  if (key === "large groups") return property.guests >= 8;
  if (key === "pool") return property.amenities.some((a) => /pool/i.test(a));
  if (key === "bonfire") return property.amenities.some((a) => /bonfire|fire pit|campfire/i.test(a));

  const blob = [
    property.name,
    property.location,
    property.city,
    property.type,
    property.settingName,
    property.settingDetail,
    property.highlights,
    property.amenities.join(" "),
    property.vibes.join(" "),
    property.beachFrontage,
    property.coastalZone,
    garage?.name,
    garage?.type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return blob.includes(key);
}
