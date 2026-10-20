
import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { matchesCapturedPayment, type CapturedPayment } from "@/lib/payments/settlement";
import { serviceSupabase } from "@/lib/supabase/service";
import { captureServicePayment } from "@/lib/payments/service-orders";
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Payment webhook is unavailable." }, { status: 503 });
  const raw = await request.text();
  if (!(await verifyWebhookSignature(raw, request.headers.get("x-razorpay-signature") ?? "", secret))) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  let event: { event?: string; payload?: { payment?: { entity?: CapturedPayment }; refund?: { entity?: { id: string; payment_id: string; amount: number; status: string; receipt?: string } } } };
  try { event = JSON.parse(raw); if (!event || typeof event !== "object") throw new Error(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (event.event === "refund.processed" || event.event === "refund.failed" || event.event === "refund.created") {
    const refund = event.payload?.refund?.entity;
    const service = serviceSupabase();
    if (!service) return NextResponse.json({ error: "Reconciliation unavailable" }, { status: 503 });
    if (!refund || !/^rfnd_[A-Za-z0-9]+$/.test(refund.id) || !Number.isSafeInteger(refund.amount)) return NextResponse.json({ error: "Invalid refund event" }, { status: 400 });
    // Match only our durable request receipt or an already bound provider ID.
    let query = service.from("bhk_refund_requests").select("id").eq("gateway_refund_id", refund.id);
    if (refund.receipt && /^[0-9a-f-]{36}$/i.test(refund.receipt)) query = service.from("bhk_refund_requests").select("id").eq("id", refund.receipt);
    const { data: saved, error: lookupError } = await query.maybeSingle();
    if (lookupError) return NextResponse.json({ error: "Refund reconciliation required" }, { status: 503 });
    if (!saved) {
      let serviceQuery = service.from("bhk_service_refund_requests").select("id").eq("gateway_refund_id", refund.id);
      if (refund.receipt && /^[0-9a-f-]{36}$/i.test(refund.receipt)) serviceQuery = service.from("bhk_service_refund_requests").select("id").eq("id", refund.receipt);
      const candidate = await serviceQuery.maybeSingle();
      if (candidate.error || !candidate.data) return NextResponse.json({ error: "Refund reconciliation required" }, { status: 503 });
      const recorded = await service.rpc("bhk_record_service_refund", { p_id: candidate.data.id, p_gateway: refund.id,
        p_payment: refund.payment_id, p_amount: refund.amount, p_status: refund.status });
      if (recorded.error) return NextResponse.json({ error: "Service refund reconciliation required" }, { status: 503 });
      return NextResponse.json({ ok: true });
    }
    const { error: recordError } = await service.rpc("bhk_record_refund", { p_id: saved.id, p_gateway: refund.id,
      p_payment: refund.payment_id, p_amount: refund.amount, p_status: refund.status });
    if (recordError) return NextResponse.json({ error: "Refund reconciliation required" }, { status: 503 });
    return NextResponse.json({ ok: true });
  }
  if (event.event !== "payment.captured") return NextResponse.json({ ok: true, ignored: true });
  const payment = event.payload?.payment?.entity;
  const eventId = request.headers.get("x-razorpay-event-id");
  if (!payment || !eventId) return NextResponse.json({ error: "Missing captured payment or event identifier" }, { status: 400 });
  const service = serviceSupabase();
  if (!service) return NextResponse.json({ error: "Settlement is unavailable" }, { status: 503 });
  const { data: intent, error } = await service.from("bhk_payment_orders").select("amount_paise,currency").eq("gateway_order_id", payment.order_id).maybeSingle();
  if (error) return NextResponse.json({ error: "Order reconciliation required" }, { status: 503 });
  if (!intent) {
    try {
      const captured = await captureServicePayment(service, payment, eventId);
      return NextResponse.json({ ok: true, status: captured.status });
    } catch { return NextResponse.json({ error: "Service order reconciliation required" }, { status: 503 }); }
  }
  if (!matchesCapturedPayment(payment, { orderId: payment.order_id, amount: Number(intent.amount_paise), currency: intent.currency })) return NextResponse.json({ error: "Captured payment does not match stored order" }, { status: 409 });
  const { data, error: settleError } = await service.rpc("bhk_capture_payment", { p_order: payment.order_id, p_payment: payment.id, p_amount: payment.amount, p_currency: payment.currency, p_event: eventId, p_captured_at: new Date(payment.created_at * 1000).toISOString() });
  if (settleError) return NextResponse.json({ error: "Settlement failed; retry required" }, { status: 503 });
  return NextResponse.json({ ok: true, status: data.status });
}
