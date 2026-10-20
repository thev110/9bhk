import test from "node:test";
import assert from "node:assert/strict";
import { safeNextPath, subscriptionActive, accountCacheKey } from "../lib/account.ts";
test("auth return paths reject browser URL normalization bypasses", () => {
  for (const path of ["https://evil.test", "//evil.test", "/\\evil.test", "/%5cevil.test", "/%2fevil.test", "/%00evil.test", "/\nevil.test", "%2f%2fevil.test", "/%zz", "/foo/..//evil.test", "/foo/%2e%2e//evil.test"]) assert.equal(safeNextPath(path), "/", path);
  assert.equal(safeNextPath("/book/guava?guests=4#quote"), "/book/guava?guests=4#quote");
});
test("expiry is enforced independently of broker verification", () => {
  const now = Date.parse("2026-10-13T10:00:00Z");
  assert.equal(subscriptionActive("active", "2026-10-14T10:00:00Z", now), true);
  assert.equal(subscriptionActive("active", "2026-10-13T10:00:00Z", now), false);
  assert.equal(subscriptionActive("expired", "2026-10-14T10:00:00Z", now), false);
  assert.equal(subscriptionActive("active", "invalid", now), false);
  assert.notEqual(accountCacheKey("account-a"), accountCacheKey("account-b"));
});
