import { NextResponse } from "next/server";
import { createServiceOrder } from "@/lib/payments/service-orders";
import { authenticated, failure, TransactionError } from "@/lib/server/transactions";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, service } = await authenticated(request);
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new TransactionError("Invalid service request.", 400);
    return NextResponse.json({ success: true, ...await createServiceOrder(service, user.id, id) });
  } catch (error) { return failure(error); }
}
