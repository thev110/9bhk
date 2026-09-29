"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { SeoProperty } from "@/lib/catalog-rows";
import { PROPERTIES } from "@/lib/properties";
import { browserSupabase } from "@/lib/supabase/browser";
import { mergeCatalog, type Row } from "@/lib/catalog-rows";

type Catalog = {
  properties: SeoProperty[];
  ready: boolean;
  reload: () => void;
};

const Ctx = createContext<Catalog>({
  properties: PROPERTIES as SeoProperty[],
  ready: false,
  reload: () => {},
});

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = useState<SeoProperty[]>(PROPERTIES as SeoProperty[]);
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
        // `mergeCatalog` is shared with the server catalog, so the listing a
        // crawler sees in metadata and JSON-LD is exactly the listing the UI
        // renders here.
        if (rows.length) setProperties(mergeCatalog(rows));
        setReady(true);
      });
  }, [tick]);

  return <Ctx.Provider value={{ properties, ready, reload: () => setTick((n) => n + 1) }}>{children}</Ctx.Provider>;
}

export function useCatalog(): Catalog {
  return useContext(Ctx);
}
