import { NextResponse } from "next/server";
import { authenticated, failure, rpc } from "@/lib/server/transactions";
export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { user, service } = await authenticated(request);
    const { code } = await context.params;
    return NextResponse.json(await rpc(service, "bhk_cancel_booking", { p_user: user.id, p_code: code, p_staff: false }));
  } catch (error) { return failure(error); }
}
