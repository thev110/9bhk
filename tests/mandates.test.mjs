import test from "node:test";
import assert from "node:assert/strict";
import { migratedDatabase, asRole } from "./helpers/database.mjs";

test("mandates require current owner approval, honor windows and revocation without exposing raw properties", async () => {
 const db=await migratedDatabase();
 try {
  const owner='00000000-0000-0000-0000-000000000081', broker='00000000-0000-0000-0000-000000000082', stranger='00000000-0000-0000-0000-000000000083';
  await db.query("insert into auth.users(id,email) values($1,'mandate-owner@example.test'),($2,'mandate-broker@example.test'),($3,'mandate-other@example.test')",[owner,broker,stranger]);
  await db.query("insert into bhk_properties(id,host_id,name,bedrooms,guests,price,address,status) values('mandate-property',$1,'Private estate',3,6,1000,'Private address','published')",[owner]);
  await db.query("insert into bhk_broker_subscriptions(user_id,expires_at,payment_id) values($1,now()+interval '30 days','mandate-test')",[broker]);
  let mandate;
  const can=async (cap)=> (await db.query("select bhk_my_property_capability('mandate-property',$1) allowed",[cap])).rows[0].allowed;
  await asRole(db,'authenticated',broker,async()=>{
   mandate=(await db.query("select bhk_request_mandate('mandate-property',array['marketing','viewings'],now(),now()+interval '7 days') id")).rows[0].id;
   assert.equal(await can('marketing'),false);
   await assert.rejects(db.query("select bhk_decide_mandate($1,true)",[mandate]),/unavailable/i);
   await assert.rejects(db.query("update bhk_property_mandates set status='approved' where id=$1",[mandate]),/permission denied/i);
   await assert.rejects(db.query("select bhk_property_capability($1,'mandate-property','marketing')",[broker]),/permission denied/i);
  });
  await asRole(db,'authenticated',stranger,async()=>{
   assert.equal((await db.query('select * from bhk_property_mandates')).rows.length,0);
   await assert.rejects(db.query('select bhk_decide_mandate($1,true)',[mandate]),/unavailable/i);
   await assert.rejects(db.query('select bhk_revoke_mandate($1)',[mandate]),/unavailable/i);
  });
  await asRole(db,'authenticated',owner,()=>db.query('select bhk_decide_mandate($1,true)',[mandate]));
  await asRole(db,'authenticated',broker,async()=>{
   assert.equal(await can('marketing'),true);
   assert.equal(await can('documents'),false);
   assert.equal((await db.query("select address from bhk_properties where id='mandate-property'")).rows.length,0);
  });
  await db.query("update bhk_property_mandates set starts_at=now()+interval '1 day' where id=$1",[mandate]);
  await asRole(db,'authenticated',broker,async()=>assert.equal(await can('marketing'),false));
  await db.query("update bhk_property_mandates set starts_at=now()-interval '2 days',expires_at=now()-interval '1 day' where id=$1",[mandate]);
  await asRole(db,'authenticated',broker,async()=>assert.equal(await can('marketing'),false));
  await db.query("update bhk_property_mandates set expires_at=now()+interval '1 day' where id=$1",[mandate]);
  await asRole(db,'authenticated',owner,()=>db.query('select bhk_revoke_mandate($1)',[mandate]));
  await asRole(db,'authenticated',broker,async()=>assert.equal(await can('marketing'),false));
  await asRole(db,'authenticated',owner,async()=>await assert.rejects(db.query('select bhk_decide_mandate($1,true)',[mandate]),/already decided/i));
  await asRole(db,'anon',null,async()=>await assert.rejects(db.query("select bhk_my_property_capability('mandate-property','marketing')"),/permission denied/i));
 } finally { await db.close(); }
});
