import { NextResponse } from "next/server";
import { authenticated, failure, TransactionError } from "@/lib/server/transactions";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { client } = await authenticated(request);
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new TransactionError("Group unavailable.", 404);
    const { data, error } = await client.rpc("bhk_group_arrival", { p_plan: id });
    if (error) throw new TransactionError("Arrival details require active booked-guest access to a paid reservation.", 403);
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}
