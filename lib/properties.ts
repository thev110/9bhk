export type GarageType = "collector_vault" | "marine_port" | "ev_pavilion" | "teak_portico";

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

export type Property = {
  id: string;
  name: string;
  location: string;
  city: string;
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
  beachFrontage: string;
  coastalZone: CoastalZone;
  privateBeachAccess: boolean;
  tideDistanceMeters: number;
  garage: GarageSpec;
  isForSale?: boolean;
  salePrice?: number;
  landArea?: string;
};

export const PROPERTIES: Property[] = [
  {
    id: "bay-breakers-vault",
    name: "The Dunes Oceanfront & Vault",
    location: "ECR · Mahabalipuram Coastal Strip",
    city: "ECR",
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
    vibes: ["Oceanfront", "Collector Garage", "Pool", "Direct Beach"],
    image: "/assets/prop-palm-grove.jpg",
    alt: "Oceanfront infinity pool and curved lawn meeting direct sand at The Dunes Oceanfront",
    blurb: "Positioned directly on the pristine Mahabalipuram dunes with 180 feet of uninterrupted private beach frontage. Features an underground, dehumidified automotive vault engineered specifically for low-clearance supercars.",
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
    id: "neelankarai-marine-pavilion",
    name: "Neelankarai Tide & Marine Port",
    location: "Neelankarai Beach Road · Chennai",
    city: "Chennai",
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
    vibes: ["Oceanfront", "Marine Port", "EV Ready", "Direct Beach"],
    image: "/assets/prop-lakeview-courtyard.jpg",
    alt: "Modern coastal courtyard opening straight onto the beach at Neelankarai Marine Pavilion",
    blurb: "Direct shoreline residence designed for marine enthusiasts. Dual high-clearance bays accommodate trailers and support vehicles, with an integrated deionized water system to strip corrosive coastal mist.",
    type: "Marine Beachfront Villa",
    group: "featured",
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
    id: "kovalam-dune-residence",
    name: "Kovalam Dune & Teak Sanctuary",
    location: "Kovalam Coastline · ECR",
    city: "ECR",
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
    vibes: ["Oceanfront", "Collector Garage", "EV Ready", "Large Groups"],
    image: "/assets/prop-blue-horizon.jpg",
    alt: "Sprawling coastal residence looking directly over the surf at Kovalam Coast",
    blurb: "An expansive coastal compound set across private dunes. An executive EV gallery with solar microgrid buffering ensures zero-emission high-speed charging for fleet vehicles.",
    type: "Oceanfront Estate",
    guestFavourite: true,
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
    id: "pondicherry-promenade-house",
    name: "Pondicherry Coastal Teak Estate",
    location: "White Town Coastal Bluff · Pondicherry",
    city: "Pondicherry",
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
    vibes: ["Oceanfront", "Teak Portico", "Romantic", "Direct Beach"],
    image: "/assets/prop-terracotta-courtyard.jpg",
    alt: "Terracotta and teak coastal courtyard opening directly onto the coastal breeze",
    blurb: "Warm French-coastal architectural residence sitting directly against the high-tide line. Features an open-air Burmese teak portico designed with sand-trap cobblestone paving.",
    type: "Coastal Villa",
    group: "nearby",
    beachFrontage: "95 ft coastal boundary",
    coastalZone: "Direct Oceanfront",
    privateBeachAccess: true,
    tideDistanceMeters: 28,
    garage: {
      type: "teak_portico",
      name: "Coastal Teak Portico",
      capacity: 2,
      supercarFriendly: false,
      evChargingKw: 11,
      washdownStation: true,
      description: "Aero-ventilated hardwood canopy with sand-trap basalt pavers, shading coastal off-roaders from direct sun while venting ocean humidity.",
    },
    isForSale: true,
    salePrice: 165000000,
    landArea: "2.8 Grounds (6,720 sq.ft)",
  },
  {
    id: "ecr-breakers-haven",
    name: "ECR Surfline Glass Villa",
    location: "Akkarai · East Coast Road",
    city: "ECR",
    rating: 4.87,
    reviews: 74,
    guests: 8,
    bedrooms: 4,
    beds: 4,
    bathrooms: 4,
    price: 27000,
    cleaning: 2800,
    highlights: "150 ft Beachfront · 3-Car Supercar Vault · Infinity Pool",
    searchLine: "Direct Ocean · 3-Car Vault · Supercar Ready · Pool",
    amenities: [
      "150 ft direct sandy beachfront",
      "Climate-controlled 3-car vault",
      "Supercar ramp (<6.5°)",
      "Zero-edge ocean swimming pool",
      "Private lawn to dunes",
      "Gourmet kitchen & butler bar",
      "Air conditioning",
      "Sonos sound system",
    ],
    vibes: ["Oceanfront", "Collector Garage", "Pool", "Direct Beach"],
    image: "/assets/prop-coconut-grove.jpg",
    alt: "Coconut palms shading a modern oceanfront terrace right on the Akkarai beach",
    blurb: "Minimalist concrete and glass architecture resting directly on the Akkarai surfline. The enclosed garage offers climate isolation against salt air and a zero-scrape entry angle.",
    type: "Oceanfront Estate",
    group: "nearby",
    beachFrontage: "150 ft direct beach frontage",
    coastalZone: "Direct Oceanfront",
    privateBeachAccess: true,
    tideDistanceMeters: 40,
    garage: {
      type: "collector_vault",
      name: "Subterranean Collector's Vault",
      capacity: 3,
      supercarFriendly: true,
      evChargingKw: 22,
      washdownStation: true,
      description: "Sealed acoustic and thermal envelope, polished epoxy floor, and motorized glass entry shutter with flush threshold plate.",
    },
    isForSale: false,
  },
  {
    id: "muttukadu-cove-haven",
    name: "Muttukadu Cove Beach House",
    location: "Muttukadu Coast · Chennai",
    city: "Chennai",
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
    vibes: ["Oceanfront", "Marine Port", "Pool", "Direct Beach"],
    image: "/assets/prop-sunset-fields.jpg",
    alt: "Golden hour sunset over private beachfront lawn and ocean pool at Muttukadu",
    blurb: "Tucked inside a sheltered natural cove, offering serene waters and a dedicated marine slipway for personal watercraft, coupled with protected vehicle storage.",
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
    isForSale: true,
    salePrice: 210000000,
    landArea: "3.8 Grounds (9,120 sq.ft)",
  },
  {
    id: "mahabs-dune-residence",
    name: "Mahabalipuram Shore Sanctuary",
    location: "Historic Coastline · Mahabalipuram",
    city: "Mahabalipuram",
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
    vibes: ["Oceanfront", "Collector Garage", "EV Ready", "Large Groups"],
    image: "/assets/prop-verde-meadow.jpg",
    alt: "Dune grass and stone architecture overlooking the ocean surf at Mahabalipuram",
    blurb: "A grand coastal compound neighboring the Mahabalipuram heritage shoreline. An uncompromised automotive gallery provides continuous positive air filtration to block marine salt crystals.",
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
    id: "palavakkam-tide-villa",
    name: "Palavakkam Coastal Glass House",
    location: "Beach Promenade · Palavakkam",
    city: "Chennai",
    rating: 4.89,
    reviews: 92,
    guests: 6,
    bedrooms: 3,
    beds: 3,
    bathrooms: 3,
    price: 23000,
    cleaning: 2400,
    highlights: "110 ft Beachfront · Teak Portico · Fast EV",
    searchLine: "Direct Ocean · Teak Portico · EV Ready · Beach Lawn",
    amenities: [
      "110 ft direct beach access",
      "Teak shaded parking pavilion",
      "22kW EV charging post",
      "Direct boardwalk to sand",
      "Air conditioning",
      "Equipped kitchen",
      "Wi-Fi",
      "Pet friendly sandy yard",
    ],
    vibes: ["Oceanfront", "Teak Portico", "EV Ready", "Pet friendly"],
    image: "/assets/prop-guava-house.jpg",
    alt: "Beachfront glass pavilion opening to a private lawn leading down to the surf",
    blurb: "Minutes from the city center yet completely isolated on the Palavakkam sands. Built with teak timber louvers that provide shade and salt-spray defense.",
    type: "Coastal Villa",
    group: "popular",
    beachFrontage: "110 ft private shoreline",
    coastalZone: "Direct Oceanfront",
    privateBeachAccess: true,
    tideDistanceMeters: 36,
    garage: {
      type: "teak_portico",
      name: "Coastal Teak Portico",
      capacity: 2,
      supercarFriendly: false,
      evChargingKw: 22,
      washdownStation: true,
      description: "Hardwood timber pavilion with permeable drainage pavers and automated mist-shield roller blinds.",
    },
    isForSale: false,
  },
  {
    id: "auroville-beach-sanctuary",
    name: "Auroville Dune Pavilion",
    location: "Auroville Beach Coast · Pondicherry",
    city: "Pondicherry",
    rating: 4.92,
    reviews: 104,
    guests: 8,
    bedrooms: 4,
    beds: 4,
    bathrooms: 4,
    price: 25000,
    cleaning: 2600,
    highlights: "165 ft Beachfront · Executive EV Pavilion · Ocean Pool",
    searchLine: "Direct Beach · EV Pavilion · Solar Storage · Pool",
    amenities: [
      "165 ft direct beach dunes",
      "4-car executive EV pavilion",
      "Solar battery backup microgrid",
      "Saltwater pool overlooking surf",
      "Private dune boardwalk",
      "Air conditioning",
      "Wi-Fi",
      "Barbecue & fire pit",
    ],
    vibes: ["Oceanfront", "EV Ready", "Pool", "Direct Beach"],
    image: "/assets/prop-mango-orchard.jpg",
    alt: "Sustainable coastal villa perched directly over golden dunes and breaking waves",
    blurb: "An eco-luxury beachfront residence operating on solar autonomy. Four dedicated vehicle stalls feature intelligent load-balancing chargers powered by the estate's private coastal solar bank.",
    type: "Oceanfront Estate",
    group: "popular",
    beachFrontage: "165 ft coastal dune edge",
    coastalZone: "Dune Edge Sanctuary",
    privateBeachAccess: true,
    tideDistanceMeters: 50,
    garage: {
      type: "ev_pavilion",
      name: "Executive EV Pavilion",
      capacity: 4,
      supercarFriendly: true,
      evChargingKw: 44,
      washdownStation: true,
      description: "Solar-shaded structural canopy with four 22kW smart chargers, automated battery load balancer, and wash bay.",
    },
    isForSale: true,
    salePrice: 225000000,
    landArea: "3.6 Grounds (8,640 sq.ft)",
  },
];

