import { NextResponse } from "next/server";
import { authenticated, failure, jsonBody, rpc, TransactionError } from "@/lib/server/transactions";
export async function POST(request: Request) {
  try {
    const { user, service } = await authenticated(request);
    const body = await jsonBody(request);
    if (typeof body.bookingCode !== "string") throw new TransactionError("Booking code is required.", 400);
    return NextResponse.json(await rpc(service, "bhk_cancel_booking", { p_user: user.id, p_code: body.bookingCode, p_staff: false }));
  } catch (error) { return failure(error); }
}
