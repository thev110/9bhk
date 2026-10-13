import { NextResponse } from "next/server";
import { authenticated, failure, jsonBody, rpc, TransactionError } from "@/lib/server/transactions";
export async function POST(request: Request) {
  try {
    const { user, service } = await authenticated(request);
    const body = await jsonBody(request);
    if (typeof body.bookingCode !== "string" || !Array.isArray(body.members) || body.members.some(m => typeof m !== "string")) throw new TransactionError("Supply a booking and member names.", 400);
    return NextResponse.json({ success: true, shares: await rpc(service, "bhk_create_split", { p_user: user.id, p_code: body.bookingCode, p_members: body.members }) });
  } catch (error) { return failure(error); }
}
