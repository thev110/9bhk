import test from "node:test";
import assert from "node:assert/strict";

// Node 23.6+ strips TypeScript types on import, so these exercise the real
// modules rather than a re-implementation. lib/availability.ts and lib/split.ts
// are dependency-free by design precisely so this stays possible; the only
// import is `import type`, which erases cleanly.
const { PROPERTIES, FILTERS, matchesFilter, MIN_BEDROOMS } = await import("../lib/properties.ts");
const {
  addDays,
  currentMonthStart,
  isPastDate,
  isRangeAvailable,
  monthKey,
  monthMatrix,
  nightsBetween,
  nightsInRange,
  occupiedNights,
  rangesOverlap,
  todayIso,
} = await import("../lib/availability.ts");
const { buildSplit, equalShares, markPaid, payoutState, splitProgress, toPaise } = await import(
  "../lib/split.ts"
);
const { buildSplitPayload, signSplitToken, verifySplitToken } = await import(
  "../lib/payments/split-token.ts"
);

const occ = (propertyId, checkIn, checkOut, status = "confirmed") => ({
  propertyId,
  checkIn,
  checkOut,
  status,
});

/** A minimal stand-in: availability only ever reads `id` and `blockedDates`. */
const villa = (id, blockedDates) => ({ id, blockedDates });

// ── Availability ─────────────────────────────────────────────────────────

test("A1. Stays are half-open: a same-day turnover is not a clash", () => {
  // 11th→13th checks out on the 13th, so 13th→15th must be bookable.
  assert.strictEqual(
    rangesOverlap({ checkIn: "2026-10-11", checkOut: "2026-10-13" }, { checkIn: "2026-10-13", checkOut: "2026-10-15" }),
    false,
    "A checkout and a check-in on the same day must not be treated as an overlap",
  );

  assert.strictEqual(
    rangesOverlap({ checkIn: "2026-10-11", checkOut: "2026-10-14" }, { checkIn: "2026-10-13", checkOut: "2026-10-15" }),
    true,
    "A shared night must be detected as an overlap",
  );

  // Containment in both directions.
  assert.strictEqual(
    rangesOverlap({ checkIn: "2026-10-10", checkOut: "2026-10-20" }, { checkIn: "2026-10-12", checkOut: "2026-10-13" }),
    true,
  );
  assert.strictEqual(
    rangesOverlap({ checkIn: "2026-10-12", checkOut: "2026-10-13" }, { checkIn: "2026-10-10", checkOut: "2026-10-20" }),
    true,
  );
});

test("A2. Nights change hands on checkout day, not check-in day", () => {
  assert.deepStrictEqual(nightsInRange({ checkIn: "2026-10-11", checkOut: "2026-10-14" }), [
    "2026-10-11",
    "2026-10-12",
    "2026-10-13",
  ]);
  assert.strictEqual(nightsBetween("2026-10-11", "2026-10-14"), 3);
});

test("A3. Date arithmetic crosses month and year boundaries", () => {
  assert.strictEqual(addDays("2026-10-31", 1), "2026-11-01");
  assert.strictEqual(addDays("2026-12-31", 1), "2027-01-01");
  assert.strictEqual(addDays("2026-03-01", -1), "2026-02-28");
  assert.strictEqual(nightsBetween("2026-12-30", "2027-01-02"), 3);
});

test("A4. A booking blocks its nights and cancelling gives them back", () => {
  const property = villa("villa-a");
  const held = [occ("villa-a", "2026-10-10", "2026-10-13")];

  assert.strictEqual(
    isRangeAvailable(property, held, { checkIn: "2026-10-11", checkOut: "2026-10-12" }),
    false,
    "A night inside a live booking must be unavailable",
  );
  assert.strictEqual(
    isRangeAvailable(property, held, { checkIn: "2026-10-13", checkOut: "2026-10-15" }),
    true,
    "The checkout day itself is free",
  );

  const cancelled = [occ("villa-a", "2026-10-10", "2026-10-13", "cancelled")];
  assert.strictEqual(
    isRangeAvailable(property, cancelled, { checkIn: "2026-10-11", checkOut: "2026-10-12" }),
    true,
    "A cancelled stay must release its nights",
  );
});

