import type { Booking, ListingDraft } from "@/lib/store";

/** Inclusive first night and exclusive checkout, also across leap/month ends. */
export function closureDates(from: string, until: string): string[] {
  const start = new Date(`${from}T00:00:00Z`), end = new Date(`${until}T00:00:00Z`);
  const days = (end.getTime() - start.getTime()) / 86400000;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(until) ||
    !Number.isInteger(days) || days < 1 || days > 366 ||
    start.toISOString().slice(0, 10) !== from || end.toISOString().slice(0, 10) !== until) {
    throw new Error("Choose a valid date range of 1–366 nights; the end date is checkout.");
  }
  return Array.from({ length: days }, (_, n) => new Date(start.getTime() + n * 86400000).toISOString().slice(0, 10));
}

export function validateListingDraft(form: ListingDraft): void {
  if (form.name.trim().length < 3 || !form.address.trim() || !form.city.trim() || form.description.trim().length < 20 ||
    !Number.isInteger(form.bedrooms) || form.bedrooms < 3 || !Number.isInteger(form.price) || form.price <= 0 ||
    !Number.isInteger(form.cleaning) || form.cleaning < 0 || !Number.isInteger(form.deposit) || form.deposit < 0 ||
    !Number.isInteger(form.minStay) || form.minStay < 1 || form.minStay > 90 ||
    !Number.isInteger(form.guests) || form.guests < 1 || !Number.isInteger(form.beds) || form.beds < 3 ||
    !Number.isInteger(form.bathrooms) || form.bathrooms < 1 || form.photos.length < 3 ||
    (form.isForSale && (!Number.isInteger(form.salePrice) || (form.salePrice || 0) <= 0))) {
    throw new Error("Complete the address, description, capacity, whole-rupee pricing and at least three uploaded photos before submitting.");
  }
  if (form.hostsCelebrations && (!(Number(form.maxEventGuests) > 0) || !(Number(form.powerLoadKw) > 0) ||
    !Number.isInteger(form.soundCurfewHour) || Number(form.soundCurfewHour) < 0 || Number(form.soundCurfewHour) > 23)) {
    throw new Error("Complete celebration capacity, power supply and sound curfew.");
  }
}

/** Receipt facts must come from a fully paid persisted quote, not a UI estimate. */
export type ReceiptPayment = { payment_id: string; amount_paise: number; currency: string; captured_at: string | null };
export function paymentReceipt(booking: Booking, payments: ReceiptPayment[]): string {
  const quote = booking.quote;
  const paidPaise = payments?.reduce((sum, p) => sum + p.amount_paise, 0) || 0;
  if (!["paid", "partial"].includes(booking.paymentStatus || "") || !booking.paymentRef || !quote || !Number.isInteger(booking.total) || booking.total <= 0 ||
    quote.total !== booking.total || ["stay", "cleaning", "platformFee", "tax", "deposit"].some(key => !Number.isInteger(quote[key]) || quote[key] < 0) ||
    quote.stay + quote.cleaning + quote.platformFee + quote.tax + quote.deposit !== booking.total ||
    !payments?.length || payments.some(p => !p.payment_id || !p.captured_at || p.currency !== "INR" || !Number.isInteger(p.amount_paise) || p.amount_paise <= 0) ||
    paidPaise > booking.total * 100 || (booking.paymentStatus === "paid" && paidPaise !== booking.total * 100) ||
    (booking.paymentStatus === "partial" && paidPaise >= booking.total * 100)) {
    throw new Error("A reconciled captured payment receipt is not available for this booking.");
  }
  return ["9bhk payment receipt", `Booking: ${booking.code}`, `Property: ${booking.propertyName || booking.propertyId}`,
    `Stay: ${booking.checkIn} to ${booking.checkOut}`, `Guest: ${booking.guestName}`,
    ...payments.map(p => `Payment reference: ${p.payment_id} | INR ${p.amount_paise / 100} | Captured ${p.captured_at}`),
    `Stay: INR ${quote.stay}`, `Cleaning: INR ${quote.cleaning}`, `Platform fee: INR ${quote.platformFee}`,
    `Tax: INR ${quote.tax}`, `Refundable deposit: INR ${quote.deposit}`, `Reservation total: INR ${booking.total}`,
    `Captured payments total: INR ${paidPaise / 100}`, `Remaining balance: INR ${booking.total - paidPaise / 100}`,
    `Payment status: ${booking.paymentStatus}`, `Refund status: ${booking.refundStatus || "none"}`].join("\n");
}
