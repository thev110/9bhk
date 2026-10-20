import test from 'node:test';
import assert from 'node:assert/strict';
import { migratedDatabase, asRole } from './helpers/database.mjs';

test('offers preserve revisions and require current buyer/seller decisions with conflict checks',async()=>{
 const db=await migratedDatabase();
 try {
  const seller='00000000-0000-0000-0000-000000000071',buyer='00000000-0000-0000-0000-000000000072',other='00000000-0000-0000-0000-000000000073';
  await db.query("insert into auth.users(id,email) values($1,'offer-seller@example.test'),($2,'offer-buyer@example.test'),($3,'offer-other@example.test')",[seller,buyer,other]);
  await db.query("insert into bhk_properties(id,host_id,name,bedrooms,price,status,is_for_sale) values('offer-estate',$1,'Estate',3,1000,'published',true)",[seller]);
  let id;
  await asRole(db,'authenticated',buyer,async()=>{
   id=(await db.query("select bhk_submit_sales_offer('offer-estate',500000000,'cash_self_reported','Subject to inspection',current_date+30,now()+interval '7 days') id")).rows[0].id;
   await assert.rejects(db.query("select bhk_decide_sales_offer($1,1,'accepted','Self approve')",[id]),/not authorized/i);
   await assert.rejects(db.query("update bhk_sales_offer_revisions set price_paise=1 where offer_id=$1",[id]),/permission denied/i);
   assert.equal((await db.query("select bhk_revise_sales_offer($1,1,510000000,'cash_self_reported','Subject to inspection',current_date+30,now()+interval '7 days') version",[id])).rows[0].version,2);
   assert.equal((await db.query('select * from bhk_sales_offer_revisions where offer_id=$1',[id])).rows.length,2);
  });
  await asRole(db,'authenticated',other,async()=>{
   assert.equal((await db.query('select * from bhk_sales_offers')).rows.length,0);
   assert.equal((await db.query('select * from bhk_sales_offer_revisions')).rows.length,0);
   await assert.rejects(db.query("select bhk_decide_sales_offer($1,2,'accepted','Other seller')",[id]),/unavailable/i);
  });
  await asRole(db,'authenticated',seller,async()=>{
   await assert.rejects(db.query("select bhk_decide_sales_offer($1,1,'accepted','Old revision')",[id]),/reload/i);
   await db.query("select bhk_decide_sales_offer($1,2,'accepted','Terms accepted for further transaction work')",[id]);
   await assert.rejects(db.query("select bhk_decide_sales_offer($1,2,'rejected','Repeat')",[id]),/already closed/i);
   assert.equal((await db.query('select * from bhk_sales_offer_events where offer_id=$1',[id])).rows.length,3);
  });
 } finally {await db.close();}
});
