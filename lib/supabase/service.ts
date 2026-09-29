import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. **SERVER ONLY.**
 *
 * The service role bypasses every row-level security policy. Importing this
 * into a client component would ship the key to the browser and hand out the
 * entire database, so it deliberately reads a non-public env var and returns
 * `null` rather than throwing when it is absent.
 *
 * It exists for one job: settling a Split Pay share from the Razorpay webhook.
 * A webhook arrives with no signed-in user, so there is no identity to enforce
 * RLS against — the HMAC signature check is the authorisation.
 *
 * Everything a signed-in user can do should go through the RLS-scoped clients
 * in `lib/supabase/browser.ts` instead.
 */
export function serviceSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * A Supabase client acting as a specific signed-in user, using their access
 * token as the bearer. RLS applies exactly as it would in the browser, which is
 * what makes it safe to use for ownership checks in route handlers.
 */
export function userSupabase(accessToken: string): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon || !accessToken) return null;
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
