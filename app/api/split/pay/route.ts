import { NextResponse } from "next/server";
import { createOrder, razorpayConfigured, readRazorpayEnv } from "@/lib/payments/razorpay";
import { verifySplitToken } from "@/lib/payments/split-token";

/**
 * Create a payment order for one guest's share.
 *
 * No authentication: the signed token *is* the authorisation, which is the
 * point — an invited guest has no account here and should not need one to pay
 * their share.
 */
export async function POST(request: Request) {
  const secret = process.env.SPLIT_TOKEN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "SPLIT_TOKEN_SECRET is not configured" },
      { status: 503 },
    );
  }

  let body: { token?: string };
  try {
    body = (await request.json()) as { token?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const payload = await verifySplitToken(body.token, secret);
  if (!payload) {
    return NextResponse.json(
      { error: "This invite link is invalid or has expired" },
      { status: 401 },
    );
  }

  if (!razorpayConfigured()) {
    // Not the guest's fault, and not a 4xx they can fix — the deployment has no
    // gateway keys, so say so plainly instead of pretending to fail a payment.
    return NextResponse.json(
      { configured: false, memberName: payload.memberName, amount: payload.amount },
      { status: 503 },
    );
  }

  const order = await createOrder({
    amountRupees: payload.amount,
    receipt: `${payload.bookingCode}-${payload.slot}`,
    // No split at the share level. The group pays the full stay to the
    // platform, which retains its 8% and settles the host after check-in —
    // that is the payout rule the product already promises.
    commissionRate: 0,
    notes: {
      bookingCode: payload.bookingCode,
      slot: String(payload.slot),
      memberName: payload.memberName,
    },
  });

  const env = readRazorpayEnv();
  return NextResponse.json({
    configured: true,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: env?.keyId ?? "",
    memberName: payload.memberName,
  });
}
