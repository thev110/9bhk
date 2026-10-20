import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) return { url: pathToFileURL(path.resolve(`${specifier.slice(2)}.ts`)).href, shortCircuit: true };
  return nextResolve(specifier, context);
} });
const { mergeCatalog, fromRow, previewCatalog } = await import("../lib/catalog-rows.ts");
const { bookingQuery, validIsoDay } = await import("../lib/search-state.ts");
const { quote } = await import("../lib/format.ts");
const row = (patch = {}) => ({ id: "actual-listing", name: "Actual listing", status: "published", bedrooms: 3,
  guests: 6, beds: 3, bathrooms: 2, price: 1000, cleaning: 200, amenities: [], vibes: [], image_urls: [], ...patch });

test("an empty or unpublished live inventory never resurrects preview listings", () => {
  assert.deepEqual(mergeCatalog([]), []);
  assert.deepEqual(mergeCatalog([row({ id: previewCatalog()[0].id, status: "draft" })]), []);
  assert.equal(mergeCatalog([row()]).length, 1);
  assert.deepEqual(mergeCatalog([row({ bedrooms: 2 })]), []);
});

test("public mapping never includes private location or synthetic review counts", () => {
  const actual = fromRow(row({ address: "Private gate", latitude: 12, longitude: 80, rating: 5, reviews: 999,
    setting: "seaside", tide_distance_meters: null, private_beach_access: null }));
  assert.equal(actual.address, undefined);
  assert.equal(actual.latitude, undefined);
  assert.equal(actual.longitude, undefined);
  assert.equal(actual.rating, 0);
  assert.equal(actual.reviews, 0);
  assert.equal(actual.privateBeachAccess, false);
  assert.equal(actual.tideDistanceMeters, undefined);
});

test("only verified review aggregates and actual uploaded photos are mapped", () => {
  const actual = fromRow(row({ verified_review_rating: 4.6, verified_review_count: 7, image_urls: ["/one.jpg", "/two.jpg"] }));
  assert.equal(actual.rating, 4.6);
  assert.equal(actual.reviews, 7);
  assert.deepEqual(actual.photos, ["/one.jpg", "/two.jpg"]);
  assert.equal(previewCatalog().every((property) => !property.reviews && !property.guestFavourite), true);
});

test("search-to-booking handoff rejects invalid dates/counts and unrelated query values", () => {
  assert.equal(validIsoDay("2026-02-30"), false);
  assert.equal(validIsoDay("2028-02-29"), true);
  assert.equal(bookingQuery(new URLSearchParams("checkIn=2026-10-20&checkOut=2026-10-22&guests=6&amount=1&broker=secret")), "checkIn=2026-10-20&checkOut=2026-10-22&guests=6");
  assert.equal(bookingQuery(new URLSearchParams("checkIn=2026-10-22&checkOut=2026-10-20&guests=-1")), "");
});

test("itemized estimate reconciles fees/taxes and does not tax the refundable deposit", () => {
  const actual = quote(1000, 200, 2, { taxRate: 0.1, platformFeeRate: 0.1, deposit: 500 });
  assert.deepEqual(actual, { stay: 2000, cleaning: 200, tax: 240, platformFee: 200, deposit: 500, discount: 0, total: 3140 });
  assert.equal(quote(1000, 0, 1, { taxRate: 0, platformFeeRate: 0 }).total, 1000);
});

test("host-less rows and preview listings are marked as samples; hosted rows are not", () => {
  assert.equal(fromRow(row({ bookable: false })).sample, true);
  assert.equal(fromRow(row({ bookable: true })).sample, false);
  assert.ok(previewCatalog().every(property => property.sample === true));
});