test("A5. An awaiting stay still holds its nights", () => {
  // 'awaiting' means the guest has committed but the host has not confirmed.
  // Releasing those nights would let the house be double-sold.
  const property = villa("villa-a");
  const pending = [occ("villa-a", "2026-10-10", "2026-10-13", "awaiting")];
  assert.strictEqual(
    isRangeAvailable(property, pending, { checkIn: "2026-10-11", checkOut: "2026-10-12" }),
    false,
  );
});

test("A6. Host-blocked dates close the calendar without a booking existing", () => {
  const property = villa("villa-a", ["2026-10-04", "2026-10-05"]);
  const nights = occupiedNights(property, []);
  assert.ok(nights.has("2026-10-04"), "A host-blocked night must count as occupied");
  assert.strictEqual(
    isRangeAvailable(property, [], { checkIn: "2026-10-04", checkOut: "2026-10-06" }),
    false,
  );
  assert.strictEqual(
    isRangeAvailable(property, [], { checkIn: "2026-10-06", checkOut: "2026-10-08" }),
    true,
  );
});

test("A7. One villa's bookings never block another villa", () => {
  const other = villa("villa-b");
  const held = [occ("villa-a", "2026-10-10", "2026-10-13")];
  assert.strictEqual(
    isRangeAvailable(other, held, { checkIn: "2026-10-11", checkOut: "2026-10-12" }),
    true,
    "Occupancy must be filtered by propertyId",
  );
});

test("A8. An empty or inverted range is never available", () => {
  const property = villa("villa-a");
  assert.strictEqual(isRangeAvailable(property, [], { checkIn: "2026-10-11", checkOut: "2026-10-11" }), false);
  assert.strictEqual(isRangeAvailable(property, [], { checkIn: "2026-10-13", checkOut: "2026-10-11" }), false);
});

test("A9. The month grid is six Monday-first weeks", () => {
  const days = monthMatrix(new Date(2026, 9, 1)); // October 2026
  assert.strictEqual(days.length, 42, "The grid is always six weeks");
  assert.strictEqual(days[0].getDay(), 1, "The grid starts on a Monday");
  assert.ok(
    days.some((day) => day.getMonth() === 9 && day.getDate() === 1),
    "The grid must contain the 1st of the target month",
  );
});

test("A10. Every seeded blocked date is a valid ISO day", () => {
  const blocked = PROPERTIES.flatMap((property) => property.blockedDates ?? []);
  assert.ok(blocked.length > 0, "At least one listing should demonstrate host-blocked dates");
  for (const iso of blocked) {
    assert.match(iso, /^\d{4}-\d{2}-\d{2}$/, `Blocked date '${iso}' is not ISO YYYY-MM-DD`);
    assert.ok(!Number.isNaN(Date.parse(iso)), `Blocked date '${iso}' is not a real date`);
  }
});

test("A11. todayIso is a valid ISO day", () => {
  assert.match(todayIso(new Date(2026, 8, 29)), /^2026-09-29$/);
});

test("A12. A picker opens on the month containing today", () => {
  const september = currentMonthStart(new Date(2026, 8, 29));
  assert.strictEqual(september.getFullYear(), 2026);
  assert.strictEqual(september.getMonth(), 8, "Must not roll forward into October");
  assert.strictEqual(september.getDate(), 1, "The grid starts on the 1st");

  // A month boundary must not slide the cursor into the next month.
  const endOfMonth = currentMonthStart(new Date(2026, 8, 30, 23, 59));
  assert.strictEqual(endOfMonth.getMonth(), 8);

  // Today's month is what the grid must contain, so the viewer lands on today.
  const days = monthMatrix(september);
  assert.ok(
    days.some((day) => day.getFullYear() === 2026 && day.getMonth() === 8 && day.getDate() === 29),
    "The opening grid must contain today",
  );
});

test("A13. Today is bookable; any earlier night is not", () => {
  const today = "2026-09-29";
  assert.strictEqual(isPastDate("2026-09-28", today), true, "Yesterday has gone");
  assert.strictEqual(isPastDate("2026-09-29", today), false, "Today must stay selectable");
  assert.strictEqual(isPastDate("2026-09-30", today), false);
  assert.strictEqual(isPastDate("2025-12-31", today), true);
  assert.strictEqual(isPastDate("2027-01-01", today), false);

  // ISO strings compare lexicographically, so a padded month is load-bearing.
  assert.strictEqual(isPastDate("2026-09-05", "2026-09-10"), true);
  assert.strictEqual(isPastDate("2026-10-01", "2026-09-30"), false);
});

