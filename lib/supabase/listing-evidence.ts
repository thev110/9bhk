import { browserSupabase } from "@/lib/supabase/browser";
import { validateListingFact, type ListingFact, type ListingFactInput, type ListingMedia, type ListingOccasion } from "@/lib/listing-evidence";

async function client(authenticated = true) {
  const db = browserSupabase();
  if (!db) throw new Error("Listing services are not configured.");
  if (authenticated) {
    const { data, error } = await db.auth.getUser();
    if (error || !data.user) throw new Error("Sign in to manage listing evidence.");
  }
  return db;
}
export async function loadListingEvidence(propertyId: string, publicListing = true): Promise<{ facts: ListingFact[]; media: ListingMedia[]; occasions: ListingOccasion[] }> {
  const db = await client(!publicListing);
  const prefix = publicListing ? "bhk_public_listing_" : "bhk_listing_";
  const [facts, media, occasions] = await Promise.all(["facts", "media", "occasions"].map(table => db.from(prefix + table).select("*").eq("property_id", propertyId)));
  for (const result of [facts, media, occasions]) if (result.error) throw result.error;
  return { facts: facts.data ?? [], media: media.data ?? [], occasions: occasions.data ?? [] };
}
export async function saveListingFact(input: ListingFactInput): Promise<void> {
  validateListingFact(input);
  const db = await client();
  // Explicit fields avoid passing untrusted review metadata to persistence.
  const { property_id, fact_key, value, source_label, observed_on, media_id } = input;
  const { error } = await db.from("bhk_listing_facts").upsert({ property_id, fact_key, value, source_label, observed_on, media_id }, { onConflict: "property_id,fact_key" });
  if (error) throw error;
}
export async function saveListingMedia(input: Omit<ListingMedia, "id"> & { id?: string }): Promise<string> {
  const db = await client();
  const { id, property_id, kind, url, room_label, caption, width_cm, length_cm } = input;
  const { data, error } = await db.from("bhk_listing_media").upsert({ ...(id ? { id } : {}), property_id, kind, url, room_label, caption, width_cm, length_cm }).select("id").single();
  if (error) throw error;
  return data.id;
}
export async function saveListingOccasion(input: ListingOccasion): Promise<void> {
  const db = await client();
  const { property_id, occasion, permission, conditions } = input;
  const { error } = await db.from("bhk_listing_occasions").upsert({ property_id, occasion, permission, conditions }, { onConflict: "property_id,occasion" });
  if (error) throw error;
}
export async function reviewListingFact(propertyId: string, key: ListingFactInput["fact_key"], decision: "reviewed" | "rejected", scope: string, expiresAt: string | null): Promise<void> {
  const db = await client();
  const { error } = await db.rpc("bhk_review_listing_fact", { target_property: propertyId, target_key: key, decision, scope, valid_until: expiresAt });
  if (error) throw error;
}
export async function listEvidenceReviewQueue(): Promise<ListingFact[]> {
  const db = await client();
  const { data, error } = await db.from("bhk_listing_facts").select("*").eq("review_status", "supplied").order("observed_on").limit(100);
  if (error) throw error;
  return data ?? [];
}
