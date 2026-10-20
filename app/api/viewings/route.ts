import { NextResponse } from "next/server";
import { authenticated, failure, jsonBody, TransactionError } from "@/lib/server/transactions";
import { viewingInput } from "@/lib/viewings";

export async function POST(request: Request) {
  try {
    const { user, client } = await authenticated(request);
    const body = await jsonBody(request);
    let input;
    try { input = viewingInput(body); }
    catch (error) { throw new TransactionError(error instanceof Error ? error.message : "Invalid enquiry.", 400); }
    const { data, error } = await client.rpc("bhk_request_viewing", {
      p_property: input.propertyId, p_name: input.buyerName, p_phone: input.buyerPhone,
      p_email: input.buyerEmail, p_notes: input.notes,
    });
    if (error) throw new TransactionError(error.code === "P0001" ? error.message : "Could not save your enquiry. Please retry.", error.code === "P0001" ? 409 : 503);
    return NextResponse.json({ success: true, id: data, userId: user.id }, { status: 201 });
  } catch (error) { return failure(error); }
}
