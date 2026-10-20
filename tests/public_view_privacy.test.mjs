import test from "node:test";
import assert from "node:assert/strict";
import { migratedDatabase, asRole } from "./helpers/database.mjs";

test("public listings view exposes is_verified/verified_at, never the reviewer id; anon is read-only", async () => {
  const db = await migratedDatabase();
  try {
    const staff = "00000000-0000-0000-0000-000000000a01";
    const host = "00000000-0000-0000-0000-000000000a02";
    await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'staff@example.test',now()),($2,'host@example.test',now())", [staff, host]);
    await db.query(`insert into bhk_properties(id,host_id,name,bedrooms,guests,price,cleaning,status,verification_status,verification_type,verification_date,verified_by) values
      ('reviewed-estate',$1,'Reviewed estate',3,6,1000,200,'published','verified','Ownership proof reviewed','2026-10-01',$2),
      ('claimed-estate',$1,'Claimed estate',3,6,1000,200,'published','verified',null,'2026-10-01',null),
      ('plain-estate',$1,'Plain estate',3,6,1000,200,'published','unverified',null,null,null)`, [host, staff]);

    const cols = (await db.query("select column_name from information_schema.columns where table_schema='public' and table_name='bhk_public_properties'")).rows.map(r => r.column_name);
    for (const hidden of ["verified_by", "verification_type", "verification_status", "verification_date", "host_id", "address"]) assert.equal(cols.includes(hidden), false, hidden);
    assert.ok(cols.includes("is_verified") && cols.includes("verified_at") && cols.includes("bookable"));

    await asRole(db, "anon", null, async () => {
      const { rows } = await db.query("select * from bhk_public_properties where id like '%-estate' order by id");
      assert.deepEqual(rows.map(r => [r.id, r.is_verified, r.verified_at && new Date(r.verified_at).toISOString().slice(0, 10)]),
        [["claimed-estate", false, null], ["plain-estate", false, null], ["reviewed-estate", true, "2026-10-01"]]);
      assert.equal(JSON.stringify(rows).includes(staff), false);
      await assert.rejects(db.query("update bhk_public_properties set name='x' where id='plain-estate'"), /permission denied/i);
      await assert.rejects(db.query("delete from bhk_public_properties where id='plain-estate'"), /permission denied/i);
      await assert.rejects(db.query("insert into bhk_public_properties(id,name,bedrooms) values('anon-estate','x',3)"), /permission denied/i);
      await assert.rejects(db.query("select verified_by from bhk_properties"), /permission denied/i);
    });
    for (const role of ["anon", "authenticated", "service_role"]) {
      const { rows } = await db.query(`select has_table_privilege($1,'public.bhk_public_properties','SELECT') s,
        has_table_privilege($1,'public.bhk_public_properties','INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') w`, [role]);
      assert.deepEqual([rows[0].s, rows[0].w], [true, false], role);
    }
    // The two policies that depend on the view survived the drop/recreate.
    const pol = (await db.query("select polname from pg_policy where polname in ('trial_terms_public','seller_questions_public') order by 1")).rows.map(r => r.polname);
    assert.deepEqual(pol, ["seller_questions_public", "trial_terms_public"]);
  } finally {
    await db.close();
  }
});
