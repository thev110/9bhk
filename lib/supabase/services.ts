import { browserSupabase } from "@/lib/supabase/browser";

export type ServiceKind = "cook" | "catering" | "transport" | "decoration";
export type ServiceOffering = { id: string; provider_id: string; kind: ServiceKind; title: string; description: string; city: string; available_from: string; available_until: string; active: boolean };
export type ServiceRequest = { id: string; offering_id: string; booking_id: string; provider_id: string; guest_id: string; host_id: string; starts_on: string; ends_on: string; details: string; status: "requested" | "quoted" | "accepted" | "confirmed" | "completed" | "cancelled"; host_approved: boolean; quote_paise: number | null; quote_terms: string | null; quote_expires_at: string | null; currency: "INR"; payment_status: "pending" | "captured" | "refund_pending" | "refunded"; completion_evidence: string | null };
async function client() {
  const db = browserSupabase();
  if (!db) throw new Error("Optional services are unavailable.");
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new Error("Sign in to manage optional services.");
  return db;
}
async function mutation(name: string, args: Record<string, unknown>) {
  const db = await client();
  const { data, error } = await db.rpc(name, args);
  if (error) {
    if (error.code === "23P01") throw new Error("This provider is already reserved for those dates.");
    throw error;
  }
  return data;
}
export async function registerServiceProvider(name: string): Promise<void> {
  await mutation("bhk_register_service_provider", { p_name: name });
}
export async function reviewServiceProvider(providerId: string, approved: boolean): Promise<void> {
  await mutation("bhk_review_service_provider", { p_provider: providerId, p_approved: approved });
}
export async function addServiceOffering(input: Omit<ServiceOffering, "id" | "provider_id" | "active">): Promise<string> {
  return mutation("bhk_add_service_offering", { p_kind: input.kind, p_title: input.title, p_description: input.description, p_city: input.city, p_from: input.available_from, p_until: input.available_until });
}
export async function setServiceOfferingActive(id: string, active: boolean): Promise<void> {
  await mutation("bhk_set_service_offering_active", { p_offering: id, p_active: active });
}
export async function listServiceOfferings(city: string): Promise<ServiceOffering[]> {
  const db = await client();
  const { data, error } = await db.from("bhk_service_offerings").select("*").eq("city", city).eq("active", true).order("title").limit(100);
  if (error) throw error;
  return data ?? [];
}
export async function listServiceRequests(bookingId?: string): Promise<ServiceRequest[]> {
  const db = await client();
  let query = db.from("bhk_service_requests").select("*").order("created_at", { ascending: false }).limit(100);
  if (bookingId) query = query.eq("booking_id", bookingId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
export async function requestService(offeringId: string, bookingId: string, startsOn: string, endsOn: string, details: string): Promise<string> {
  return mutation("bhk_request_service", { p_offering: offeringId, p_booking: bookingId, p_start: startsOn, p_end: endsOn, p_details: details });
}
export async function approveServiceAtProperty(requestId: string): Promise<void> {
  await mutation("bhk_approve_service_at_property", { p_request: requestId });
}
export async function quoteService(requestId: string, amountPaise: number, terms: string, expiresAt: string): Promise<void> {
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 1) throw new Error("Enter an integer INR amount in paise.");
  await mutation("bhk_quote_service", { p_request: requestId, p_amount: amountPaise, p_terms: terms, p_expires: expiresAt });
}
/** Acceptance reserves capacity only; payment and provider confirmation are separate. */
export async function transitionService(requestId: string, action: "accept" | "confirm" | "complete" | "cancel", note?: string): Promise<void> {
  await mutation("bhk_transition_service", { p_request: requestId, p_action: action, p_note: note ?? null });
}
export async function requestServicePayout(requestId: string): Promise<string> {
  return mutation("bhk_request_service_payout", { p_request: requestId });
}
export async function approveServicePayout(payoutId: string, amountPaise: number, fundAccountId: string, verificationReference: string, mode: "NEFT" | "IMPS" | "RTGS"): Promise<void> {
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 1) throw new Error("Enter the exact accepted quote in paise.");
  await mutation("bhk_approve_service_payout", { p_id: payoutId, p_amount: amountPaise, p_fund: fundAccountId, p_verification: verificationReference, p_mode: mode });
}
