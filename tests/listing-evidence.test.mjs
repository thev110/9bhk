import test from "node:test";
import assert from "node:assert/strict";
import { migratedDatabase, asRole } from "./helpers/database.mjs";
import { validateListingFact, hasReviewedFeature, listingQuality } from "../lib/listing-evidence.ts";

test("evidence helpers distinguish supplied, missing, expired and reviewed facts", () => {
  const input = { property_id: "villa", fact_key: "step_free_access", value: true, source_label: "Owner measurement", observed_on: "2026-01-01", media_id: "media" };
  validateListingFact(input, "2026-01-02");
  for (const patch of [{ value: "yes" }, { observed_on: "2026-02-30" }, { observed_on: "2027-01-01" }, { fact_key: "beds", value: -1 }]) {
    assert.throws(() => validateListingFact({ ...input, ...patch }, "2026-01-02"));
  }
  const fact = { ...input, review_status: "reviewed", review_scope: "Entrance route only", reviewed_at: "2026-01-01T00:00:00Z", expires_at: "2026-06-01T00:00:00Z" };
  const now = Date.parse("2026-02-01");
  assert.equal(hasReviewedFeature([fact], "step_free_access", now), true);
  for (const patch of [{ value: false }, { review_status: "supplied" }, { media_id: null }, { expires_at: "2026-01-02" }, { review_scope: null }]) {
    assert.equal(hasReviewedFeature([{ ...fact, ...patch }], "step_free_access", now), false);
  }
  assert.equal(hasReviewedFeature([], "step_free_access", now), false);
  assert.equal(listingQuality([], []).supplied, 0);
  assert.equal(listingQuality([], [{ ...fact, value: false, review_status: "supplied" }]).supplied, 1);
});

test("listing evidence enforces ownership, scoped reviews, publication and invalidation in PostgreSQL", async () => {
  const db = await migratedDatabase();
  try {
    const owner = "00000000-0000-0000-0000-000000000201";
    const other = "00000000-0000-0000-0000-000000000202";
    const staff = "00000000-0000-0000-0000-000000000203";
    await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'owner-evidence@example.test',now()),($2,'other-evidence@example.test',now()),($3,'rathnavelkarthi1@gmail.com',now())", [owner, other, staff]);
    await db.query("insert into bhk_properties(id,host_id,name,bedrooms,status) values('evidence-estate',$1,'Evidence estate',3,'published'),('evidence-draft',$1,'Draft',3,'draft'),('other-estate',$2,'Other',3,'published')", [owner, other]);
    let media;
    await asRole(db, "authenticated", owner, async () => {
      media = (await db.query("insert into bhk_listing_media(property_id,kind,url,room_label) values('evidence-estate','accessible_route','https://example.test/route.jpg','Entrance') returning id")).rows[0].id;
      await db.query("insert into bhk_listing_facts(property_id,fact_key,value,source_label,observed_on,media_id) values('evidence-estate','step_free_access','true','Measured entrance',current_date,$1)", [media]);
      await db.query("insert into bhk_listing_facts(property_id,fact_key,value,source_label,observed_on) values('evidence-draft','beds','3','Owner',current_date)");
      await db.query("insert into bhk_listing_occasions values('evidence-estate','shoot','approval_required','Ask owner about hours')");
      await assert.rejects(db.query("update bhk_listing_facts set review_status='reviewed'"), /permission denied/i);
      await assert.rejects(db.query("select bhk_review_listing_fact('evidence-estate','step_free_access','reviewed','Entrance',now()+interval '1 month')"), /staff/i);
      await assert.rejects(db.query("insert into bhk_listing_facts(property_id,fact_key,value,source_label,observed_on) values('evidence-estate','parking_spaces','-1','Owner',current_date)"), /check constraint/i);
    });
    await asRole(db, "authenticated", other, async () => {
      assert.equal((await db.query("select * from bhk_listing_facts where property_id='evidence-estate'")).rows.length, 0);
      await assert.rejects(db.query("insert into bhk_listing_facts(property_id,fact_key,value,source_label,observed_on,media_id) values('other-estate','pool_fenced','true','Owner',current_date,$1)", [media]), /foreign key/i);
      assert.equal((await db.query("update bhk_listing_media set caption='Tampered' where id=$1 returning id", [media])).rows.length, 0);
    });
    await asRole(db, "authenticated", staff, async () => {
      await db.query("select bhk_review_listing_fact('evidence-estate','step_free_access','reviewed','Photographed entrance route only',now()+interval '1 month')");
    });
    await asRole(db, "anon", null, async () => {
      await assert.rejects(db.query("select * from bhk_listing_facts"), /permission denied/i);
      const facts = (await db.query("select * from bhk_public_listing_facts")).rows;
      assert.equal(facts.length, 1);
      assert.equal(facts[0].review_status, "reviewed");
      assert.equal("reviewed_by" in facts[0], false);
      assert.equal((await db.query("select * from bhk_public_listing_occasions")).rows[0].permission, "approval_required");
    });
    await asRole(db, "authenticated", owner, async () => {
      await db.query("update bhk_listing_media set caption='New route' where id=$1", [media]);
      assert.equal((await db.query("select review_status from bhk_listing_facts where property_id='evidence-estate'")).rows[0].review_status, "supplied");
    });
    await asRole(db, "authenticated", staff, async () => {
      await db.query("select bhk_review_listing_fact('evidence-estate','step_free_access','reviewed','Updated entrance route',now()+interval '1 month')");
    });
    await asRole(db, "authenticated", owner, async () => {
      // Same fields PostgREST sends for an upsert are permitted; a content edit resets review.
      await db.query("insert into bhk_listing_facts(property_id,fact_key,value,source_label,observed_on,media_id) values('evidence-estate','step_free_access','false','Owner correction',current_date,$1) on conflict(property_id,fact_key) do update set property_id=excluded.property_id,fact_key=excluded.fact_key,value=excluded.value,source_label=excluded.source_label,observed_on=excluded.observed_on,media_id=excluded.media_id", [media]);
      const fact = (await db.query("select * from bhk_listing_facts where property_id='evidence-estate'")).rows[0];
      assert.equal(fact.review_status, "supplied");
      assert.equal(fact.reviewed_at, null);
      assert.equal((await db.query("select * from bhk_listing_fact_reviews")).rows.length, 2);
      await assert.rejects(db.query("delete from bhk_listing_fact_reviews"), /permission denied/i);
    });
    await db.query("update bhk_listing_facts set review_status='reviewed',review_scope='Old review',reviewed_by=$1,reviewed_at=now()-interval '2 months',expires_at=now()-interval '1 month' where property_id='evidence-estate'", [staff]);
    assert.equal((await db.query("select review_status from bhk_public_listing_facts")).rows[0].review_status, "expired");
    await db.query("update bhk_properties set guests=10 where id='evidence-estate'");
    assert.equal((await db.query("select review_status from bhk_listing_facts where property_id='evidence-estate'")).rows[0].review_status, "supplied");
  } finally { await db.close(); }
});
