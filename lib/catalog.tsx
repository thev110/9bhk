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
    type: row.type || "Farm stay",
    guestFavourite: row.guest_favourite,
    group: row.group_name === "featured" || row.group_name === "nearby" || row.group_name === "popular" ? row.group_name : "popular",
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
