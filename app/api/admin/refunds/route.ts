import { NextResponse } from "next/server";
import { authenticated, failure, jsonBody, rpc, TransactionError } from "@/lib/server/transactions";
export async function POST(request: Request) {
  try {
    const { user, service } = await authenticated(request, true);
    const body = await jsonBody(request);
    if (typeof body.bookingCode !== "string") throw new TransactionError("Booking code is required.", 400);
    const result = await rpc(service, "bhk_cancel_booking", { p_user: user.id, p_code: body.bookingCode, p_staff: true });
    return NextResponse.json({ ...result, message: "Cancellation saved. Captured payments are queued for refund review; no refund has been sent yet." });
  } catch (error) { return failure(error); }
}