test("A14. monthKey compares months, not days", () => {
  assert.strictEqual(monthKey(new Date(2026, 8, 29)), "2026-09", "Months are zero-based Dates");
  assert.strictEqual(monthKey(new Date(2026, 11, 1)), "2026-12");
  assert.strictEqual(monthKey("2026-09-29"), "2026-09");

  // A picker may step forward from today's month, never back into the past.
  const today = "2026-09-29";
  assert.strictEqual(monthKey("2026-09-01") > monthKey(today), false, "Opening month has nowhere to go back to");
  assert.strictEqual(monthKey("2026-08-31") > monthKey(today), false);
  assert.strictEqual(monthKey("2026-10-01") > monthKey(today), true);
  assert.strictEqual(monthKey("2027-01-04") > monthKey(today), true);
});

test("A15. A listing with no bookings shows every night as available", () => {
  // The reported bug: an empty calendar must read as open, not as blocked. A
  // property with no rows contributes no occupancy at all.
  const property = villa("no-bookings-villa");
  assert.strictEqual(occupiedNights(property, []).size, 0, "No rows must mean no occupied nights");

  for (const day of monthMatrix(currentMonthStart(new Date(2026, 8, 1)))) {
    const checkIn = todayIso(day);
    const range = { checkIn, checkOut: addDays(checkIn, 2) };
    assert.strictEqual(
      isRangeAvailable(property, [], range),
      true,
      `${range.checkIn} → ${range.checkOut} must be bookable when nothing is booked`,
    );
  }
});

// ── Formatting ───────────────────────────────────────────────────────────

const { formatBytes } = await import("../lib/format.ts");

test("F1. File sizes cross over to the right unit, and never read as zero", () => {
  assert.strictEqual(formatBytes(0), "0 KB");
  assert.strictEqual(formatBytes(512), "512 B");
  // The boundary is decimal, matching what a file picker reports.
  assert.strictEqual(formatBytes(999), "999 B");
  assert.strictEqual(formatBytes(1000), "1 KB");
  assert.strictEqual(formatBytes(15 * 1024 * 1024), "15.7 MB");
  // A bad value must still print something rather than "NaN MB".
  assert.strictEqual(formatBytes(Number.NaN), "0 KB");
  assert.strictEqual(formatBytes(-4), "0 KB");
});

// ── Split Pay ────────────────────────────────────────────────────────────

test("S1. Shares add up to the total exactly, even when it does not divide", () => {
  for (const total of [42000, 9999, 1000, 7, 100000]) {
    for (const count of [2, 3, 4, 7, 8, 9]) {
      const amounts = equalShares(total, count);
      assert.strictEqual(amounts.length, count, `equalShares(${total}, ${count}) length`);
      assert.strictEqual(
        amounts.reduce((sum, n) => sum + n, 0),
        total,
        `equalShares(${total}, ${count}) must sum back to the total, got ${amounts.join("+")}`,
      );
      // Nobody should be more than one rupee apart.
      assert.ok(Math.max(...amounts) - Math.min(...amounts) <= 1, "Shares must differ by at most 1 rupee");
    }
  }
  assert.deepStrictEqual(equalShares(100, 0), [], "Zero people splits into nothing");
});

test("S2. buildSplit lists the organiser first and never duplicates them", () => {
  // The organiser is already one of the three named people, so the group is 3.
  const shares = buildSplit(42000, ["Priya", "Arun", "Meera"], "Arun");
  assert.strictEqual(shares.length, 3, "An organiser already on the roster must not be added twice");
  assert.strictEqual(shares[0].name, "Arun", "The organiser holds the first share");
  assert.strictEqual(new Set(shares.map((s) => s.name)).size, 3, "No duplicate roster entries");
  assert.strictEqual(shares.reduce((sum, s) => sum + s.amount, 0), 42000);
  assert.ok(shares.every((s) => !s.paid), "A fresh split starts unpaid");

  // An organiser absent from the roster is added, not silently dropped.
  const withOrganiser = buildSplit(42000, ["Priya", "Meera"], "Arun");
  assert.strictEqual(withOrganiser.length, 3, "A missing organiser joins the split");
  assert.strictEqual(withOrganiser[0].name, "Arun");
  assert.strictEqual(withOrganiser.reduce((sum, s) => sum + s.amount, 0), 42000);
});

