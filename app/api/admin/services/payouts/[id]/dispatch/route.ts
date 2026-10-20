import { NextResponse } from "next/server";
import { dispatchServicePayout } from "@/lib/payments/service-orders";
import { authenticated, failure, TransactionError } from "@/lib/server/transactions";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { service } = await authenticated(request, true);
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new TransactionError("Invalid service payout.", 400);
    return NextResponse.json({ success: true, ...await dispatchServicePayout(service, id) });
  } catch (error) { return failure(error); }
}
