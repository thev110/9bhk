"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { SeoProperty } from "@/lib/catalog-rows";
import { browserSupabase, hasSupabase } from "@/lib/supabase/browser";
import { mergeCatalog, previewCatalog, type Row } from "@/lib/catalog-rows";

type Catalog = {
  properties: SeoProperty[];
  ready: boolean;
  reload: () => void;
};

const Ctx = createContext<Catalog>({
  properties: [],
  ready: false,
  reload: () => {},
});

export function CatalogProvider({ children, initialProperties }: { children: React.ReactNode; initialProperties?: SeoProperty[] }) {
  const [properties, setProperties] = useState<SeoProperty[]>(initialProperties ?? (hasSupabase() ? [] : previewCatalog()));
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    const supabase = browserSupabase();
    if (!supabase) {
      setReady(true);
      return;
    }
    let active = true;
    supabase
      .from("bhk_public_properties")
      .select("*")
      .eq("status", "published")
      .then(({ data, error }) => {
        if (!active) return;
        const rows = (data as Row[] | null) ?? [];
        // `mergeCatalog` is shared with the server catalog, so the listing a
        // crawler sees in metadata and JSON-LD is exactly the listing the UI
        // renders here.
        setProperties(error ? [] : mergeCatalog(rows));
        setReady(true);
      });
    return () => { active = false; };
  }, [tick]);

  return <Ctx.Provider value={{ properties, ready, reload }}>{children}</Ctx.Provider>;
}

export function useCatalog(): Catalog {
  return useContext(Ctx);
}