test("S3. Progress is exact and only funded when fully collected", () => {
  let shares = buildSplit(42000, ["Priya", "Arun", "Meera"], "Arun");
  let progress = splitProgress(shares);
  assert.deepStrictEqual(
    { collected: progress.collected, outstanding: progress.outstanding, percent: progress.percent, funded: progress.funded },
    { collected: 0, outstanding: 42000, percent: 0, funded: false },
  );

  shares = markPaid(shares, shares[0].id, "2026-09-29");
  progress = splitProgress(shares);
  assert.strictEqual(progress.paidCount, 1);
  assert.strictEqual(progress.collected, shares[0].amount);
  assert.strictEqual(progress.collected + progress.outstanding, 42000);
  assert.strictEqual(progress.funded, false, "A partly-paid group is not funded");

  shares = shares.map((s) => ({ ...s, paid: true }));
  progress = splitProgress(shares);
  assert.strictEqual(progress.funded, true);
  assert.strictEqual(progress.percent, 100);
  assert.strictEqual(progress.outstanding, 0);
});

test("S4. markPaid touches exactly one share", () => {
  const shares = buildSplit(12000, ["Priya", "Meera"], "Arun");
  const after = markPaid(shares, shares[1].id, "2026-09-29");
  assert.strictEqual(after[0].paid, false, "Other shares are untouched");
  assert.strictEqual(after[1].paid, true);
  assert.strictEqual(after[1].paidAt, "2026-09-29");
  assert.strictEqual(markPaid(shares, "no-such-id", "2026-09-29").filter((s) => s.paid).length, 0);
});

test("S5. Escrow releases only when funded AND the stay has begun", () => {
  const unpaid = buildSplit(42000, ["Priya", "Meera"], "Arun");

  assert.deepStrictEqual(payoutState(unpaid, "2026-10-11", "2026-09-29"), {
    ready: false,
    reason: "unfunded",
    outstandingCount: 3,
  });

  const paid = unpaid.map((s) => ({ ...s, paid: true }));

  // Funded weeks early — the host must not be paid yet.
  assert.strictEqual(payoutState(paid, "2026-10-11", "2026-09-29").reason, "too-early");
  assert.strictEqual(payoutState(paid, "2026-10-11", "2026-09-29").ready, false);

  // Check-in day itself releases.
  assert.strictEqual(payoutState(paid, "2026-10-11", "2026-10-11").reason, "ready");
  assert.strictEqual(payoutState(paid, "2026-10-11", "2026-10-11").ready, true);

  // And a stay already under way stays releasable.
  assert.strictEqual(payoutState(paid, "2026-10-11", "2026-10-13").ready, true);
});

test("S6. Gateway amounts are converted to paise", () => {
  assert.strictEqual(toPaise(42000), 4200000);
  assert.strictEqual(toPaise(999.5), 99950);
});

// ── Celebration capacity ─────────────────────────────────────────────────

test("C1. The celebration filter matches exactly the listings that declare one", () => {
  assert.ok(FILTERS.includes("Celebration Ready"), "'Celebration Ready' must be an exposed filter");

  const matched = PROPERTIES.filter((property) => matchesFilter(property, "Celebration Ready"));
  const declared = PROPERTIES.filter((property) => property.celebration);
  assert.ok(declared.length > 0, "At least one listing should be set up for events");
  assert.deepStrictEqual(
    matched.map((p) => p.id).sort(),
    declared.map((p) => p.id).sort(),
    "The filter must match precisely the listings with a celebration spec",
  );
});

test("C2. Celebrations stay optional — not every house can host one", () => {
  const declared = PROPERTIES.filter((p) => p.celebration);
  assert.ok(
    declared.length < PROPERTIES.length,
    "Celebration capacity is a differentiator, not a mandate — some listings must not have it",
  );
});

test("C3. Every celebration spec is internally coherent", () => {
  for (const property of PROPERTIES.filter((p) => p.celebration)) {
    const spec = property.celebration;
    // An event spec smaller than the house's own guest count is nonsense.
    assert.ok(
      spec.maxEventGuests >= property.guests,
      `${property.name} claims ${spec.maxEventGuests} event guests but sleeps ${property.guests}`,
    );
    assert.ok(spec.powerLoadKw > 0, `${property.name} must declare a real sanctioned load`);
    assert.ok(
      spec.soundCurfewHour >= 0 && spec.soundCurfewHour <= 23,
      `${property.name} curfew ${spec.soundCurfewHour} is outside 0–23`,
    );
    assert.ok(spec.parkingCars >= 0, `${property.name} parking must not be negative`);
    assert.ok(spec.generatorKw >= 0, `${property.name} generator must not be negative`);
    assert.strictEqual(typeof spec.catererKitchen, "boolean");
  }
});

