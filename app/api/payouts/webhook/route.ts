import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { serviceSupabase } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const secret = process.env.RAZORPAYX_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Payout webhook unavailable." }, { status: 503 });
  const raw = await request.text();
  if (!await verifyWebhookSignature(raw, request.headers.get("x-razorpay-signature") ?? "", secret)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  let event;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!event?.event?.startsWith("payout.")) return NextResponse.json({ ok: true, ignored: true });
  const payout = event.payload?.payout?.entity;
  if (!payout || typeof payout.reference_id !== "string" || !/^[0-9a-f-]{36}$/i.test(payout.reference_id) || payout.currency !== "INR") {
    return NextResponse.json({ error: "Payout reconciliation required" }, { status: 409 });
  }
  const db = serviceSupabase();
  if (!db) return NextResponse.json({ error: "Payout reconciliation unavailable" }, { status: 503 });
  const existing = await db.from("bhk_payout_requests").select("id").eq("id", payout.reference_id).maybeSingle();
  if (existing.error) return NextResponse.json({ error: "Payout reconciliation unavailable" }, { status: 503 });
  const handler = existing.data ? "bhk_record_payout" : "bhk_record_service_payout";
  const { error } = await db.rpc(handler, { p_id: payout.reference_id, p_gateway: payout.id,
    p_fund: payout.fund_account_id, p_amount: payout.amount, p_status: payout.status });
  if (error) return NextResponse.json({ error: "Payout reconciliation required" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
