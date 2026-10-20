import "server-only";
import { serviceSupabase } from "@/lib/supabase/service";

/** RazorpayX is a separately provisioned account; no stay checkout keys or bank destinations are assumed. */
export async function dispatchPayout(requestId: string) {
  const db = serviceSupabase();
  const key = process.env.RAZORPAYX_KEY_ID, secret = process.env.RAZORPAYX_KEY_SECRET, source = process.env.RAZORPAYX_ACCOUNT_NUMBER;
  if (!db || !key || !secret || !source || process.env.PAYOUT_DISPATCH_ENABLED !== "true") throw new Error("Payout dispatch is not configured.");
  const { data: claim, error } = await db.rpc("bhk_claim_payout", { p_id: requestId, p_source: source });
  if (error) throw new Error(error.message);
  if (claim.done) return { status: "paid", payoutId: claim.gatewayId };
  if (!Number.isSafeInteger(Number(claim.amountPaise)) || !/^fa_[A-Za-z0-9]+$/.test(claim.fundAccountId)) throw new Error("Payout needs reconciliation.");
  if (claim.gatewayId) return { status: "processing", payoutId: claim.gatewayId }; // Status arrives through signed webhooks.
  const response = await fetch("https://api.razorpay.com/v1/payouts", {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(20000),
    headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
      "Content-Type": "application/json", "X-Payout-Idempotency": requestId },
    body: JSON.stringify({ account_number: source, fund_account_id: claim.fundAccountId,
      amount: Number(claim.amountPaise), currency: "INR", mode: claim.mode, purpose: "payout",
      queue_if_low_balance: false, reference_id: requestId }),
  });
  if (!response.ok) throw new Error("Payout outcome requires reconciliation. Reuse this request for retries.");
  const result = await response.json();
  if (result.currency !== "INR" || result.reference_id !== requestId) throw new Error("Payout response mismatch.");
  const { error: saveError } = await db.rpc("bhk_record_payout", {
    p_id: requestId, p_gateway: result.id, p_fund: result.fund_account_id, p_amount: result.amount, p_status: result.status,
  });
  if (saveError) throw new Error("Payout response requires reconciliation.");
  return { status: result.status, payoutId: result.id };
}
