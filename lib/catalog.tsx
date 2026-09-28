"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { PROPERTIES, type Property } from "@/lib/properties";
import { browserSupabase } from "@/lib/supabase/browser";

type Row = {
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
};

function fromRow(row: Row): Property {
  const images = row.image_urls ?? [];
  return {
    id: row.id,
    name: row.name,
    location: row.location || row.city || "",
    city: row.city || "",
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
    type: row.type || "Oceanfront Estate",
    guestFavourite: row.guest_favourite,
    group: row.group_name === "featured" || row.group_name === "nearby" || row.group_name === "popular" ? row.group_name : "popular",
    beachFrontage: row.beach_frontage || "120 ft direct beachfront",
    coastalZone: (row.coastal_zone as any) || "Direct Oceanfront",
    privateBeachAccess: row.private_beach_access ?? true,
    tideDistanceMeters: row.tide_distance_meters ?? 40,
    garage: {
      type: (row.garage_type as any) || "collector_vault",
      name: row.garage_type === "marine_port" ? "Beach & Marine Port" : row.garage_type === "ev_pavilion" ? "Executive EV Pavilion" : row.garage_type === "teak_portico" ? "Coastal Teak Portico" : "Subterranean Collector's Vault",
      capacity: row.garage_capacity ?? 2,
      supercarFriendly: row.supercar_friendly ?? true,
      evChargingKw: row.ev_charging_kw ?? 22,
      washdownStation: row.washdown_station ?? true,
      description: "Dedicated coastal vehicle bay with salt-spray protection.",
    },
    isForSale: Boolean(row.is_for_sale),
    salePrice: row.sale_price ?? undefined,
    landArea: row.land_area ?? undefined,
  };
}

type Catalog = {
  properties: Property[];
  ready: boolean;
  reload: () => void;
};

const Ctx = createContext<Catalog>({ properties: PROPERTIES, ready: false, reload: () => {} });

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(PROPERTIES);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const supabase = browserSupabase();
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase
      .from("bhk_properties")
      .select("*")
      .eq("status", "published")
      .then(({ data }) => {
        const rows = (data as Row[] | null) ?? [];
        if (rows.length) {
          const fromDb = rows.map(fromRow);
          const ids = new Set(fromDb.map((item) => item.id));
          setProperties([...fromDb, ...PROPERTIES.filter((item) => !ids.has(item.id))]);
        }
        setReady(true);
      });
  }, [tick]);

  return <Ctx.Provider value={{ properties, ready, reload: () => setTick((n) => n + 1) }}>{children}</Ctx.Provider>;
}

export function useCatalog(): Catalog {
  return useContext(Ctx);
}
