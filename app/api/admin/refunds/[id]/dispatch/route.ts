import { NextResponse } from "next/server";
import { authenticated, failure, jsonBody, TransactionError } from "@/lib/server/transactions";
import { dispatchRefund } from "@/lib/payments/refunds";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { client } = await authenticated(request, true);
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new TransactionError("Invalid refund request.", 400);
    const body = await jsonBody(request);
    if (body.approve === true) {
      if (!Number.isSafeInteger(body.expectedAmount) || Number(body.expectedAmount) <= 0) throw new TransactionError("Confirm the recorded refund amount in rupees.", 400);
      const { error } = await client.rpc("bhk_approve_refund", { p_id: id, p_expected_amount: body.expectedAmount });
      if (error) throw new TransactionError("Refund approval failed. Check the amount and review status.", 409);
    }
    const result = await dispatchRefund(id);
    return NextResponse.json({ success: true, ...result });
  } catch (error) { return failure(error); }
}
