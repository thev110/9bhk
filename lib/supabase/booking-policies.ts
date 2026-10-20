import { requireSupabase } from "@/lib/supabase/browser";
export async function approveBookingPolicy(propertyId: string, terms: { cancellation: string; deposit: string; settlement: string }) {
  const { data, error } = await requireSupabase().rpc("bhk_approve_property_policy", { p_property: propertyId,
    p_cancellation: terms.cancellation, p_deposit: terms.deposit, p_settlement: terms.settlement });
  if (error) throw error;
  return data as string;
}
export async function publicBookingPolicy(propertyId: string) {
  const { data, error } = await requireSupabase().rpc("bhk_public_property_policy", { p_property: propertyId });
  if (error) throw error;
  return data; // null means no approved policy; never invent customer terms.
}
