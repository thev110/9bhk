import { NextResponse } from "next/server";
import { authenticated, failure, TransactionError } from "@/lib/server/transactions";
export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { user, service } = await authenticated(request);
    const { code } = await context.params;
    const { data: b, error } = await service.from("bhk_bookings").select("id,code,property_name,guest_name,check_in,check_out,total,quote,payment_status,refund_status,status").eq("code", code).eq("guest_id", user.id).maybeSingle();
    if (error) throw new TransactionError("Could not load the receipt.", 503);
    if (!b) throw new TransactionError("Reservation not found.", 404);
    const { data: payments, error: paymentError } = await service.from("bhk_payment_orders").select("payment_id,amount_paise,currency,captured_at").eq("booking_id", b.id).not("payment_id", "is", null);
    if (paymentError) throw new TransactionError("Could not load captured payments.", 503);
    if (!payments?.length) throw new TransactionError("A receipt is available after a payment is captured.");
    return NextResponse.json({ booking: b, payments }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}
