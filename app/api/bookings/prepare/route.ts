import { NextResponse } from "next/server";
import { assertBookableProperty, authenticated, failure, jsonBody, rpc, TransactionError } from "@/lib/server/transactions";
export async function POST(request: Request) {
  try {
    const { user, service } = await authenticated(request);
    const body = await jsonBody(request);
    if (body.occasionRequestId !== undefined) {
      if (typeof body.occasionRequestId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.occasionRequestId)) throw new TransactionError("Choose an approved occasion request.", 400);
      for (const key of ["guestName", "guestEmail", "guestPhone"]) {
        if (typeof body[key] !== "string" || (body[key] as string).length > 320) throw new TransactionError("Invalid guest details.", 400);
      }
      const booking = await rpc(service, "bhk_prepare_occasion_booking", { p_user: user.id,
        p_request: body.occasionRequestId, p_name: body.guestName, p_email: body.guestEmail, p_phone: body.guestPhone });
      return NextResponse.json({ success: true, ...booking });
    }
    if (body.occasion !== undefined || body.eventGuests !== undefined || body.attendees !== undefined) {
      throw new TransactionError("Get host approval for the occasion before booking.", 409);
    }
    for (const key of ["propertyId", "checkIn", "checkOut", "guestName", "guestEmail", "guestPhone"]) {
      if (typeof body[key] !== "string" || (body[key] as string).length > 320) throw new TransactionError("Invalid guest or stay details.", 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.checkIn as string) || !/^\d{4}-\d{2}-\d{2}$/.test(body.checkOut as string) || !Number.isInteger(body.adults) || !Number.isInteger(body.children)) throw new TransactionError("Invalid stay dates or guest counts.", 400);
    await assertBookableProperty(service, body.propertyId as string);
    const booking = await rpc(service, "bhk_prepare_booking", { p_user: user.id, p_property: body.propertyId, p_check_in: body.checkIn, p_check_out: body.checkOut, p_adults: body.adults, p_children: body.children, p_name: body.guestName, p_email: body.guestEmail, p_phone: body.guestPhone });
    return NextResponse.json({ success: true, ...booking });
  } catch (error) { return failure(error); }
}
