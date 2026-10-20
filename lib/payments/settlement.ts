/** Pure checks shared by return verification and captured webhooks. */
export type CapturedPayment = { id: string; order_id: string; amount: number; currency: string; status: string; captured: boolean; created_at: number };
export function matchesCapturedPayment(payment: CapturedPayment, expected: { orderId: string; amount: number; currency: string; paymentId?: string }): boolean {
  return payment.status === "captured" && payment.captured === true && payment.order_id === expected.orderId && payment.amount === expected.amount && payment.currency === expected.currency && typeof payment.id === "string" && payment.id.length > 0 && (!expected.paymentId || payment.id === expected.paymentId) && Number.isFinite(payment.created_at) && payment.created_at > 0;
}
