import test from "node:test";
import assert from "node:assert/strict";
import { migratedDatabase, asRole } from "./helpers/database.mjs";

test("completion and payout respect immutable local checkout time", async()=>{
  const db=await migratedDatabase();
  const host="00000000-0000-0000-0000-000000000211";
  try {
    await db.query("insert into auth.users(id) values($1)",[host]);
    await db.query("insert into bhk_properties(id,host_id,name,bedrooms,status,check_out_time) values('checkout-estate',$1,'Checkout estate',3,'published','23:59:59')",[host]);
    await db.query(`insert into bhk_bookings(code,property_id,property_name,host_id,guest_name,guest_email,check_in,check_out,total,status,payment_status)
      values('TIME-TEST','checkout-estate','Checkout estate',$1,'Guest','guest@example.test',(now() at time zone 'Asia/Kolkata')::date-2,(now() at time zone 'Asia/Kolkata')::date,1000,'confirmed','paid')`,[host]);
    const original=(await db.query("select checkout_at from bhk_bookings where code='TIME-TEST'")).rows[0].checkout_at;
    await db.query("update bhk_properties set check_out_time='00:00' where id='checkout-estate'");
    await asRole(db,"service_role",null,async()=>{
      assert.equal((await db.query("select bhk_expire_holds() result")).rows[0].result.completed,0);
      // Even if another process prematurely set completed, payout has its own timestamp boundary.
      await db.query("update bhk_bookings set status='completed',checkout_at=now()-interval '1 day' where code='TIME-TEST'");
      assert.deepEqual((await db.query("select checkout_at from bhk_bookings where code='TIME-TEST'")).rows[0].checkout_at,original);
      await assert.rejects(db.query("select bhk_request_payout($1)",[host]),/eligible/i);
      await db.query("update bhk_bookings set check_out=check_out-1,status='confirmed' where code='TIME-TEST'");
      assert.equal((await db.query("select bhk_expire_holds() result")).rows[0].result.completed,1);
      assert.equal((await db.query("select bhk_request_payout($1) result",[host])).rows[0].result.amount,1000);
    });
    const {rows}=await db.query(`select bhk_checkout_timestamp('2030-01-01','11:00 AM')= '2030-01-01 05:30+00'::timestamptz as morning,
      bhk_checkout_timestamp('2030-01-01','unknown')='2030-01-01 18:30+00'::timestamptz as fallback`);
    assert.equal(rows[0].morning,true); assert.equal(rows[0].fallback,true);
  } finally { await db.close(); }
});
