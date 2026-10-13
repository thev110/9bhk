
import { NextResponse } from "next/server";
import { authenticated, failure, jsonBody, rpc, TransactionError } from "@/lib/server/transactions";
import { fetchPayment, readRazorpayEnv, verifyWebhookSignature } from "@/lib/payments/razorpay";
import { matchesCapturedPayment } from "@/lib/payments/settlement";
export async function POST(request: Request) {
  try {
    const { user, service } = await authenticated(request);
    const body = await jsonBody(request);
    const orderId = body.razorpay_order_id, paymentId = body.razorpay_payment_id, signature = body.razorpay_signature;
    if (typeof orderId !== "string" || typeof paymentId !== "string" || typeof signature !== "string") throw new TransactionError("Missing payment details.", 400);
    const env = readRazorpayEnv();
    if (!env) throw new TransactionError("Payment verification is unavailable.", 503);
    const { data: intent, error } = await service.from("bhk_payment_orders").select("*").eq("gateway_order_id", orderId).eq("user_id", user.id).maybeSingle();
    if (error) throw new TransactionError("Could not read the payment order. Please retry.", 503);
    if (!intent) throw new TransactionError("Payment order not found.", 404);
    if (!(await verifyWebhookSignature(`${orderId}|${paymentId}`, signature, env.keySecret))) throw new TransactionError("Invalid payment signature.", 400);
    const payment = await fetchPayment(paymentId);
    if (!matchesCapturedPayment(payment, { orderId, paymentId, amount: Number(intent.amount_paise), currency: intent.currency })) throw new TransactionError("Payment is not captured yet. Check your trip shortly; do not pay again.");
    const result = await rpc(service, "bhk_capture_payment", { p_order: orderId, p_payment: payment.id, p_amount: payment.amount, p_currency: payment.currency, p_event: `return:${payment.id}`, p_captured_at: new Date(payment.created_at * 1000).toISOString() });
    return NextResponse.json({ ...result, paymentId, orderId });
  } catch (error) { return failure(error); }
}
