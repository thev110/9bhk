import "server-only";
import { createOrder, readRazorpayEnv } from "@/lib/payments/razorpay";
import { matchesCapturedPayment, type CapturedPayment } from "@/lib/payments/settlement";
import { serviceSupabase } from "@/lib/supabase/service";
import { rpc, TransactionError } from "@/lib/server/transactions";

type ServiceClient = NonNullable<ReturnType<typeof serviceSupabase>>;
/** Staff supplies a provider order ID from reconciliation; authoritative GET
 * must match the durable intent receipt and amount before binding it. */
export async function reconcileServiceOrder(db: ServiceClient, intentId: string, gatewayOrderId: string) {
  const env = readRazorpayEnv();
  if (!env || !/^order_[A-Za-z0-9]+$/.test(gatewayOrderId)) throw new TransactionError("Provider order reconciliation unavailable.", 503);
  const { data: intent, error } = await db.from("bhk_service_payment_orders").select("id,amount_paise,currency,gateway_order_id").eq("id", intentId).maybeSingle();
  if (error || !intent) throw new TransactionError("Service intent not found.", 404);
  const response = await fetch(`https://api.razorpay.com/v1/orders/${gatewayOrderId}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${env.keyId}:${env.keySecret}`).toString("base64")}` }, cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new TransactionError("Provider order lookup failed.", 503);
  const order = await response.json();
  if (order.id !== gatewayOrderId || order.receipt !== intent.id || Number(order.amount) !== Number(intent.amount_paise)
    || order.currency !== intent.currency) throw new TransactionError("Provider order does not match the saved intent.", 409);
  await rpc(db, "bhk_bind_service_order", { p_intent: intent.id, p_gateway: order.id });
  return { status: "bound", orderId: order.id, paymentConfirmed: false };
}
export async function createServiceOrder(db: ServiceClient, userId: string, requestId: string) {
  const env = readRazorpayEnv();
  if (!env) throw new TransactionError("Service payments are not configured.", 503);
  const intent = await rpc(db, "bhk_claim_service_order", { p_user: userId, p_request: requestId });
  if (intent.status === "ready") return { keyId: env.keyId, orderId: intent.gateway_order_id, amount: Number(intent.amount_paise), currency: intent.currency };
  try {
    const order = await createOrder({ amountRupees: Number(intent.amount_paise) / 100, receipt: intent.id, commissionRate: 0,
      notes: { serviceIntentId: intent.id } });
    if (Number(order.amount) !== Number(intent.amount_paise) || order.currency !== "INR") throw new Error("Order mismatch");
    await rpc(db, "bhk_bind_service_order", { p_intent: intent.id, p_gateway: order.id });
    return { keyId: env.keyId, orderId: order.id, amount: Number(order.amount), currency: order.currency };
  } catch {
    // An uncertain POST must not automatically create a second chargeable order.
    await db.from("bhk_service_payment_orders").update({ last_error: "Provider creation outcome requires reconciliation; do not create a replacement order." }).eq("id", intent.id).eq("status", "creating");
    throw new TransactionError("Service checkout initialization needs reconciliation. No payment is confirmed.", 503);
  }
}

/** Call only after webhook HMAC or authenticated return verification. Unknown orders are errors. */
export async function captureServicePayment(db: ServiceClient, payment: CapturedPayment, eventId: string) {
  const { data: intent, error } = await db.from("bhk_service_payment_orders").select("amount_paise,currency").eq("gateway_order_id", payment.order_id).maybeSingle();
  if (error || !intent) throw new TransactionError("Service order reconciliation required.", 503);
  if (!matchesCapturedPayment(payment, { orderId: payment.order_id, amount: Number(intent.amount_paise), currency: intent.currency })) {
    throw new TransactionError("Captured service payment does not match its order.", 409);
  }
  return rpc(db, "bhk_capture_service_payment", { p_order: payment.order_id, p_payment: payment.id, p_amount: payment.amount,
    p_currency: payment.currency, p_event: eventId, p_captured_at: new Date(payment.created_at * 1000).toISOString() });
}

export async function dispatchServiceRefund(db: ServiceClient, requestId: string) {
  const env = readRazorpayEnv();
  if (!env || process.env.REFUND_DISPATCH_ENABLED !== "true") throw new TransactionError("Refund dispatch is not enabled.", 503);
  const claim = await rpc(db, "bhk_claim_service_refund", { p_id: requestId });
  if (claim.done) return { status: "processed", refundId: claim.refundId };
  if (!/^pay_[A-Za-z0-9]+$/.test(claim.paymentId) || !Number.isSafeInteger(Number(claim.amountPaise))
    || (claim.gatewayRefundId && !/^rfnd_[A-Za-z0-9]+$/.test(claim.gatewayRefundId))) throw new TransactionError("Service refund requires reconciliation.", 503);
  try {
    const existing = claim.gatewayRefundId;
    const response = await fetch(existing ? `https://api.razorpay.com/v1/refunds/${existing}` : `https://api.razorpay.com/v1/payments/${claim.paymentId}/refund`, {
      method: existing ? "GET" : "POST", cache: "no-store", signal: AbortSignal.timeout(20000),
      headers: { Authorization: `Basic ${Buffer.from(`${env.keyId}:${env.keySecret}`).toString("base64")}`, "Content-Type": "application/json",
        ...(!existing ? { "X-Refund-Idempotency": requestId } : {}) },
      ...(!existing ? { body: JSON.stringify({ amount: Number(claim.amountPaise), speed: "normal", receipt: requestId }) } : {}),
    });
    if (!response.ok) throw new Error("Provider response unavailable");
    const result = await response.json();
    if (result.payment_id !== claim.paymentId || Number(result.amount) !== Number(claim.amountPaise) || typeof result.id !== "string"
      || !["created", "pending", "processed", "failed"].includes(result.status)) throw new Error("Provider response mismatch");
    await rpc(db, "bhk_record_service_refund", { p_id: requestId, p_gateway: result.id, p_payment: result.payment_id, p_amount: result.amount, p_status: result.status });
    return { status: result.status, refundId: result.id };
  } catch {
    await db.from("bhk_service_refund_requests").update({ last_error: "Provider response unknown; retry the same refund after two minutes." }).eq("id", requestId).eq("status", "processing");
    throw new TransactionError("Service refund outcome is not confirmed. Retry this same request after two minutes.", 503);
  }
}

