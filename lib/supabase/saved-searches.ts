import { browserSupabase } from "@/lib/supabase/browser";

export type SavedSearchCriteria = {
  name: string;
  city: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  min_bedrooms: number;
  max_total_paise: number;
  required_features: ("pool_fenced" | "step_free_access" | "pet_facilities" | "workspace")[];
  enabled: boolean;
};
export type SavedSearch = SavedSearchCriteria & { id: string; user_id: string; last_checked_at: string | null; created_at: string };

async function authenticatedClient() {
  const db = browserSupabase();
  if (!db) throw new Error("Saved searches are unavailable.");
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new Error("Sign in to save searches.");
  return { db, user: data.user };
}
export async function listSavedSearches(): Promise<SavedSearch[]> {
  const { db } = await authenticatedClient();
  const { data, error } = await db.from("bhk_saved_searches").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function saveSearch(input: SavedSearchCriteria, id?: string): Promise<string> {
  const { db, user } = await authenticatedClient();
  const { name, city, check_in, check_out, adults, children, min_bedrooms, max_total_paise, required_features, enabled } = input;
  const values = { name, city, check_in, check_out, adults, children, min_bedrooms, max_total_paise, required_features, enabled };
  const query = id
    ? db.from("bhk_saved_searches").update(values).eq("id", id)
    : db.from("bhk_saved_searches").insert({ ...values, user_id: user.id });
  const { data, error } = await query.select("id").single();
  if (error) throw error;
  return data.id;
}
export async function deleteSavedSearch(id: string): Promise<void> {
  const { db } = await authenticatedClient();
  const { data, error } = await db.from("bhk_saved_searches").delete().eq("id", id).select("id").single();
  if (error || !data) throw error ?? new Error("Saved search not found.");
}
