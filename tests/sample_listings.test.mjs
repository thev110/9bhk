import test from "node:test";
import assert from "node:assert/strict";
import { migratedDatabase, asRole } from "./helpers/database.mjs";

test("host-less (sample) listings are labelled and can never be held or checked out", async () => {
  const db = await migratedDatabase();
  try {
    const guest = "00000000-0000-0000-0000-000000000901";
    const host = "00000000-0000-0000-0000-000000000902";
    await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'guest@example.test',now()),($2,'host@example.test',now())", [guest, host]);
    await db.query(`insert into bhk_properties(id,host_id,name,bedrooms,guests,price,cleaning,min_stay,status) values
      ('sample-estate',null,'Sample estate',3,6,1000,200,1,'published'),('hosted-estate',$1,'Hosted estate',3,6,1000,200,1,'published')`, [host]);

    await asRole(db, "anon", null, async () => {
      const { rows } = await db.query("select id,bookable from bhk_public_properties where id in ('sample-estate','hosted-estate') order by id");
      assert.deepEqual(rows.map(r => [r.id, r.bookable]), [["hosted-estate", true], ["sample-estate", false]]);
      assert.equal("host_id" in rows[0], false);
    });

    await asRole(db, "service_role", null, async () => {
      await assert.rejects(
        db.query("select bhk_prepare_booking($1,'sample-estate',current_date+10,current_date+12,2,0,'Guest','guest@example.test','9840012345')", [guest]),
        /sample listing is not bookable/i);
      const hold = (await db.query("select bhk_prepare_booking($1,'hosted-estate',current_date+10,current_date+12,2,0,'Guest','guest@example.test','9840012345') result", [guest])).rows[0].result;
      assert.ok(hold.bookingId);
      const intent = (await db.query("select bhk_claim_order($1,'booking',$2,null) result", [guest, hold.bookingId])).rows[0].result;
      assert.ok(intent.id);
    });

    // A hold created before this rule (or a listing whose host was removed) still cannot reach checkout.
    await db.query("alter table bhk_bookings disable trigger bhk_bookings_refuse_sample");
    const legacy = (await db.query(`insert into bhk_bookings(code,property_id,property_name,guest_id,guest_name,guest_email,check_in,check_out,total,status,hold_expires_at)
      values('LEGACY-SAMPLE','sample-estate','Sample estate',$1,'Guest','guest@example.test',current_date+20,current_date+22,2400,'awaiting',now()+interval '30 minutes') returning id`, [guest])).rows[0].id;
    await db.query("alter table bhk_bookings enable trigger bhk_bookings_refuse_sample");
    await asRole(db, "service_role", null, async () => {
      await assert.rejects(db.query("select bhk_claim_order($1,'booking',$2,null)", [guest, legacy]), /sample listing is not bookable/i);
      await assert.rejects(db.query(`insert into bhk_bookings(code,property_id,property_name,guest_id,guest_name,guest_email,check_in,check_out,total,status)
        values('DIRECT-SAMPLE','sample-estate','Sample estate',$1,'Guest','guest@example.test',current_date+30,current_date+32,2400,'awaiting')`, [guest]), /sample listing is not bookable/i);
    });
  } finally { await db.close(); }
});
