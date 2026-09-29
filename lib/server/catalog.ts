import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mergeCatalog, publishedOnly, type Row, type SeoProperty } from "@/lib/catalog-rows";

/**
 * Server-authoritative catalog.
 *
 * The browser catalog in `lib/catalog.tsx` fetches Supabase from a `useEffect`,
 * which means the server has no idea what is published. That is fatal for
 * `generateMetadata`, JSON-LD and the sitemap — all three run on the server and
 * would otherwise only ever see the static seed catalog.
 *
 * This module closes that gap with a single cached read. Three rules keep it
 * safe:
 *
 *  1. **It never fails a build.** Any Supabase problem (no env, no network,
 *     RLS denial, timeout) resolves to the static catalog. SEO surfaces then
 *     degrade to the seed inventory instead of erroring.
 *  2. **It is cached and revalidated**, so a new listing reaches the sitemap
 *     without a redeploy.
 *  3. **It runs the same `fromRow` mapping as the browser**, so the markup and
 *     the UI can never disagree about a listing.
 *
 * TODO(business-data): move `bhk_properties` reads behind a service-role server
 * client once the site needs inventory the anon key cannot see (e.g. draft
 * previews in Search Console).
 */

const REVALIDATE_SECONDS = 3600;

/** Cached Supabase client. Created once per server process. */
let client: SupabaseClient | null | undefined;

function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    client = null;
    return client;
  }
  try {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch {
    client = null;
  }
  return client;
}

/**
 * In-process cache with a hard TTL. `next build` and `next start` are separate
 * processes, so this is intentionally simple rather than a distributed cache.
 */
let cache: { at: number; value: SeoProperty[] } | null = null;

async function fetchRows(): Promise<Row[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("bhk_properties")
      .select("*")
      .eq("status", "published")
      .limit(500);
    if (error) return null;
    return (data as Row[] | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * The published catalog as the server sees it.
 * Falls back to the static catalog whenever the database is unreachable.
 */
export async function getServerCatalog(): Promise<SeoProperty[]> {
  const now = Date.now();
  if (cache && now - cache.at < REVALIDATE_SECONDS * 1000) return cache.value;

  const rows = await fetchRows();
  const value = publishedOnly(mergeCatalog(rows));
  cache = { at: now, value };
  return value;
}

/** Look up a single listing by slug. Returns undefined for unknown slugs. */
export async function getServerProperty(slug: string): Promise<SeoProperty | undefined> {
  const properties = await getServerCatalog();
  return properties.find((property) => property.id === slug);
}

/** Only listings that should be publicly indexable. */
export async function getIndexableProperties(): Promise<SeoProperty[]> {
  const properties = await getServerCatalog();
  return properties.filter((property) => !property.noindex);
}

export type { SeoProperty };
