import {
  PROPERTIES,
  SETTINGS,
  type CoastalZone,
  type GarageType,
  type Property,
  type Setting,
} from "@/lib/properties";

/**
 * Row → `Property` mapping, shared by the browser catalog and the server
 * catalog.
 *
 * This lives outside `lib/catalog.tsx` (a client module) precisely so the
 * server can build the exact same `Property[]` for metadata, JSON-LD and the
 * sitemap. One implementation means the values a crawler sees in the markup
 * are the same values the UI renders — which is what keeps structured data
 * inside Google's "content must be visible on the page" rule.
 *
 * No `"use client"`, no browser imports, no side effects.
 */

export type Row = {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  location: string | null;
  city: string | null;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  price: number;
  cleaning: number;
  amenities: string[] | null;
  vibes: string[] | null;
  image_urls: string[] | null;
  rating: number;
  reviews: number;
  highlights: string | null;
  blurb: string | null;
  alt: string | null;
  guest_favourite: boolean;
  group_name: string | null;
  status: string;
  setting?: string | null;
  setting_name?: string | null;
  setting_detail?: string | null;
  beach_frontage?: string | null;
  coastal_zone?: string | null;
  private_beach_access?: boolean | null;
  tide_distance_meters?: number | null;
  garage_type?: string | null;
  garage_capacity?: number | null;
  supercar_friendly?: boolean | null;
  ev_charging_kw?: number | null;
  washdown_station?: boolean | null;
  is_for_sale?: boolean | null;
  sale_price?: number | null;
  land_area?: string | null;
  blocked_dates?: string[] | null;
  hosts_celebrations?: boolean | null;
  max_event_guests?: number | null;
  power_load_kw?: number | null;
  sound_curfew_hour?: number | null;
  parking_cars?: number | null;
  generator_kw?: number | null;
  caterer_kitchen?: boolean | null;
  /* ── SEO content model columns. Optional; present only once populated. ── */
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  min_stay?: number | null;
  house_rules?: string[] | null;
  pets_allowed?: boolean | null;
  seo_title?: string | null;
  seo_description?: string | null;
  canonical_url?: string | null;
  noindex?: boolean | null;
  verification_status?: string | null;
  verification_type?: string | null;
  verification_date?: string | null;
  verified_by?: string | null;
};

/**
 * A listing as the SEO layer sees it: the base `Property` plus whatever the
 * optional SEO columns supplied. Every extra field is `Partial`, so a listing
 * with no coordinates simply has no `latitude` and `createVacationRentalSchema`
 * declines to emit a node.
 */
export type SeoProperty = Property &
  Partial<{
    latitude: number;
    longitude: number;
    address: string;
    checkInTime: string;
    checkoutTime: string;
    minStay: number;
    houseRules: string[];
    petsAllowed: boolean;
    seoTitle: string;
    seoDescription: string;
    canonical: string;
    noindex: boolean;
    verification: {
      status: "verified" | "unverified";
      type?: string;
      date?: string;
      verifiedBy?: string;
    };
  }>;

export const GARAGE_NAME: Record<string, string> = {
  collector_vault: "Subterranean Collector's Vault",
  marine_port: "Beach & Marine Port",
  ev_pavilion: "Executive EV Pavilion",
  teak_portico: "Teak Portico",
};

/** Coastal defaults only apply to a listing actually tagged as seaside. */
const COASTAL_ZONES = new Set(["Direct Oceanfront", "Dune Edge Sanctuary", "Cove Front"]);

/** A listing is only publishable if the host has actually published it. */
export function isPublished(row: Row): boolean {
  return row.status === "published";
}