/** Separate RazorpayX provisioning and staff-approved destination are required.
 * The full accepted provider quote is payable; no commission is invented. */
export async function dispatchServicePayout(db: ServiceClient, payoutId: string) {
  const key = process.env.RAZORPAYX_KEY_ID, secret = process.env.RAZORPAYX_KEY_SECRET, source = process.env.RAZORPAYX_ACCOUNT_NUMBER;
  if (!key || !secret || !source || process.env.PAYOUT_DISPATCH_ENABLED !== "true") throw new TransactionError("Service payout dispatch is not configured.", 503);
  const claim = await rpc(db, "bhk_claim_service_payout", { p_id: payoutId, p_source: source });
  if (claim.done) return { status: "paid", payoutId: claim.gatewayId };
  if (!Number.isSafeInteger(Number(claim.amountPaise)) || !/^fa_[A-Za-z0-9]+$/.test(claim.fundAccountId)) throw new TransactionError("Service payout needs reconciliation.", 503);
  if (claim.gatewayId) return { status: "processing", payoutId: claim.gatewayId };
  const response = await fetch("https://api.razorpay.com/v1/payouts", {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(20000),
    headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`, "Content-Type": "application/json", "X-Payout-Idempotency": payoutId },
    body: JSON.stringify({ account_number: source, fund_account_id: claim.fundAccountId, amount: Number(claim.amountPaise),
      currency: "INR", mode: claim.mode, purpose: "payout", queue_if_low_balance: false, reference_id: payoutId }),
  });
  if (!response.ok) throw new TransactionError("Service payout outcome is unknown. Retry this same payout after two minutes.", 503);
  const result = await response.json();
  if (result.currency !== "INR" || result.reference_id !== payoutId) throw new TransactionError("Service payout response needs reconciliation.", 503);
  await rpc(db, "bhk_record_service_payout", { p_id: payoutId, p_gateway: result.id, p_fund: result.fund_account_id, p_amount: result.amount, p_status: result.status });
  return { status: result.status, payoutId: result.id };
}
