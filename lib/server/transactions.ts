import "server-only";
import { NextResponse } from "next/server";
import { serviceSupabase, userSupabase } from "@/lib/supabase/service";
import { isAdminEmail } from "@/lib/admin";
import { createOrder, readRazorpayEnv } from "@/lib/payments/razorpay";

export class TransactionError extends Error {
  constructor(message: string, public status = 409) { super(message); }
}
export async function authenticated(request: Request, staff = false) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new TransactionError("Please sign in to continue.", 401);
  const client = userSupabase(token);
  if (!client) throw new TransactionError("Account services are unavailable.", 503);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new TransactionError("Your session has expired. Please sign in again.", 401);
  if (staff && (!data.user.email_confirmed_at || !isAdminEmail(data.user.email))) throw new TransactionError("Staff access is required.", 403);
  const service = serviceSupabase();
  if (!service) throw new TransactionError("Reservation services are unavailable.", 503);
  return { user: data.user, client, service };
}
export async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch { throw new TransactionError("Invalid request body.", 400); }
}
export async function rpc(service: NonNullable<ReturnType<typeof serviceSupabase>>, name: string, args: Record<string, unknown>) {
  const { data, error } = await service.rpc(name, args);
  if (error) {
    if (error.code === "P0001") throw new TransactionError(error.message);
    if (error.code === "23P01") throw new TransactionError("These dates were just reserved. Choose another stay.");
    if (error.code?.startsWith("22")) throw new TransactionError("Invalid reservation details.", 400);
    throw new TransactionError("The reservation service could not save this request. Please retry.", 503);
  }
  return data;
}
export function failure(error: unknown) {
  return NextResponse.json({ success: false, error: error instanceof TransactionError ? error.message : "The service is temporarily unavailable. Please retry." }, { status: error instanceof TransactionError ? error.status : 503 });
}
export async function checkoutOrder(service: NonNullable<ReturnType<typeof serviceSupabase>>, userId: string, kind: "booking" | "share" | "subscription", bookingId?: string, shareId?: string) {
  const env = readRazorpayEnv();
  if (!env) throw new TransactionError("Payment checkout is not configured. No payment has been taken.", 503);
  const intent = await rpc(service, "bhk_claim_order", { p_user: userId, p_kind: kind, p_booking: bookingId ?? null, p_share: shareId ?? null });
  if (intent.status === "ready" && intent.gateway_order_id) return { success: true, configured: true, keyId: env.keyId, orderId: intent.gateway_order_id, amount: Number(intent.amount_paise), currency: intent.currency };
  try {
    const order = await createOrder({ amountRupees: Number(intent.amount_paise) / 100, receipt: intent.id, commissionRate: 0, notes: { intentId: intent.id } });
    if (Number(order.amount) !== Number(intent.amount_paise) || order.currency !== "INR") throw new TransactionError("The payment provider returned an invalid order.", 503);
    await rpc(service, "bhk_bind_order", { p_intent: intent.id, p_gateway: order.id });
    return { success: true, configured: true, keyId: env.keyId, orderId: order.id, amount: Number(order.amount), currency: order.currency };
  } catch (error) {
    const { error: saveError } = await service.from("bhk_payment_orders").update({ status: "failed" }).eq("id", intent.id).eq("status", "creating");
    if (saveError) throw new TransactionError("Checkout initialization needs reconciliation. Please contact support.", 503);
    throw error;
  }
}
