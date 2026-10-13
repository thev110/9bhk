import test from "node:test";
import assert from "node:assert/strict";
import { audienceForDestination, destinationForAudience, destinationForEstateIntent, safeReturnPath } from "../lib/product-audiences.ts";

test("product sign-in rejects external URLs and ambiguous return paths", () => {
  for (const path of [null, "", "https://example.com", "//example.com", "/\\example.com", "/\nexample.com", " /buy"]) {
    assert.equal(safeReturnPath(path), "/");
  }
  assert.equal(safeReturnPath("/host/new?mode=sale"), "/host/new?mode=sale");
});

test("existing buying, listing and broker entry links select the correct product", () => {
  assert.equal(audienceForDestination("/realtor"), "pro");
  assert.equal(audienceForDestination("/realtor?tab=clients"), "pro");
  assert.equal(audienceForDestination("/buy"), "estates");
  assert.equal(audienceForDestination("/host/new?mode=sale"), "estates");
  assert.equal(audienceForDestination("/host/bookings"), "estates");
  assert.equal(audienceForDestination("/book/bay-breakers-vault?guests=8"), "stays");
  assert.equal(audienceForDestination("/realtor-lookalike"), "stays");
});

test("choosing guests preserves a booking deep link", () => {
  const booking = "/book/bay-breakers-vault?guests=8";
  assert.equal(destinationForAudience("stays", booking), booking);
  assert.equal(destinationForAudience("pro", booking), "/realtor");
  assert.equal(destinationForAudience("estates", booking), "/buy");
});

test("choosing buyers and owners preserves the listing mode and return path", () => {
  assert.equal(destinationForAudience("estates", "/host/new?mode=sale"), "/host/new?mode=sale");
  assert.equal(destinationForAudience("estates", "/host/bookings?tab=earnings"), "/host/bookings?tab=earnings");
  assert.equal(destinationForAudience("pro", "/host/new?mode=sale"), "/realtor");
  assert.equal(destinationForAudience("stays", "/host/new?mode=sale"), "/");
});

test("switching product from a malicious return link uses a local destination", () => {
  assert.equal(destinationForAudience("stays", "//example.com"), "/");
  assert.equal(destinationForAudience("pro", "//example.com"), "/realtor");
  assert.equal(destinationForAudience("estates", "//example.com"), "/buy");
});

test("switching between buying and listing restores the original sale listing", () => {
  const sale = "/host/new?mode=sale";
  assert.equal(destinationForEstateIntent("buy", sale), "/buy");
  assert.equal(destinationForEstateIntent("list", sale), sale);
  assert.equal(destinationForEstateIntent("buy", "/buy?setting=seaside"), "/buy?setting=seaside");
  assert.equal(destinationForEstateIntent("list", "/buy?setting=seaside"), "/host/new");
  assert.equal(destinationForEstateIntent("list", "//example.com"), "/host/new");
});
