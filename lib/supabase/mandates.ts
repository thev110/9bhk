import { requireSupabase } from "@/lib/supabase/browser";
export type MandateCapability = "marketing" | "viewings" | "documents" | "offers" | "edit-proposal";
export async function listPropertyMandates() {
  const { data, error } = await requireSupabase().from("bhk_property_mandates").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function requestPropertyMandate(propertyId: string, capabilities: MandateCapability[], startsAt: string, expiresAt: string): Promise<string> {
  const { data, error } = await requireSupabase().rpc("bhk_request_mandate", { p_property: propertyId, p_capabilities: capabilities, p_start: startsAt, p_expiry: expiresAt });
  if (error) throw error;
  return data as string;
}
export async function decidePropertyMandate(id: string, approve: boolean): Promise<void> {
  const { error } = await requireSupabase().rpc("bhk_decide_mandate", { p_id: id, p_approve: approve });
  if (error) throw error;
}
export async function revokePropertyMandate(id: string): Promise<void> {
  const { error } = await requireSupabase().rpc("bhk_revoke_mandate", { p_id: id });
  if (error) throw error;
}
/** UI hint only. Protected mutations must check capability again on the server. */
export async function hasPropertyCapability(propertyId: string, capability: MandateCapability): Promise<boolean> {
  const { data, error } = await requireSupabase().rpc("bhk_my_property_capability", { p_property: propertyId, p_capability: capability });
  if (error) throw error;
  return data === true;
}
