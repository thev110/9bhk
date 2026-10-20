import "server-only";
import { readRazorpayEnv } from "@/lib/payments/razorpay";
import { serviceSupabase } from "@/lib/supabase/service";

/** Persistent request UUID is also the gateway idempotency key: retries reuse the same amount and key. */
export async function dispatchRefund(requestId: string) {
  const env = readRazorpayEnv();
  const db = serviceSupabase();
  if (!db || !env || process.env.REFUND_DISPATCH_ENABLED !== "true") throw new Error("Refund dispatch is not enabled.");
  const { data: claim, error } = await db.rpc("bhk_claim_refund", { p_id: requestId });
  if (error) throw new Error(error.message);
  if (claim.done) return { status: "processed", refundId: claim.refundId };
  if (!/^pay_[A-Za-z0-9]+$/.test(claim.paymentId) || !Number.isSafeInteger(Number(claim.amountPaise))) throw new Error("Refund requires reconciliation.");
  const existing = claim.gatewayRefundId;
  if (existing && !/^rfnd_[A-Za-z0-9]+$/.test(existing)) throw new Error("Refund requires reconciliation.");
  try {
    const url = existing ? `https://api.razorpay.com/v1/refunds/${existing}` : `https://api.razorpay.com/v1/payments/${claim.paymentId}/refund`;
    const response = await fetch(url, {
      method: existing ? "GET" : "POST", cache: "no-store", signal: AbortSignal.timeout(20000),
      headers: { Authorization: `Basic ${Buffer.from(`${env.keyId}:${env.keySecret}`).toString("base64")}`,
        "Content-Type": "application/json", ...(!existing ? { "X-Refund-Idempotency": requestId } : {}) },
      ...(!existing ? { body: JSON.stringify({ amount: Number(claim.amountPaise), speed: "normal", receipt: requestId }) } : {}),
    });
    if (!response.ok) throw new Error("Provider response requires reconciliation.");
    const result = await response.json();
    if (result.payment_id !== claim.paymentId || Number(result.amount) !== Number(claim.amountPaise)
      || typeof result.id !== "string" || !["created", "pending", "processed", "failed"].includes(result.status)) throw new Error("Provider refund did not match the approved request.");
    const saved = await db.rpc("bhk_record_refund", { p_id: requestId, p_gateway: result.id,
      p_payment: result.payment_id, p_amount: result.amount, p_status: result.status });
    if (saved.error) throw new Error("Provider response needs reconciliation.");
    return { status: result.status, refundId: result.id };
  } catch {
    // A timeout can still mean the provider accepted the refund. Keep processing and the same idempotency key.
    await db.from("bhk_refund_requests").update({ last_error: "Dispatch response unavailable; reconcile or retry with the same request." }).eq("id", requestId).eq("status", "processing");
    throw new Error("Refund outcome is not yet confirmed. Retry this same request after two minutes.");
  }
}
