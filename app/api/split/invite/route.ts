
import { NextResponse } from "next/server";
import { authenticated, failure, jsonBody, TransactionError } from "@/lib/server/transactions";
import { buildSplitPayload, signSplitToken } from "@/lib/payments/split-token";
export async function POST(request: Request) {
  try {
    const { user, service } = await authenticated(request);
    const secret = process.env.SPLIT_TOKEN_SECRET;
    if (!secret) throw new TransactionError("Group invites are unavailable.", 503);
    const body = await jsonBody(request);
    if (typeof body.bookingCode !== "string" || !Number.isInteger(body.slot)) throw new TransactionError("Invalid share details.", 400);
    const { data: booking, error } = await service.from("bhk_bookings").select("*").eq("code", body.bookingCode).eq("guest_id", user.id).maybeSingle();
    if (error) throw new TransactionError("Could not load the booking.", 503);
    if (!booking || booking.status !== "awaiting" || booking.funding_mode !== "split" || Date.parse(booking.hold_expires_at) <= Date.now()) throw new TransactionError("Only an active group funding hold can send invites.");
    const { data: share, error: shareError } = await service.from("bhk_split_shares").select("*").eq("booking_id", booking.id).eq("slot", body.slot).maybeSingle();
    if (shareError) throw new TransactionError("Could not load the share.", 503);
    if (!share || share.paid) throw new TransactionError("This share is unavailable or already paid.");
    const payload = buildSplitPayload({ bookingCode: booking.code, slot: share.slot, memberName: share.member_name, amount: share.amount, propertyName: booking.property_name, organiser: booking.guest_name, checkIn: booking.check_in, checkOut: booking.check_out });
    payload.exp = Math.floor(Date.parse(booking.hold_expires_at) / 1000);
    return NextResponse.json({ url: `/split/${await signSplitToken(payload, secret)}`, expiresAt: payload.exp });
  } catch (error) { return failure(error); }
}
