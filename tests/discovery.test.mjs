import test from "node:test";
import assert from "node:assert/strict";
import { migratedDatabase, asRole } from "./helpers/database.mjs";
import { discoveryRequest } from "../lib/discovery.ts";

test("comparison requests bound listings, dates, guests and flexible search", () => {
  const input = { propertyIds: ["villa"], checkIn: "2030-01-01", checkOut: "2030-01-03", adults: 2, children: 0 };
  assert.equal(discoveryRequest(input).flexDays, 0);
  for (const patch of [{ propertyIds: [] }, { propertyIds: ["a","b","c","d","e"] }, { propertyIds: ["a","a"] }, { checkIn: "2030-02-30" }, { checkOut: "2029-12-31" }, { adults: 0 }, { children: -1 }, { flexDays: 4 }, { flexDays: 1.5 }]) {
    assert.throws(() => discoveryRequest({ ...input, ...patch }));
  }
});

test("live comparison shares reservation prices, honors availability, and never creates holds", async () => {
  const db = await migratedDatabase();
  try {
    const host = "00000000-0000-0000-0000-000000000301";
    const guest = "00000000-0000-0000-0000-000000000302";
    await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'quote-host@example.test',now()),($2,'quote-guest@example.test',now())", [host,guest]);
    await db.query("insert into bhk_properties(id,host_id,name,bedrooms,guests,price,weekend_price,cleaning,deposit,tax_rate,platform_fee_rate,min_stay,status) values('quote-villa',$1,'Quote Villa',3,6,1000,1500,200,500,0.12,0.10,2,'published'),('quote-draft',$1,'Private Draft',3,6,1000,1500,200,500,0.12,0.10,2,'draft')", [host]);
    await db.query("insert into bhk_property_rates(property_id,host_id,start_date,end_date,nightly_price) values('quote-villa',$1,'2030-01-05','2030-01-06',2000)", [host]);
    await asRole(db, "anon", null, async () => {
      await assert.rejects(db.query("select bhk_stay_quote('quote-villa','2030-01-05','2030-01-07',2,0)"), /permission denied/i);
    });
    await asRole(db, "service_role", null, async () => {
      const result = (await db.query("select bhk_discovery_quotes(array['quote-villa','quote-draft'],'2030-01-05','2030-01-07',2,0,3) result")).rows[0].result;
      assert.equal(result.quotes.length, 14);
      assert.equal(result.reservesInventory, false);
      assert.equal(result.quotes.filter(q => q.propertyId === "quote-draft").every(q => !q.available && !("totalPaise" in q)), true);
      const quote = result.quotes.find(q => q.propertyId === "quote-villa" && q.offsetDays === 0);
      assert.equal(quote.stayPaise, 350000); // seasonal Saturday then weekend Sunday
      assert.equal(quote.platformFeePaise, 35000);
      assert.equal(quote.taxPaise, 48600);
      assert.equal(quote.totalPaise, 503600);
      assert.equal((await db.query("select count(*) from bhk_bookings")).rows[0].count, 0);
      await assert.rejects(db.query("select bhk_stay_quote('quote-villa','2030-01-05','2030-01-07',7,0)"), /capacity/i);
      await assert.rejects(db.query("select bhk_stay_quote('quote-villa','2030-01-05','2030-01-06',2,0)"), /dates/i);
      await assert.rejects(db.query("select bhk_discovery_quotes(array['a','b','c','d','e'],'2030-01-05','2030-01-07',2,0,0)"), /1-4/i);
      const hold = (await db.query("select bhk_prepare_booking($1,'quote-villa','2030-01-05','2030-01-07',2,0,'Guest','guest@example.test','9840012345') result", [guest])).rows[0].result;
      assert.equal(hold.quote.total * 100, quote.totalPaise);
      assert.equal(hold.quote.stay * 100, quote.stayPaise);
      const reserved = (await db.query("select bhk_discovery_quotes(array['quote-villa'],'2030-01-05','2030-01-07',2,0,0) result")).rows[0].result;
      assert.equal(reserved.quotes[0].available, false);
      await db.query("update bhk_bookings set hold_expires_at=now()-interval '1 minute' where id=$1", [hold.bookingId]);
      const expired = (await db.query("select bhk_discovery_quotes(array['quote-villa'],'2030-01-05','2030-01-07',2,0,0) result")).rows[0].result;
      assert.equal(expired.quotes[0].available, true);
      assert.equal((await db.query("select status from bhk_bookings where id=$1", [hold.bookingId])).rows[0].status, "awaiting"); // read only
    });
    await db.query("update bhk_properties set blocked_dates=array['2030-01-06'::date] where id='quote-villa'");
    await asRole(db, "service_role", null, async () => {
      await assert.rejects(db.query("select bhk_stay_quote('quote-villa','2030-01-05','2030-01-07',2,0)"), /closure/i);
      // A blocked checkout date is not an occupied night.
      const quote = (await db.query("select bhk_stay_quote('quote-villa','2030-01-04','2030-01-06',2,0) result")).rows[0].result;
      assert.equal(quote.stay, 3000);
    });
  } finally { await db.close(); }
});
