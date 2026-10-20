import { NextResponse } from "next/server";
import { reconcileServiceOrder } from "@/lib/payments/service-orders";
import { authenticated, failure, jsonBody, TransactionError } from "@/lib/server/transactions";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { service } = await authenticated(request, true);
    const { id } = await context.params;
    const body = await jsonBody(request);
    if (!/^[0-9a-f-]{36}$/i.test(id) || typeof body.orderId !== "string") throw new TransactionError("Saved intent and provider order are required.", 400);
    return NextResponse.json({ success: true, ...await reconcileServiceOrder(service, id, body.orderId) });
  } catch (error) { return failure(error); }
}
