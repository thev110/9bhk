
import { NextResponse } from "next/server";
import { authenticated, checkoutOrder, failure, jsonBody, TransactionError } from "@/lib/server/transactions";
export async function POST(request: Request) {
  try {
    const { user, service } = await authenticated(request);
    const body = await jsonBody(request);
    if (body.kind === "subscription") return NextResponse.json(await checkoutOrder(service, user.id, "subscription"));
    if (body.kind !== "booking" || typeof body.bookingId !== "string") throw new TransactionError("Prepare a reservation before starting checkout.", 400);
    return NextResponse.json(await checkoutOrder(service, user.id, "booking", body.bookingId));
  } catch (error) { return failure(error); }
}
