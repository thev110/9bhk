import { NextResponse } from "next/server";
import { isCaptureEvent, verifyWebhookSignature } from "@/lib/payments/razorpay";
import { serviceSupabase } from "@/lib/supabase/service";

/**
 * Razorpay webhook — the only place a share becomes genuinely paid.
 *
 * `payment.captured` is the sole event that settles a share. A
 * `payment.failed`, `payment.authorized` or `refund.processed` must never mark
 * a share paid, and an unrecognised event is acknowledged and ignored rather
 * than guessed at.
 */
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "RAZORPAY_WEBHOOK_SECRET is not configured" },
      { status: 503 },
    );
  }

  // The RAW body, before any JSON parsing. A re-serialised body produces a
  // different HMAC and every signature check would fail.
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!(await verifyWebhookSignature(raw, signature, secret))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; notes?: Record<string, string> } } };
  };
  try {
    event = JSON.parse(raw) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isCaptureEvent(event.event ?? "")) {
    return NextResponse.json({ ok: true, ignored: event.event ?? "unknown" });
  }

  const payment = event.payload?.payment?.entity;
  const notes = payment?.notes ?? {};
  const bookingCode = notes.bookingCode;
  const hasSlot = notes.slot !== undefined && notes.slot !== null && notes.slot !== "";
  const slot = Number(notes.slot);

  if (!bookingCode) {
    return NextResponse.json({ ok: true, ignored: "no bookingCode in payment notes" });
  }

  const supabase = serviceSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured" },
      { status: 503 },
    );
  }

  const { data: booking } = await supabase
    .from("bhk_bookings")
    .select("id")
    .eq("code", bookingCode)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ ok: true, ignored: "booking not found" });
  }

  if (hasSlot && Number.isInteger(slot)) {
    // Settle split share
    await supabase
      .from("bhk_split_shares")
      .update({
        paid: true,
        paid_at: new Date().toISOString(),
        payment_ref: payment?.id ?? null,
      })
      .eq("booking_id", booking.id)
      .eq("slot", slot);

    return NextResponse.json({ ok: true, settled: { bookingCode, slot } });
  }

  // Settle full stay booking
  await supabase
    .from("bhk_bookings")
    .update({
      status: "confirmed",
      payment_ref: payment?.id ?? null,
    })
    .eq("id", booking.id);

  return NextResponse.json({ ok: true, settled: { bookingCode, fullStay: true } });
}
