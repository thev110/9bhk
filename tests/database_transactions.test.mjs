import test from "node:test";
import assert from "node:assert/strict";
import { migratedDatabase, asRole } from "./helpers/database.mjs";

test("split funding is immutable, captured once, and expired payments queue exact refunds", async () => {
  const db = await migratedDatabase();
  const guest="00000000-0000-0000-0000-000000000101", host="00000000-0000-0000-0000-000000000102";
  try {
    await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'split@example.test',now()),($2,'host@example.test',now())",[guest,host]);
    await db.query("insert into bhk_properties(id,host_id,name,guests,bedrooms,price,deposit,tax_rate,min_stay,status) values('split-test',$1,'Split stay',6,3,1000,1,0,1,'published')",[host]);
    await asRole(db,"service_role",null,async () => {
      const hold=(await db.query("select bhk_prepare_booking($1,'split-test',current_date+60,current_date+63,2,0,'Organiser','split@example.test','9840012345') result",[guest])).rows[0].result;
      const shares=(await db.query("select bhk_create_split($1,$2,array['Organiser','Friend','Guest']) result",[guest,hold.bookingCode])).rows[0].result;
      assert.deepEqual(shares.map(s=>s.amount),[1001,1000,1000]);
      await assert.rejects(db.query("select bhk_create_split($1,$2,array['Replacement','Friend'])",[guest,hold.bookingCode]),/fixed|started/i);
      await assert.rejects(db.query("select bhk_claim_order($1,'booking',$2,null)",[guest,hold.bookingId]),/split/i);
      const first=(await db.query("select bhk_claim_order($1,'share',$2,$3) result",[guest,hold.bookingId,shares[0].id])).rows[0].result;
      await db.query("select bhk_bind_order($1,'order_split_0')",[first.id]);
      assert.equal((await db.query("select bhk_capture_payment('order_split_0','pay_split_0',100100,'INR','event_split_0',now()) result")).rows[0].result.status,"awaiting");
      await assert.rejects(db.query("select bhk_claim_order($1,'share',$2,$3)",[guest,hold.bookingId,shares[0].id]),/paid|payable/i);
      const second=(await db.query("select bhk_claim_order($1,'share',$2,$3) result",[guest,hold.bookingId,shares[1].id])).rows[0].result;
      await db.query("select bhk_bind_order($1,'order_split_1')",[second.id]);
      await db.query("update bhk_bookings set hold_expires_at=now()-interval '1 minute' where id=$1",[hold.bookingId]);
      await db.query("select bhk_expire_holds()");
      const booking=(await db.query("select status,refund_status from bhk_bookings where id=$1",[hold.bookingId])).rows[0];
      assert.deepEqual(booking,{status:"cancelled",refund_status:"requested"});
      assert.equal((await db.query("select amount from bhk_refund_requests where booking_id=$1",[hold.bookingId])).rows[0].amount,1001);
      assert.equal((await db.query("select bhk_capture_payment('order_split_1','pay_split_1',100000,'INR','event_split_1',now()) result")).rows[0].result.status,"refund_requested");
      await db.query("select bhk_capture_payment('order_split_1','pay_split_1',100000,'INR','event_split_1',now())");
      assert.equal(Number((await db.query("select sum(amount) amount from bhk_refund_requests where booking_id=$1",[hold.bookingId])).rows[0].amount),2001);
      assert.equal((await db.query("select status from bhk_bookings where id=$1",[hold.bookingId])).rows[0].status,"cancelled");
    });
    await asRole(db,"authenticated",guest,async () => { await assert.rejects(db.query("update bhk_split_shares set paid=true"),/permission denied/i); });
  } finally { await db.close(); }
});

