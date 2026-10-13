import { NextResponse } from "next/server";
import { authenticated, failure, jsonBody, rpc, TransactionError } from "@/lib/server/transactions";
export async function POST(request: Request) {
  try {
    const { user, service } = await authenticated(request);
    const body = await jsonBody(request);
    for (const key of ["propertyId", "checkIn", "checkOut", "guestName", "guestEmail", "guestPhone"]) {
      if (typeof body[key] !== "string" || (body[key] as string).length > 320) throw new TransactionError("Invalid guest or stay details.", 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.checkIn as string) || !/^\d{4}-\d{2}-\d{2}$/.test(body.checkOut as string) || !Number.isInteger(body.adults) || !Number.isInteger(body.children)) throw new TransactionError("Invalid stay dates or guest counts.", 400);
    const booking = await rpc(service, "bhk_prepare_booking", { p_user: user.id, p_property: body.propertyId, p_check_in: body.checkIn, p_check_out: body.checkOut, p_adults: body.adults, p_children: body.children, p_name: body.guestName, p_email: body.guestEmail, p_phone: body.guestPhone });
    return NextResponse.json({ success: true, ...booking });
  } catch (error) { return failure(error); }
}
