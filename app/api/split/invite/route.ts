import { NextResponse } from "next/server";
import { userSupabase } from "@/lib/supabase/service";
import { buildSplitPayload, signSplitToken } from "@/lib/payments/split-token";

/**
 * Mint a signed invite link for one guest's share.
 *
 * The signing secret never leaves the server, which is why this cannot be done
 * in the browser. The caller's own access token is used as the bearer so row
 * level security performs the ownership check for us: if the select returns a
 * booking, the caller is the guest or the host on it.
 */

type InviteRequest = {
  bookingCode?: string;
  slot?: number;
  shares?: { name: string; amount: number }[];
};

export async function POST(request: Request) {
  const secret = process.env.SPLIT_TOKEN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "SPLIT_TOKEN_SECRET is not configured" },
      { status: 503 },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const accessToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!accessToken) {
    return NextResponse.json({ error: "Sign in to send an invite" }, { status: 401 });
  }

  const supabase = userSupabase(accessToken);
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  let body: InviteRequest;
  try {
    body = (await request.json()) as InviteRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { bookingCode, slot, shares } = body;
  if (
    !bookingCode ||
    typeof slot !== "number" ||
    !Number.isInteger(slot) ||
    !Array.isArray(shares) ||
    shares.length === 0
  ) {
    return NextResponse.json(
      { error: "bookingCode, slot and shares are required" },
      { status: 400 },
    );
  }

  const { data: booking } = await supabase
    .from("bhk_bookings")
    .select("code, guest_name, property_name, check_in, check_out, total")
    .eq("code", bookingCode)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Integrity check: the shares must reconcile to the booking total. Without
  // it, an organiser could mint an invite for an amount that never adds up to
  // what the group actually owes.
  const sum = shares.reduce((total, share) => total + Math.round(Number(share.amount) || 0), 0);
  if (sum !== booking.total) {
    return NextResponse.json(
      { error: `Shares sum to ${sum} but the booking total is ${booking.total}` },
      { status: 409 },
    );
  }

  const share = shares[slot];
  if (!share) {
    return NextResponse.json({ error: "slot is out of range" }, { status: 400 });
  }

  const payload = buildSplitPayload({
    bookingCode: booking.code,
    slot,
    memberName: share.name,
    amount: Math.round(Number(share.amount) || 0),
    propertyName: booking.property_name,
    organiser: booking.guest_name,
    checkIn: booking.check_in,
    checkOut: booking.check_out,
  });

  const inviteToken = await signSplitToken(payload, secret);
  return NextResponse.json({ url: `/split/${inviteToken}`, expiresAt: payload.exp });
}
