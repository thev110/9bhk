import { NextResponse } from "next/server";
import { authenticated, failure, rpc, TransactionError } from "@/lib/server/transactions";
export async function POST(request: Request) {
  try {
    const { user, service } = await authenticated(request);
    return NextResponse.json(await rpc(service, "bhk_request_payout", { p_host: user.id }));
  } catch (error) { return failure(error); }
}
export async function GET(request: Request) {
  try {
    const { user, service } = await authenticated(request);
    const { data: requests, error } = await service.from("bhk_payout_requests").select("*").eq("host_id", user.id).order("created_at", { ascending: false });
    const { data: bookings, error: bookingError } = await service.from("bhk_bookings").select("id,total,quote,status,payment_status,refund_status,check_out").eq("host_id", user.id);
    if (error || bookingError) throw new TransactionError("Could not load settlement history.", 503);
    const reserved = new Set((requests ?? []).filter(r => r.status !== "rejected").flatMap(r => r.booking_ids as string[]));
    let grossAmount=0, platformFeeAmount=0, netAmount=0, availableAmount=0, lockedAmount=0;
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    for (const b of bookings ?? []) {
      if (b.payment_status !== "paid" || b.refund_status !== "none" || b.status === "cancelled" || !b.quote) continue;
      const fee = Number(b.quote.platformFee ?? 0), net = Number(b.total)-fee-Number(b.quote.tax ?? 0)-Number(b.quote.deposit ?? 0);
      grossAmount += Number(b.total); platformFeeAmount += fee; netAmount += net;
      if (reserved.has(b.id)) continue;
      if (b.status === "completed" && b.check_out <= today) availableAmount += net; else lockedAmount += net;
    }
    return NextResponse.json({ requests, grossAmount, platformFeeAmount, netAmount, availableAmount, lockedAmount });
  } catch (error) { return failure(error); }
}
