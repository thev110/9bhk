import { createBrowserClient } from "@supabase/ssr";
import { safeNextPath } from "@/lib/account";
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
  if (!supabase) throw new Error("Authentication is not configured. Please contact support.");
  const next = safeNextPath(nextPath);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) throw error;
  return true;
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
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function requireSupabase(): SupabaseClient {
  const client = browserSupabase();
  if (!client) throw new Error("Account services are not configured. Please contact support.");
  return client;
}

export async function accountRequest<T = unknown>(path: string, body: unknown = {}): Promise<T> {
  const token = await accessToken();
  if (!token) throw new Error("Please sign in to continue.");
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The request could not be completed.");
  return result;
}