export function fromRow(row: Row): SeoProperty {
  const images = row.image_urls ?? [];
  const setting = (SETTINGS as string[]).includes(row.setting || "")
    ? (row.setting as Setting)
    : "seaside";
  const seaside = setting === "seaside";
  const garageType = row.garage_type as GarageType | undefined;

  return {
    id: row.id,
    name: row.name,
    location: row.location || row.city || "",
    city: row.city || "",
    setting,
    settingName: row.setting_name || row.location || row.city || "",
    settingDetail: row.setting_detail || row.highlights || "",
    rating: Number(row.rating) || 0,
    reviews: row.reviews || 0,
    guests: row.guests,
    bedrooms: row.bedrooms,
    beds: row.beds,
    bathrooms: row.bathrooms,
    price: row.price,
    cleaning: row.cleaning,
    highlights: row.highlights || "",
    searchLine: row.highlights || "",
    amenities: row.amenities ?? [],
    vibes: row.vibes ?? [],
    image: images[0] || "/assets/prop-palm-grove.jpg",
    alt: row.alt || row.name,
    blurb: row.blurb || row.description || "",
    type: row.type || "Villa",
    guestFavourite: row.guest_favourite,
    group:
      row.group_name === "featured" || row.group_name === "nearby" || row.group_name === "popular"
        ? row.group_name
        : "popular",
    // A garage spec is optional. Only emit one when the row actually has a
    // type, so a listing without a garage never renders a fabricated spec.
    garage:
      garageType && GARAGE_NAME[garageType]
        ? {
            type: garageType,
            name: GARAGE_NAME[garageType],
            capacity: row.garage_capacity ?? 2,
            supercarFriendly: row.supercar_friendly ?? false,
            evChargingKw: row.ev_charging_kw ?? 0,
            washdownStation: seaside ? row.washdown_station ?? true : false,
            description: seaside
              ? "Dedicated vehicle bay with salt-spray protection."
              : "Dedicated covered vehicle bay for the house.",
          }
        : undefined,
    isForSale: Boolean(row.is_for_sale),
    salePrice: row.sale_price ?? undefined,
    landArea: row.land_area ?? undefined,
    blockedDates: row.blocked_dates ?? undefined,
    // Same rule as the garage: a celebration spec is emitted only when the host
    // actually turned events on and declared a capacity. A half-filled row must
    // never render as an event-ready house.
    celebration:
      row.hosts_celebrations && row.max_event_guests
        ? {
            maxEventGuests: row.max_event_guests,
            powerLoadKw: row.power_load_kw ?? 0,
            soundCurfewHour: row.sound_curfew_hour ?? 23,
            parkingCars: row.parking_cars ?? 0,
            generatorKw: row.generator_kw ?? 0,
            catererKitchen: row.caterer_kitchen ?? false,
          }
        : undefined,
    ...(seaside
      ? {
          beachFrontage: row.beach_frontage || undefined,
          coastalZone: COASTAL_ZONES.has(row.coastal_zone || "")
            ? (row.coastal_zone as CoastalZone)
            : undefined,
          privateBeachAccess: row.private_beach_access ?? true,
          tideDistanceMeters: row.tide_distance_meters ?? 40,
        }
      : {}),

    /* ── SEO model columns. Present only when populated. ───────────────── */
    ...(row.latitude != null ? { latitude: Number(row.latitude) } : {}),
    ...(row.longitude != null ? { longitude: Number(row.longitude) } : {}),
    ...(row.address ? { address: row.address } : {}),
    ...(row.check_in_time ? { checkInTime: row.check_in_time } : {}),
    ...(row.check_out_time ? { checkoutTime: row.check_out_time } : {}),
    ...(row.min_stay != null ? { minStay: Number(row.min_stay) } : {}),
    ...(row.house_rules?.length ? { houseRules: row.house_rules } : {}),
    ...(row.pets_allowed != null ? { petsAllowed: Boolean(row.pets_allowed) } : {}),
    ...(row.seo_title ? { seoTitle: row.seo_title } : {}),
    ...(row.seo_description ? { seoDescription: row.seo_description } : {}),
    ...(row.canonical_url ? { canonical: row.canonical_url } : {}),
    ...(row.noindex != null ? { noindex: Boolean(row.noindex) } : {}),
    ...(row.verification_status
      ? {
          verification: {
            status: row.verification_status === "verified" ? ("verified" as const) : ("unverified" as const),
            ...(row.verification_type ? { type: row.verification_type } : {}),
            ...(row.verification_date ? { date: row.verification_date } : {}),
            ...(row.verified_by ? { verifiedBy: row.verified_by } : {}),
          },
        }
      : {}),
  };
}

/**
 * Combine database rows with the in-repo catalog, in the exact order the
 * browser catalog uses: database rows win, in-repo listings fill the gaps by
 * id. A property that exists in both is published once.
 */
export function mergeCatalog(rows: Row[] | null | undefined, fallback: SeoProperty[] = PROPERTIES as SeoProperty[]): SeoProperty[] {
  const fromDb = (rows ?? []).filter(isPublished).map(fromRow);
  if (!fromDb.length) return fallback;
  const ids = new Set(fromDb.map((item) => item.id));
  return [...fromDb, ...fallback.filter((item) => !ids.has(item.id))];
}

/** Drops drafts so nothing unpublished reaches metadata, links or the sitemap. */
export function publishedOnly(properties: SeoProperty[]): SeoProperty[] {
  return properties.filter((property) => (property as { status?: string }).status !== "draft");
}
