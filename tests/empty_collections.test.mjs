import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { migratedDatabase } from "./helpers/database.mjs";

const HUBS = { "app/villas/page.tsx": "villas", "app/farmhouses/page.tsx": "farmhouses", "app/beach-houses/page.tsx": "beachHouses", "app/locations/page.tsx": "locations" };

test("header-linked collection hubs render an empty state (200, noindex) instead of 404", () => {
  for (const [file, key] of Object.entries(HUBS)) {
    const src = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(src, /if \(!(scoped|summaries)\.length\) notFound\(\)/, file);
    assert.match(src, new RegExp(`CollectionEmptyState titleKey="collection\\.emptyTitle\\.${key}"`), file);
    assert.match(src, /robots: \{ index: false, follow: true \}/, file);
  }
  const keys = ["collection.emptyTitle.villas", "collection.emptyTitle.farmhouses", "collection.emptyTitle.beachHouses",
    "collection.emptyTitle.locations", "collection.emptyBody", "collection.emptyCta", "collection.emptyBrowse"];
  for (const file of ["lib/i18n/en.ts", "lib/i18n/ta/core.ts", "lib/i18n/te/core.ts"]) {
    const src = fs.readFileSync(file, "utf8");
    for (const k of keys) assert.ok(src.includes(`"${k}":`), `${file} ${k}`);
  }
  assert.match(fs.readFileSync("components/seo/collection-empty.tsx", "utf8"), /href="\/host\/new"/);
});

test("grant hardening migration leaves anon/authenticated read-only on the listing table and views, and is idempotent", async () => {
  const db = await migratedDatabase();
  try {
    const sql = fs.readFileSync("supabase/migrations/20261020990000_review_grant_hardening.sql", "utf8");
    await db.exec(sql); // second run: no-op, no error
    const objs = ["bhk_properties", "bhk_public_properties", "bhk_public_listing_facts", "bhk_public_listing_media", "bhk_public_listing_occasions"];
    for (const o of objs) {
      const { rows } = await db.query(`select has_table_privilege('anon','public.${o}','INSERT,UPDATE,DELETE,TRUNCATE') aw,
        has_table_privilege('authenticated','public.${o}','INSERT,UPDATE,DELETE,TRUNCATE') uw`);
      assert.equal(rows[0].aw, false, `anon write ${o}`);
      if (o !== "bhk_properties") assert.equal(rows[0].uw, false, `authenticated write ${o}`);
    }
    const { rows } = await db.query("select has_table_privilege('anon','public.bhk_public_properties','SELECT') s, has_table_privilege('authenticated','public.bhk_properties','INSERT') hi");
    assert.deepEqual([rows[0].s, rows[0].hi], [true, true]);
  } finally {
    await db.close();
  }
});
