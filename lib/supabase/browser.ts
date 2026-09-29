import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function browserSupabase(): SupabaseClient | null {
  if (!hasSupabase()) return null;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  );
}

export async function signInWithGoogle(nextPath = "/"): Promise<boolean> {
  const supabase = browserSupabase();
  if (!supabase) return false;
  const next = nextPath.startsWith("/") ? nextPath : "/";
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  return !error;
}

/**
 * The current session's access token, for calling our own route handlers as the
 * signed-in user. Returning it to the same origin that already holds the
 * session adds no exposure; it must never be logged or sent anywhere else.
 */
export async function accessToken(): Promise<string | null> {
  const supabase = browserSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function signOutSupabase(): Promise<void> {
  const supabase = browserSupabase();
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Supabase signOut error", err);
  }
}

