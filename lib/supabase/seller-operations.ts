import { requireSupabase } from "@/lib/supabase/browser";
export async function sellerDashboard() {
  const { data, error } = await requireSupabase().rpc("bhk_seller_dashboard");
  if (error) throw error;
  return data;
}
/** The workflow refuses unresolved stays/viewings/offers; it never silently cancels a guest booking. */
export async function changeSaleLifecycle(propertyId: string, state: "active" | "withdrawn" | "sold", reason: string) {
  const { error } = await requireSupabase().rpc("bhk_set_sale_lifecycle", { p_property: propertyId, p_state: state, p_reason: reason });
  if (error) throw error;
}