export const VIBES = [
  "Oceanfront",
  "Collector Garage",
  "Marine Port",
  "EV Ready",
  "Teak Portico",
  "Pool",
  "Direct Beach",
  "Large Groups",
] as const;

export const FILTERS = [
  "Oceanfront",
  "Supercar Garage",
  "Marine Port",
  "EV Ready",
  "Pool",
  "Direct Beach",
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

export function matchesFilter(property: Property, filter: string): boolean {
  const blob = `${property.amenities.join(" ")} ${property.vibes.join(" ")} ${property.highlights} ${property.coastalZone} ${property.garage.name} ${property.garage.type} ${property.beachFrontage}`.toLowerCase();
  const key = filter.toLowerCase();

  if (key === "supercar garage") {
    return property.garage.supercarFriendly || property.garage.type === "collector_vault";
  }
  if (key === "marine port") {
    return property.garage.type === "marine_port";
  }
  if (key === "ev ready") {
    return property.garage.evChargingKw >= 22 || property.garage.type === "ev_pavilion";
  }
  if (key === "for sale") {
    return Boolean(property.isForSale);
  }
  if (key === "oceanfront" || key === "direct beach") {
    return property.privateBeachAccess;
  }
  if (key === "pool") {
    return blob.includes("pool");
  }
  return blob.includes(key);
}
