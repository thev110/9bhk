import test from "node:test";
import assert from "node:assert/strict";
import { closureDates, paymentReceipt, validateListingDraft } from "../lib/operations.ts";

test("host closures cover occupied nights and leave checkout open across month and leap-day boundaries", () => {
  assert.deepEqual(closureDates("2028-02-28", "2028-03-02"), ["2028-02-28", "2028-02-29", "2028-03-01"]);
  for (const dates of [["2027-02-29", "2027-03-02"], ["2026-10-13", "2026-10-13"], ["2026-10-14", "2026-10-13"], ["2026-10-13", "2028-10-13"], ["", ""]]) {
    assert.throws(() => closureDates(...dates));
  }
});

const listing = { name: "Garden Villa", description: "A quiet garden villa with room for the whole group.", address: "Private road 1", city: "Chennai", bedrooms: 3, beds: 3, bathrooms: 2, guests: 6, price: 8000, cleaning: 800, deposit: 2000, minStay: 2, photos: ["uploaded-a", "uploaded-b", "uploaded-c"] };
test("listing submission rejects incomplete and invalid financial/capacity facts", () => {
  assert.doesNotThrow(() => validateListingDraft(listing));
  for (const change of [{ address: "" }, { bedrooms: 2 }, { price: NaN }, { cleaning: -1 }, { deposit: 2.5 }, { minStay: 0 }, { photos: [] }, { isForSale: true, salePrice: 0 }, { hostsCelebrations: true, maxEventGuests: 30, powerLoadKw: 0 }]) {
    assert.throws(() => validateListingDraft({ ...listing, ...change }));
  }
});

const booking = { code: "9B-persisted", propertyId: "villa", propertyName: "Garden Villa", checkIn: "2026-11-01", checkOut: "2026-11-03", guestName: "Guest", total: 11800, paymentStatus: "paid", paymentRef: "pay_captured", quote: { stay: 8000, cleaning: 800, platformFee: 500, tax: 500, deposit: 2000, total: 11800 }, refundStatus: "requested" };
const payments = [{ payment_id: "pay_captured", amount_paise: 1180000, currency: "INR", captured_at: "2026-10-13T12:00:00Z" }];
test("receipts require a paid, reconciled persisted quote and distinguish deposits and refund requests", () => {
  const receipt = paymentReceipt(booking, payments);
  assert.match(receipt, /Payment reference: pay_captured/);
  assert.match(receipt, /Refundable deposit: INR 2000/);
  assert.match(receipt, /Refund status: requested/);
  for (const change of [{ paymentStatus: "pending" }, { paymentRef: "" }, { quote: undefined }, { total: 1 }, { quote: { ...booking.quote, tax: 600 } }]) {
    assert.throws(() => paymentReceipt({ ...booking, ...change }, payments));
  }
  for (const bad of [[], [{ ...payments[0], amount_paise: 10 }], [{ ...payments[0], currency: "USD" }], [{ ...payments[0], captured_at: null }]]) assert.throws(() => paymentReceipt(booking, bad));
  assert.match(paymentReceipt(booking, [{ ...payments[0], amount_paise: 590000 }, { ...payments[0], payment_id: "pay_second", amount_paise: 590000 }]), /Payment reference: pay_second/);
  assert.match(paymentReceipt({ ...booking, paymentStatus: "partial" }, [{ ...payments[0], amount_paise: 590000 }]), /Remaining balance: INR 5900/);
});
