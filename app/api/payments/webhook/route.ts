
import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { matchesCapturedPayment, type CapturedPayment } from "@/lib/payments/settlement";
import { serviceSupabase } from "@/lib/supabase/service";
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Payment webhook is unavailable." }, { status: 503 });
  const raw = await request.text();
  if (!(await verifyWebhookSignature(raw, request.headers.get("x-razorpay-signature") ?? "", secret))) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  let event: { event?: string; payload?: { payment?: { entity?: CapturedPayment } } };
  try { event = JSON.parse(raw); if (!event || typeof event !== "object") throw new Error(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (event.event !== "payment.captured") return NextResponse.json({ ok: true, ignored: true });
  const payment = event.payload?.payment?.entity;
  const eventId = request.headers.get("x-razorpay-event-id");
  if (!payment || !eventId) return NextResponse.json({ error: "Missing captured payment or event identifier" }, { status: 400 });
  const service = serviceSupabase();
  if (!service) return NextResponse.json({ error: "Settlement is unavailable" }, { status: 503 });
  const { data: intent, error } = await service.from("bhk_payment_orders").select("amount_paise,currency").eq("gateway_order_id", payment.order_id).maybeSingle();
  if (error || !intent) return NextResponse.json({ error: "Order reconciliation required" }, { status: 503 });
  if (!matchesCapturedPayment(payment, { orderId: payment.order_id, amount: Number(intent.amount_paise), currency: intent.currency })) return NextResponse.json({ error: "Captured payment does not match stored order" }, { status: 409 });
  const { data, error: settleError } = await service.rpc("bhk_capture_payment", { p_order: payment.order_id, p_payment: payment.id, p_amount: payment.amount, p_currency: payment.currency, p_event: eventId, p_captured_at: new Date(payment.created_at * 1000).toISOString() });
  if (settleError) return NextResponse.json({ error: "Settlement failed; retry required" }, { status: 503 });
  return NextResponse.json({ ok: true, status: data.status });
}
