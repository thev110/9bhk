import test from "node:test";
import assert from "node:assert/strict";
import { migratedDatabase, asRole } from "./helpers/database.mjs";

test("migrations execute and enforce account, publication, payment and location boundaries", async () => {
  const db = await migratedDatabase();
  try {
    const guest = "00000000-0000-0000-0000-000000000001";
    const host = "00000000-0000-0000-0000-000000000002";
    await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'guest@example.test',now()),($2,'host@example.test',now())", [guest,host]);
    await db.query("insert into public.bhk_properties(id,host_id,name,bedrooms,guests,price,cleaning,address,status) values('test-estate',$1,'Test estate',3,6,1000,200,'Private gate address','published')", [host]);
    await assert.rejects(db.query("insert into bhk_properties(id,host_id,name,bedrooms,status) values('too-small',$1,'Two bedrooms',2,'published')",[host]),/three bedrooms/i);
    await asRole(db,"anon",null, async () => {
      const { rows } = await db.query("select * from public.bhk_public_properties where id='test-estate'");
      assert.equal(rows.length,1);
      assert.equal("address" in rows[0],false);
      assert.equal("host_id" in rows[0],false);
      await assert.rejects(db.query("select address from public.bhk_properties"), /permission denied/i);
    });
    await asRole(db,"authenticated",host, async () => {
      await assert.rejects(db.query("insert into public.bhk_properties(id,host_id,name,bedrooms,status) values('self-published',$1,'Self published',3,'published')", [host]), /staff|publish/i);
      await assert.rejects(db.query("update public.bhk_properties set verification_status='verified' where id='test-estate'"), /staff|verification|published content/i);
      await assert.rejects(db.query("update public.bhk_profiles set verified_broker=true where id=$1",[host]), /staff|verification/i);
    });
    await asRole(db,"authenticated",guest, async () => {
      await assert.rejects(db.query("insert into public.bhk_bookings(code,property_id,property_name,guest_id,guest_name,guest_email,check_in,check_out,total,status) values('FAKE','test-estate','Test estate',$1,'Guest','guest@example.test','2030-01-10','2030-01-12',1,'confirmed')",[guest]), /permission denied/i);
      await assert.rejects(db.query("insert into public.bhk_property_documents(property_id,host_id,kind,storage_path,file_name,mime_type,size_bytes) values('test-estate',$1,'ownership_proof',$2,'proof.pdf','application/pdf',100)",[guest,`${guest}/proof.pdf`]), /owned|ownership|policy|security/i);
    });
    const { rows } = await db.query("select conname from pg_constraint where conname='bhk_bookings_no_overlap'");
    assert.equal(rows.length,1);
  } finally { await db.close(); }
});

test("server holds, captured settlement, replay, cancellation and group privacy execute in PostgreSQL", async () => {
  const db = await migratedDatabase();
  try {
    const guest = "00000000-0000-0000-0000-000000000011";
    const host = "00000000-0000-0000-0000-000000000012";
    const outsider = "00000000-0000-0000-0000-000000000013";
    await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'payer@example.test',now()),($2,'owner@example.test',now()),($3,'other@example.test',now())",[guest,host,outsider]);
    await db.query("insert into bhk_properties(id,host_id,name,bedrooms,guests,price,cleaning,deposit,tax_rate,platform_fee_rate,min_stay,status) values('transaction-estate',$1,'Transaction estate',3,6,1000,200,500,0.1,0.1,2,'published')",[host]);
    const hold = await asRole(db,"service_role",null,async () => {
      const { rows } = await db.query("select bhk_prepare_booking($1,'transaction-estate',current_date+20,current_date+22,2,0,'Payer','payer@example.test','9840012345') result",[guest]);
      return rows[0].result;
    });
    assert.equal(hold.quote.total,3140);
    await asRole(db,"authenticated",guest,async () => {
      await assert.rejects(db.query("update bhk_bookings set total=1,status='confirmed' where id=$1",[hold.bookingId]), /permission denied/i);
      await assert.rejects(db.query("select bhk_capture_payment('forged','fake',1,'INR','fake',now())"), /permission denied/i);
    });
    await asRole(db,"service_role",null,async () => {
      await assert.rejects(db.query("select bhk_prepare_booking($1,'transaction-estate',current_date+20,current_date+22,2,0,'Other','other@example.test','9840012345')",[outsider]), /reserved|overlap/i);
      const intent = (await db.query("select bhk_claim_order($1,'booking',$2,null) result",[guest,hold.bookingId])).rows[0].result;
      assert.equal(Number(intent.amount_paise),314000);
      await db.query("select bhk_bind_order($1,'order_test')",[intent.id]);
      await assert.rejects(db.query("select bhk_capture_payment('order_test','pay_test',1,'INR','event_test',now())"), /match/i);
      const settled = (await db.query("select bhk_capture_payment('order_test','pay_test',314000,'INR','event_test',now()) result")).rows[0].result;
      assert.equal(settled.status,"confirmed");
      const replay = (await db.query("select bhk_capture_payment('order_test','pay_test',314000,'INR','event_test',now()) result")).rows[0].result;
      assert.equal(replay.status,"confirmed");
      await assert.rejects(db.query("select bhk_create_split($1,$2,array['Friend'])",[guest,hold.bookingCode]), /paid|fund|split|awaiting/i);
      await db.query("select bhk_cancel_booking($1,$2,false)",[guest,hold.bookingCode]);
      await db.query("select bhk_cancel_booking($1,$2,false)",[guest,hold.bookingCode]);
      const refunds = (await db.query("select amount from bhk_refund_requests where booking_id=$1",[hold.bookingId])).rows;
      assert.equal(refunds.length,1);
      assert.equal(refunds[0].amount,3140);
    });
    let plan;
    await asRole(db,"authenticated",guest,async () => {
      plan=(await db.query("insert into bhk_group_plans(owner_id,name) values($1,'Private weekend') returning id",[guest])).rows[0].id;
      await db.query("insert into bhk_group_shortlist(plan_id,property_id,added_by) values($1,'transaction-estate',$2)",[plan,guest]);
      await db.query("insert into bhk_group_votes(plan_id,property_id,user_id,vote) values($1,'transaction-estate',$2,true)",[plan,guest]);
    });
    await asRole(db,"authenticated",outsider,async () => {
      assert.equal((await db.query("select * from bhk_group_shortlist where plan_id=$1",[plan])).rows.length,0);
      await assert.rejects(db.query("insert into bhk_group_votes(plan_id,property_id,user_id,vote) values($1,'transaction-estate',$2,true)",[plan,outsider]),/policy|security/i);
      await assert.rejects(db.query("insert into bhk_booking_messages(booking_id,sender_id,body) values($1,$2,'Unauthorized message')",[hold.bookingId,outsider]),/policy|security/i);
    });
  } finally { await db.close(); }
});
