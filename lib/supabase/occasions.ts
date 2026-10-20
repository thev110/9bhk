import { browserSupabase } from "@/lib/supabase/browser";
export type Occasion = "family_stay" | "celebration" | "wedding" | "shoot" | "corporate_retreat" | "external_services";
export type OccasionRequest = { id: string; property_id: string; guest_id: string; host_id: string; occasion: Occasion; check_in: string; check_out: string; adults: number; children: number; attendees: number; details: string; status: "requested" | "approved" | "rejected" | "revoked" | "booked"; host_conditions: string | null; expires_at: string | null; booking_id: string | null };
async function client() {
  const db = browserSupabase();
  if (!db) throw new Error("Occasion requests are unavailable.");
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new Error("Sign in to manage occasion requests.");
  return db;
}
export async function requestOccasion(input: { propertyId: string; occasion: Occasion; checkIn: string; checkOut: string; adults: number; children: number; attendees: number; details: string }): Promise<string> {
  const db = await client();
  const { data, error } = await db.rpc("bhk_request_occasion", { p_property: input.propertyId, p_occasion: input.occasion, p_in: input.checkIn, p_out: input.checkOut, p_adults: input.adults, p_children: input.children, p_attendees: input.attendees, p_details: input.details });
  if (error) throw error;
  return data;
}
export async function listOccasionRequests(): Promise<OccasionRequest[]> {
  const db = await client();
  const { data, error } = await db.from("bhk_occasion_requests").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return data ?? [];
}
export async function decideOccasion(id: string, approve: boolean, conditions: string): Promise<void> {
  const db = await client();
  const { error } = await db.rpc("bhk_decide_occasion", { p_request: id, p_approve: approve, p_conditions: conditions });
  if (error) throw error;
}
export async function revokeOccasion(id: string): Promise<void> {
  const db = await client();
  const { error } = await db.rpc("bhk_revoke_occasion", { p_request: id });
  if (error) throw error;
}
