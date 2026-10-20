import { requireSupabase } from "@/lib/supabase/browser";
export async function listDepositCases() {
  const { data, error } = await requireSupabase().from("bhk_deposit_cases").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return data ?? [];
}
export async function proposeDepositDeduction(bookingId: string, deductionRupees: number, evidence: string) {
  const { error } = await requireSupabase().rpc("bhk_propose_deposit", { p_booking: bookingId, p_deduction: deductionRupees, p_evidence: evidence });
  if (error) throw error;
}
export async function respondToDeposit(bookingId: string, accept: boolean, response: string) {
  const { error } = await requireSupabase().rpc("bhk_respond_deposit", { p_booking: bookingId, p_accept: accept, p_response: response });
  if (error) throw error;
}
/** Staff decision queues refunds for separate approval/dispatch; it does not report money returned. */
export async function resolveDeposit(bookingId: string, returnRupees: number, reason: string) {
  const { error } = await requireSupabase().rpc("bhk_resolve_deposit", { p_booking: bookingId, p_return: returnRupees, p_reason: reason });
  if (error) throw error;
}
