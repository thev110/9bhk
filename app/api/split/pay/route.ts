
import { NextResponse } from "next/server";
import { checkoutOrder, failure, jsonBody, TransactionError } from "@/lib/server/transactions";
import { verifySplitToken } from "@/lib/payments/split-token";
import { serviceSupabase } from "@/lib/supabase/service";
export async function POST(request: Request) {
  try {
    const body = await jsonBody(request);
    const secret = process.env.SPLIT_TOKEN_SECRET;
    const service = serviceSupabase();
    if (!secret || !service) throw new TransactionError("Group payments are unavailable.", 503);
    const payload = typeof body.token === "string" ? await verifySplitToken(body.token, secret) : null;
    if (!payload) throw new TransactionError("This invite is invalid or expired.", 401);
    const { data: booking, error } = await service.from("bhk_bookings").select("id,guest_id,status,hold_expires_at,funding_mode").eq("code", payload.bookingCode).maybeSingle();
    if (error) throw new TransactionError("Could not load the reservation.", 503);
    if (!booking || booking.status !== "awaiting" || booking.funding_mode !== "split" || Date.parse(booking.hold_expires_at) <= Date.now()) throw new TransactionError("This reservation is closed or expired.");
    const { data: share, error: shareError } = await service.from("bhk_split_shares").select("id,amount,member_name,paid").eq("booking_id", booking.id).eq("slot", payload.slot).maybeSingle();
    if (shareError) throw new TransactionError("Could not load this share.", 503);
    if (!share || share.paid || share.amount !== payload.amount || share.member_name !== payload.memberName) throw new TransactionError("This share has changed or is already paid.");
    return NextResponse.json(await checkoutOrder(service, booking.guest_id, "share", booking.id, share.id));
  } catch (error) { return failure(error); }
}
