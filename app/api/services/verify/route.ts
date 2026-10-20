import { NextResponse } from "next/server";
import { captureServicePayment } from "@/lib/payments/service-orders";
import { fetchPayment, readRazorpayEnv, verifyWebhookSignature } from "@/lib/payments/razorpay";
import { authenticated, failure, jsonBody, TransactionError } from "@/lib/server/transactions";
export async function POST(request: Request) {
  try {
    const { user, service } = await authenticated(request);
    const body = await jsonBody(request);
    const orderId = body.razorpay_order_id, paymentId = body.razorpay_payment_id, signature = body.razorpay_signature;
    if (typeof orderId !== "string" || !/^order_[A-Za-z0-9]+$/.test(orderId) || typeof paymentId !== "string"
      || !/^pay_[A-Za-z0-9]+$/.test(paymentId) || typeof signature !== "string") throw new TransactionError("Invalid payment details.", 400);
    const env = readRazorpayEnv();
    if (!env) throw new TransactionError("Payment verification unavailable.", 503);
    const { data: intent, error } = await service.from("bhk_service_payment_orders").select("id").eq("gateway_order_id", orderId).eq("user_id", user.id).maybeSingle();
    if (error) throw new TransactionError("Payment order lookup unavailable.", 503);
    if (!intent) throw new TransactionError("Service payment order not found.", 404);
    if (!await verifyWebhookSignature(`${orderId}|${paymentId}`, signature, env.keySecret)) throw new TransactionError("Invalid payment signature.", 400);
    const payment = await fetchPayment(paymentId);
    if (payment.order_id !== orderId || payment.id !== paymentId) throw new TransactionError("Payment does not match the checkout.", 409);
    const result = await captureServicePayment(service, payment, `return:${paymentId}`);
    return NextResponse.json({ ...result, paymentId, orderId });
  } catch (error) { return failure(error); }
}
