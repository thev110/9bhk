import { requireSupabase } from "@/lib/supabase/browser";
export type SalesOfferTerms = {
  pricePaise: number;
  financing: "unknown" | "cash_self_reported" | "loan_needed" | "preapproved_self_reported";
  conditions: string;
  proposedCloseDate?: string;
  validUntil: string;
};
function terms(input: SalesOfferTerms) {
  if (!Number.isSafeInteger(input.pricePaise) || input.pricePaise <= 0) throw new Error("Offer price must be positive integer paise.");
  return { p_price: input.pricePaise, p_financing: input.financing, p_conditions: input.conditions, p_close: input.proposedCloseDate ?? null, p_valid_until: input.validUntil };
}
export async function listSalesOffers() {
  const db = requireSupabase();
  const [offers,revisions,events] = await Promise.all([
    db.from("bhk_sales_offers").select("*").order("updated_at",{ascending:false}),
    db.from("bhk_sales_offer_revisions").select("*").order("revision",{ascending:false}),
    db.from("bhk_sales_offer_events").select("*").order("created_at",{ascending:false}),
  ]);
  for (const result of [offers,revisions,events]) if (result.error) throw result.error;
  return { offers: offers.data ?? [], revisions: revisions.data ?? [], events: events.data ?? [] };
}
export async function submitSalesOffer(propertyId: string, input: SalesOfferTerms): Promise<string> {
  const { data,error } = await requireSupabase().rpc("bhk_submit_sales_offer",{p_property:propertyId,...terms(input)});
  if(error) throw error;
  return data as string;
}
export async function reviseSalesOffer(id: string, version: number, input: SalesOfferTerms): Promise<number> {
  const { data,error } = await requireSupabase().rpc("bhk_revise_sales_offer",{p_id:id,p_version:version,...terms(input)});
  if(error) throw error;
  return data as number;
}
/** Acceptance records negotiation intent; it does not execute a purchase or transfer funds. */
export async function decideSalesOffer(id: string, version: number, action: "accepted" | "rejected" | "withdrawn", reason: string): Promise<void> {
  const { error } = await requireSupabase().rpc("bhk_decide_sales_offer",{p_id:id,p_version:version,p_action:action,p_reason:reason});
  if(error) throw error;
}
