import { toPaise } from "@/lib/split";

/**
 * Razorpay integration points.
 *
 * Status: the account is applied for, keys are not in the environment yet.
 * These helpers are written so that nothing throws at import time — call
 * `razorpayConfigured()` and branch, rather than catching a crash.
 *
 * Runtime notes:
 * - `readRazorpayEnv` and `createOrder` touch the secret key, so they must only
 *   ever run on the server (a route handler or server action). Never import
 *   them into a client component.
 * - `verifyWebhookSignature` uses Web Crypto rather than `node:crypto` so the
 *   same implementation works in a Next.js route handler and in an edge
 *   runtime, with no bundler conditionals.
 */

const RAZORPAY_API = "https://api.razorpay.com/v1";

export type RazorpayEnv = { keyId: string; keySecret: string };

export function readRazorpayEnv(): RazorpayEnv | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

export function razorpayConfigured(): boolean {
  return readRazorpayEnv() !== null;
}

export type OrderSplit = {
  /** What the guest pays. */
  amountPaise: number;
  /** The platform's commission, retained. */
  platformFeePaise: number;
  /** What the host receives via Route. */
  hostAmountPaise: number;
};

/**
 * Split a total into the platform's cut and the host's, in paise.
 *
 * The commission is rounded once and subtracted, so the two halves always
 * reconcile to the guest's total — a marketplace that loses a rupee per
 * booking to rounding cannot explain its own ledger.
 */
export function splitOrder(amountRupees: number, commissionRate: number): OrderSplit {
  const amountPaise = toPaise(amountRupees);
  const platformFeePaise = Math.round(amountPaise * commissionRate);
  return {
    amountPaise,
    platformFeePaise,
    hostAmountPaise: amountPaise - platformFeePaise,
  };
}

export type OrderRequest = {
  amountRupees: number;
  /** Idempotency-friendly reference. Use the booking code. */
  receipt: string;
  /** Defaults to the 8% platform fee the product already advertises. */
  commissionRate?: number;
  /** Razorpay Route linked account for the host, if they are onboarded yet. */
  hostAccountId?: string;
  notes?: Record<string, string>;
};

export type OrderPayload = {
  amount: number;
  currency: "INR";
  receipt: string;
  notes?: Record<string, string>;
  transfers?: { account: string; amount: number; currency: "INR"; notes?: Record<string, string> }[];
};

/**
 * Build the order body. Split out from `createOrder` so it can be unit tested
 * and reviewed without a network call or a live key.
 */
export function buildOrderPayload(request: OrderRequest): OrderPayload {
  const { amountPaise, hostAmountPaise } = splitOrder(
    request.amountRupees,
    request.commissionRate ?? 0.08,
  );
  const payload: OrderPayload = {
    amount: amountPaise,
    currency: "INR",
    receipt: request.receipt,
  };
  if (request.notes) payload.notes = request.notes;

  // Without a Route account the funds settle to the platform and the host is
  // paid out separately. That is the fallback, not the target: settling
  // directly to the host is what makes the 8% structurally collectable.
  if (request.hostAccountId) {
    payload.transfers = [
      {
        account: request.hostAccountId,
        amount: hostAmountPaise,
        currency: "INR",
        ...(request.notes ? { notes: request.notes } : {}),
      },
    ];
  }
  return payload;
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: string;
};

export async function createOrder(request: OrderRequest): Promise<RazorpayOrder> {
  const env = readRazorpayEnv();
  if (!env) {
    throw new Error(
      "Razorpay is not configured: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET before creating orders",
    );
  }

  const response = await fetch(`${RAZORPAY_API}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(`${env.keyId}:${env.keySecret}`)}`,
    },
    body: JSON.stringify(buildOrderPayload(request)),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Razorpay order failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as RazorpayOrder;
}

/** Constant-time-ish comparison, so signature verification does not leak length. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

/**
 * Verify a webhook came from Razorpay.
 *
 * Call this with the **raw** request body, before parsing it as JSON — a
 * re-serialised body produces a different HMAC and will always fail.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  if (!rawBody || !signature || !secret) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expected = [...new Uint8Array(mac)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(expected, signature);
}

/**
 * The only webhook event that may move a booking to `confirmed`. Everything
 * else is informational — a `payment.failed` must never release a stay.
 */
export function isCaptureEvent(event: string): boolean {
  return event === "payment.captured" || event === "order.paid";
}