test("T1. A signed invite token round-trips", async () => {
  const secret = "test-secret-do-not-use";
  const payload = buildSplitPayload({
    bookingCode: "9B-41234",
    slot: 2,
    memberName: "Meera",
    amount: 14000,
    propertyName: "Mahabs Dune Residence",
    organiser: "Arun",
    checkIn: "2026-10-11",
    checkOut: "2026-10-13",
  });
  const token = await signSplitToken(payload, secret);
  const decoded = await verifySplitToken(token, secret);
  assert.strictEqual(decoded?.bookingCode, "9B-41234");
  assert.strictEqual(decoded?.slot, 2);
  assert.strictEqual(decoded?.amount, 14000);
  assert.strictEqual(decoded?.memberName, "Meera");
});

test("T2. A tampered amount fails verification", async () => {
  const secret = "test-secret-do-not-use";
  const payload = buildSplitPayload({
    bookingCode: "9B-41234",
    slot: 0,
    memberName: "Arun",
    amount: 42000,
    propertyName: "Mahabs Dune Residence",
    organiser: "Arun",
    checkIn: "2026-10-11",
    checkOut: "2026-10-13",
  });
  const token = await signSplitToken(payload, secret);
  const [body, signature] = token.split(".");

  // Rewrite the amount to one rupee, keep the original signature.
  const decoded = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  decoded.amount = 1;
  const forgedBody = Buffer.from(JSON.stringify(decoded)).toString("base64url");

  assert.strictEqual(
    await verifySplitToken(`${forgedBody}.${signature}`, secret),
    null,
    "An edited payload must not verify",
  );
  assert.strictEqual(
    await verifySplitToken(`${body}.${Buffer.from("nonsense").toString("base64url")}`, secret),
    null,
    "A forged signature must not verify",
  );
});

test("T3. A token signed with another secret is rejected", async () => {
  const payload = buildSplitPayload(
    {
      bookingCode: "9B-41234",
      slot: 0,
      memberName: "Arun",
      amount: 1000,
      propertyName: "Villa",
      organiser: "Arun",
      checkIn: "2026-10-11",
      checkOut: "2026-10-12",
    },
    1_700_000_000,
  );
  const token = await signSplitToken(payload, "secret-a");
  assert.strictEqual(await verifySplitToken(token, "secret-b", 1_700_000_100), null);
});

test("T4. Expired tokens are rejected", async () => {
  const secret = "test-secret-do-not-use";
  const payload = buildSplitPayload(
    {
      bookingCode: "9B-41234",
      slot: 1,
      memberName: "Priya",
      amount: 7000,
      propertyName: "Villa",
      organiser: "Arun",
      checkIn: "2026-10-11",
      checkOut: "2026-10-12",
    },
    1_700_000_000,
  );
  const token = await signSplitToken(payload, secret);

  // Still inside the window, then well past it.
  assert.ok(await verifySplitToken(token, secret, 1_700_000_100), "A fresh token verifies");
  assert.strictEqual(
    await verifySplitToken(token, secret, 1_700_000_000 + 60 * 60 * 24 * 30),
    null,
    "A token past its expiry must not verify",
  );
});

test("T5. Malformed tokens are rejected without throwing", async () => {
  const secret = "test-secret-do-not-use";
  for (const bad of ["", "no-separator", ".only-signature", "only-body.", "a.b.c"]) {
    assert.strictEqual(await verifySplitToken(bad, secret), null, `'${bad}' must be rejected`);
  }
  assert.strictEqual(await verifySplitToken("anything", ""), null, "An empty secret must reject");
});

test("C4. Every listing still clears the three-bedroom floor", () => {
  for (const property of PROPERTIES) {
    assert.ok(
      property.bedrooms >= MIN_BEDROOMS,
      `${property.name} has ${property.bedrooms} bedrooms, below the ${MIN_BEDROOMS} floor`,
    );
  }
});
