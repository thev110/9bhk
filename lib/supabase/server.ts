import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * A Supabase client bound to the request's cookies, for server components and
 * route handlers.
 *
 * Route handlers persist refreshed cookies. Middleware handles refreshes for
 * server components, where Next does not allow writing response cookies.
 *
 * Returns null when Supabase is not configured, so callers decide what an
 * unconfigured deployment means for them rather than crashing.
 */
export async function serverSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(values) {
        try { values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* Middleware refreshes cookies for server components. */ }
      },
    },
  });
}

/**
 * The signed-in user's email, verified by the auth provider, or null.
 *
 * Comes from the session rather than from `bhk_profiles`, because a profile row
 * is writable by its owner — its email column is a claim, not a fact. An
 * authorization check must read the fact.
 */
export async function serverUserEmail(): Promise<string | null> {
  const supabase = await serverSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}
