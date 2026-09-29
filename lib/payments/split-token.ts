/**
 * Signed invite tokens for Split Pay.
 *
 * The problem: an invited guest is not `guest_id` on the booking, so under RLS
 * they cannot read their own share row. Widening the policy to anonymous reads
 * would make every split publicly enumerable — unacceptable for a product whose
 * selling point is buyer confidentiality.
 *
 * The fix: the share's display data travels *inside* a signed token. The guest
 * page renders from the token with no database access at all, and forging one
 * requires the server secret. Only the actual payment crosses into the database,
 * through the webhook, with the service role.
 *
 * HMAC via Web Crypto rather than `node:crypto`, so this works identically in a
 * route handler and an edge runtime.
 */

export type SplitTokenPayload = {
  /** Booking code, e.g. "9B-41234". Human-readable, and used as the receipt. */
  bookingCode: string;
  /** Index of this share within the booking's split ledger. */
  slot: number;
  memberName: string;
  /** Whole rupees, signed — a tampered amount must fail verification. */
  amount: number;
  propertyName: string;
  organiser: string;
  checkIn: string;
  checkOut: string;
  /** Unix seconds. Kept short, because these links get forwarded. */
  exp: number;
};

/** Invite links expire well before the stay, since they are shareable. */
export const SPLIT_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 14;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const normalised = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalised + "=".repeat((4 - (normalised.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmac(payload: string, secret: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return new Uint8Array(mac);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

export async function signSplitToken(
  payload: SplitTokenPayload,
  secret: string,
): Promise<string> {
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = toBase64Url(await hmac(body, secret));
  return `${body}.${signature}`;
}

/**
 * Verify and decode. Returns null for a bad signature, a malformed token or an
 * expired one — callers should treat every failure as a flat rejection rather
 * than trying to distinguish them.
 */
export async function verifySplitToken(
  token: string,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<SplitTokenPayload | null> {
  if (!token || !secret) return null;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!body || !signature) return null;

  const expected = toBase64Url(await hmac(body, secret));
  if (!timingSafeEqual(expected, signature)) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SplitTokenPayload;
    if (!payload.bookingCode || typeof payload.amount !== "number") return null;
    if (typeof payload.exp !== "number" || payload.exp < nowSeconds) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Build the payload for one share, with the expiry stamped in. */
export function buildSplitPayload(
  input: Omit<SplitTokenPayload, "exp">,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): SplitTokenPayload {
  return { ...input, exp: nowSeconds + SPLIT_TOKEN_TTL_SECONDS };
}
