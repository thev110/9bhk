import test from "node:test";
import assert from "node:assert/strict";
import { explainPropertyMatch, duplicateClientSuggestions, dueWorklist } from "../lib/crm.ts";
import { migratedDatabase, asRole } from "./helpers/database.mjs";

test("CRM matches explain budget units, missing evidence and requirements", () => {
  const requirements = { purpose: "buy", budgetMin: 2, budgetMax: 5, city: "Chennai", bedrooms: 3 };
  const property = { id: "p", forSale: true, forRent: true, salePriceCr: 4, city: "chennai", bedrooms: 4 };
  assert.equal(explainPropertyMatch(requirements, property).eligible, true);
  assert.equal(explainPropertyMatch(requirements, { ...property, salePriceCr: undefined }).eligible, false);
  assert.equal(explainPropertyMatch(requirements, { ...property, bedrooms: 2 }).eligible, false);
  assert.equal(explainPropertyMatch(requirements, { ...property, forSale: false }).eligible, false);
  assert.match(explainPropertyMatch({ purpose: "rent", budgetMin: 1000, budgetMax: 3000 }, { ...property, nightlyRate: 2000 }).reasons.join(" "), /fees.*quote/);
  assert.throws(() => explainPropertyMatch({ ...requirements, budgetMax: NaN }, property));
});
test("duplicate suggestions never match blank identities or infer country codes", () => {
  const contacts = [{ id: "a", email: " A@example.test ", phone: "+91 98400 12345" }, { id: "b", phone: "9840012345" }, { id: "c", email: "" }];
  assert.deepEqual(duplicateClientSuggestions({ id: "new", email: "a@example.test", phone: "+919840012345" }, contacts), [{ id: "a", reasons: ["Same email address", "Same phone number"] }]);
  assert.deepEqual(duplicateClientSuggestions({ id: "new" }, contacts), []);
  assert.equal(contacts.length, 3);
});
test("daily CRM worklist includes overdue tasks and respects exclusive local day end", () => {
  const tasks = [{ id: "a", due_at: "2030-01-02T00:00:00+05:30", completed_at: null }, { id: "b", due_at: "2030-01-01T10:00:00+05:30", completed_at: null }, { id: "c", due_at: "2029-12-31T10:00:00Z", completed_at: null }, { id: "d", due_at: "2030-01-01T10:00:00Z", completed_at: "2030-01-01T11:00:00Z" }];
  assert.deepEqual(dueWorklist(tasks, "2030-01-02T00:00:00+05:30").map(t => t.id), ["c", "b"]);
});
test("CRM persists owned leads, rejects cross-account mutations and records valid versioned transitions", async () => {
  const db = await migratedDatabase();
  try {
    const owner = "00000000-0000-0000-0000-000000000091", other = "00000000-0000-0000-0000-000000000092";
    await db.query("insert into auth.users(id,email) values($1,'crm@example.test'),($2,'othercrm@example.test')", [owner,other]);
    const client = (await db.query("insert into bhk_realtor_clients(realtor_id,name,phone) values($1,'Client','9840012345') returning id", [owner])).rows[0].id;
    await asRole(db,"authenticated",owner,async () => {
      await assert.rejects(db.query("select bhk_crm_create($1,'Enquiry','buy')",[client]), /subscription/i);
    });
    await db.query("insert into bhk_broker_subscriptions(user_id,expires_at,payment_id) values($1,now()+interval '30 days','crm-test')",[owner]);
    let opportunity, task;
    await asRole(db,"authenticated",owner,async () => {
      opportunity = (await db.query("select bhk_crm_create($1,'Enquiry','buy') id",[client])).rows[0].id;
      await assert.rejects(db.query("update bhk_crm_opportunities set stage='won' where id=$1",[opportunity]), /permission denied/i);
      await assert.rejects(db.query("select bhk_crm_transition($1,1,'won','Skip')",[opportunity]), /Invalid stage/i);
      await assert.rejects(db.query("select bhk_crm_transition($1,1,'contacted','')",[opportunity]), /check constraint/i);
      assert.equal((await db.query("select bhk_crm_transition($1,1,'contacted','Called client') version",[opportunity])).rows[0].version,2);
      await assert.rejects(db.query("select bhk_crm_transition($1,1,'qualified','Stale')",[opportunity]), /reload/i);
      task = (await db.query("select bhk_crm_add_task($1,'Follow up',now()+interval '1 day') id",[opportunity])).rows[0].id;
      assert.equal((await db.query("select * from bhk_crm_stage_history")).rows.length,2);
    });
    await asRole(db,"authenticated",other,async () => {
      assert.equal((await db.query("select * from bhk_crm_opportunities")).rows.length,0);
      assert.equal((await db.query("select * from bhk_crm_tasks")).rows.length,0);
      assert.equal((await db.query("select * from bhk_crm_stage_history")).rows.length,0);
      await assert.rejects(db.query("select bhk_crm_create($1,'Stolen','buy')",[client]), /unavailable/i);
      await assert.rejects(db.query("select bhk_crm_transition($1,2,'qualified','Stolen')",[opportunity]), /unavailable/i);
      await assert.rejects(db.query("select bhk_crm_update_details($1,2,'Stolen','','cash')",[opportunity]), /unavailable/i);
      await assert.rejects(db.query("select bhk_crm_complete_task($1)",[task]), /unavailable/i);
    });
    await asRole(db,"anon",null,async () => {
      await assert.rejects(db.query("select bhk_crm_create($1,'Anon','buy')",[client]), /permission denied/i);
    });
    await asRole(db,"authenticated",owner,async () => {
      assert.equal((await db.query("select bhk_crm_update_details($1,2,'Updated','Within three months','loan_needed') version",[opportunity])).rows[0].version,3);
      await assert.rejects(db.query("select bhk_crm_update_details($1,2,'Stale','','cash')",[opportunity]), /reload/i);
      await db.query("select bhk_crm_complete_task($1)",[task]);
      const before = (await db.query("select completed_at from bhk_crm_tasks where id=$1",[task])).rows[0].completed_at;
      await db.query("select bhk_crm_complete_task($1)",[task]);
      assert.deepEqual((await db.query("select completed_at from bhk_crm_tasks where id=$1",[task])).rows[0].completed_at,before);
    });
  } finally { await db.close(); }
});