test("server pricing uses seasonal/weekend rates; completion, payout, subscription and stale-order retries persist", async () => {
  const db=await migratedDatabase();
  const guest="00000000-0000-0000-0000-000000000111", host="00000000-0000-0000-0000-000000000112";
  try {
    await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'rates@example.test',now()),($2,'host@example.test',now())",[guest,host]);
    await db.query("insert into bhk_properties(id,host_id,name,guests,bedrooms,price,weekend_price,cleaning,deposit,tax_rate,platform_fee_rate,min_stay,status) values('rates-test',$1,'Rates stay',6,3,1000,2000,100,500,0.1,0.1,1,'published')",[host]);
    await db.query("insert into bhk_property_rates(property_id,host_id,start_date,end_date,nightly_price) values('rates-test',$1,'2030-01-06','2030-01-07',3000)",[host]);
    await asRole(db,"service_role",null,async()=>{
      const hold=(await db.query("select bhk_prepare_booking($1,'rates-test','2030-01-05','2030-01-08',2,0,'Guest','rates@example.test','9840012345') result",[guest])).rows[0].result;
      assert.equal(hold.quote.stay,6000); assert.equal(hold.quote.platformFee,600); assert.equal(hold.quote.tax,670); assert.equal(hold.total,7870);
      await assert.rejects(db.query("select bhk_prepare_booking($1,'rates-test','2030-02-01','2030-02-02',7,0,'Guest','rates@example.test','9840012345')",[guest]),/capacity/i);
      const intent=(await db.query("select bhk_claim_order($1,'booking',$2,null) result",[guest,hold.bookingId])).rows[0].result;
      await db.query("update bhk_payment_orders set created_at=now()-interval '3 minutes' where id=$1",[intent.id]);
      const retry=(await db.query("select bhk_claim_order($1,'booking',$2,null) result",[guest,hold.bookingId])).rows[0].result;
      assert.notEqual(retry.id,intent.id);
      await assert.rejects(db.query("select bhk_bind_order($1,'order_stale')",[intent.id]),/bound/i);
      await db.query("select bhk_bind_order($1,'order_rates')",[retry.id]);
      await db.query("select bhk_capture_payment('order_rates','pay_rates',787000,'INR','event_rates',now())");
      // Simulate time passing without changing trusted pricing/payment records.
      await db.query("update bhk_bookings set check_in=current_date-3,check_out=current_date-1 where id=$1",[hold.bookingId]);
      await db.query("select bhk_expire_holds()");
      assert.equal((await db.query("select status from bhk_bookings where id=$1",[hold.bookingId])).rows[0].status,"completed");
      const payout=(await db.query("select bhk_request_payout($1) result",[host])).rows[0].result;
      assert.equal(payout.amount,6100); assert.equal(payout.status,"requested");
      await assert.rejects(db.query("select bhk_request_payout($1)",[host]),/eligible/i);
      const subscription=(await db.query("select bhk_claim_order($1,'subscription',null,null) result",[guest])).rows[0].result;
      assert.equal(Number(subscription.amount_paise),50000);
      await db.query("select bhk_bind_order($1,'order_subscription')",[subscription.id]);
      await db.query("select bhk_capture_payment('order_subscription','pay_subscription',50000,'INR','event_subscription',now())");
      await db.query("select bhk_capture_payment('order_subscription','pay_subscription',50000,'INR','event_subscription',now())");
      assert.equal((await db.query("select status from bhk_broker_subscriptions where user_id=$1 and expires_at>now()+interval '27 days'",[guest])).rows[0].status,"active");
      await assert.rejects(db.query("select bhk_claim_order($1,'subscription',null,null)",[guest]),/active/i);
    });
  } finally { await db.close(); }
});

test("host cancellation queues full captured refund; staff can read bookings but cannot forge settlement", async () => {
  const db=await migratedDatabase();
  const guest="00000000-0000-0000-0000-000000000121", host="00000000-0000-0000-0000-000000000122", staff="00000000-0000-0000-0000-000000000123";
  try {
    await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'cancellation@example.test',now()),($2,'host@example.test',now()),($3,'rathnavelkarthi1@gmail.com',now())",[guest,host,staff]);
    await db.query("insert into bhk_properties(id,host_id,name,guests,bedrooms,price,tax_rate,min_stay,status) values('host-cancel-test',$1,'Cancel stay',6,3,1000,0,1,'published')",[host]);
    let hold;
    await asRole(db,"service_role",null,async()=>{
      hold=(await db.query("select bhk_prepare_booking($1,'host-cancel-test',current_date+60,current_date+62,2,0,'Guest','cancellation@example.test','9840012345') result",[guest])).rows[0].result;
      const intent=(await db.query("select bhk_claim_order($1,'booking',$2,null) result",[guest,hold.bookingId])).rows[0].result;
      await db.query("select bhk_bind_order($1,'order_host_cancel')",[intent.id]);
      await db.query("select bhk_capture_payment('order_host_cancel','pay_host_cancel',200000,'INR','event_host_cancel',now())");
      const result=(await db.query("select bhk_cancel_booking($1,$2,false) result",[host,hold.bookingCode])).rows[0].result;
      assert.equal(result.refundStatus,"requested");
      const request=(await db.query("select amount,reason,requested_by from bhk_refund_requests where booking_id=$1",[hold.bookingId])).rows[0];
      assert.equal(request.amount,2000); assert.match(request.reason,/host cancellation.*full/i); assert.equal(request.requested_by,host);
    });
    await asRole(db,"authenticated",staff,async()=>{
      assert.equal((await db.query("select code from bhk_bookings where id=$1",[hold.bookingId])).rows.length,1);
      await assert.rejects(db.query("update bhk_bookings set total=1 where id=$1",[hold.bookingId]),/permission denied/i);
    });
  } finally { await db.close(); }
});
