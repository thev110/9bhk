import { browserSupabase } from "@/lib/supabase/browser";
export type ComparableInput = { propertyId: string; priceKind: "asking" | "completed_sale"; amountPaise: number; sourceLabel: string; sourceUrl: string; observedOn: string; locationLabel: string; area: number; areaUnit: "sq_ft" | "sq_m" | "acre" | "cent"; evidenceReference: string; notes: string };
export type PriceContext = { comparables: Record<string, unknown>[]; currentAskingListings: Record<string, unknown>[]; isAppraisal: false; interpretation: string };
async function invoke(name: string, args: Record<string, unknown>) {
  const db = browserSupabase();
  if (!db) throw new Error("Price context is unavailable.");
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user) throw new Error("Sign in to view price context.");
  const { data, error } = await db.rpc(name, args);
  if (error) throw error;
  return data;
}
export async function savePriceComparable(input: ComparableInput, id?: string): Promise<string> {
  if (!Number.isSafeInteger(input.amountPaise) || input.amountPaise < 1 || !Number.isFinite(input.area) || input.area <= 0) throw new Error("Enter a valid price in paise and measured area.");
  return invoke("bhk_save_price_comparable", { p_id: id ?? null, p_property: input.propertyId, p_kind: input.priceKind, p_amount: input.amountPaise,
    p_source: input.sourceLabel, p_url: input.sourceUrl, p_observed: input.observedOn, p_location: input.locationLabel, p_area: input.area,
    p_unit: input.areaUnit, p_evidence: input.evidenceReference, p_notes: input.notes });
}
export async function reviewPriceComparable(id: string, decision: "reviewed" | "rejected", scope: string, expiresAt: string | null): Promise<void> {
  await invoke("bhk_review_price_comparable", { p_id: id, p_decision: decision, p_scope: scope, p_expiry: expiresAt });
}
export async function readPriceContext(propertyId: string): Promise<PriceContext> {
  return invoke("bhk_read_price_context", { p_property: propertyId });
}
