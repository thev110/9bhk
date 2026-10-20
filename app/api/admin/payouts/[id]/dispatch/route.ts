import { NextResponse } from "next/server";
import { authenticated, failure, jsonBody, TransactionError } from "@/lib/server/transactions";
import { dispatchPayout } from "@/lib/payments/payouts";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { client } = await authenticated(request, true);
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new TransactionError("Invalid payout request.", 400);
    const body = await jsonBody(request);
    if (body.approve === true) {
      if (!Number.isSafeInteger(body.expectedAmount) || typeof body.fundAccountId !== "string" || typeof body.verificationReference !== "string"
        || !["NEFT", "IMPS", "RTGS"].includes(String(body.mode))) throw new TransactionError("Confirm amount, destination verification reference and transfer mode.", 400);
      const { error } = await client.rpc("bhk_approve_payout", { p_id: id, p_amount: body.expectedAmount,
        p_fund: body.fundAccountId, p_verification: body.verificationReference, p_mode: body.mode });
      if (error) throw new TransactionError("Payout approval failed; check the destination and eligibility.", 409);
    }
    return NextResponse.json({ success: true, ...await dispatchPayout(id) });
  } catch (error) { return failure(error); }
}
