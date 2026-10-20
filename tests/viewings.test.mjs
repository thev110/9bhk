import test from "node:test";
import assert from "node:assert/strict";
import { viewingInput } from "../lib/viewings.ts";
import { migratedDatabase, asRole } from "./helpers/database.mjs";

test("viewing input preserves notes and rejects malformed contacts", () => {
  const input = {propertyId:"sale", buyerName:" Buyer ", buyerPhone:"+91 98765 43210", notes:"Weekends please"};
  assert.equal(viewingInput(input).notes, input.notes);
  assert.equal(viewingInput(input).buyerName, "Buyer");
  for (const bad of [{buyerName:""}, {buyerPhone:"--------"}, {buyerEmail:"bad"}, {notes:"x".repeat(4001)}]) {
    assert.throws(() => viewingInput({...input,...bad}));
  }
});

test("viewing enquiry uses live sale property, authenticated buyer, and scoped access", async () => {
  const db = await migratedDatabase();
  const buyer="00000000-0000-0000-0000-000000000201", owner="00000000-0000-0000-0000-000000000202", other="00000000-0000-0000-0000-000000000203";
  try {
    await db.query("insert into auth.users(id) values($1),($2),($3)",[buyer,owner,other]);
    await db.query("insert into bhk_properties(id,host_id,name,bedrooms,status,is_for_sale) values('view-sale',$1,'Authoritative name',3,'published',true),('view-stay',$1,'Stay only',3,'published',false)",[owner]);
    await asRole(db,"anon",null,async()=>assert.rejects(db.query("select bhk_request_viewing('view-sale','Buyer','9876543210')"),/permission denied/i));
    await asRole(db,"authenticated",buyer,async()=>{
      await assert.rejects(db.query("select bhk_request_viewing('view-stay','Buyer','9876543210')"),/not available/i);
      await db.query("select bhk_request_viewing('view-sale','Buyer','9876543210',null,'Weekend please')");
      const row=(await db.query("select * from bhk_viewing_requests")).rows[0];
      assert.equal(row.user_id,buyer); assert.equal(row.property_name,"Authoritative name"); assert.equal(row.notes,"Weekend please");
      await assert.rejects(db.query("select bhk_request_viewing('view-sale','Buyer','9876543210')"),/pending enquiry/i);
      await assert.rejects(db.query("insert into bhk_viewing_requests(property_id,property_name,buyer_name,buyer_phone) values('fake','Fake','Fake','9876543210')"),/permission denied/i);
    });
    await asRole(db,"authenticated",other,async()=>assert.equal((await db.query("select * from bhk_viewing_requests")).rows.length,0));
    await asRole(db,"authenticated",owner,async()=>assert.equal((await db.query("select * from bhk_viewing_requests")).rows.length,1));
  } finally { await db.close(); }
});
