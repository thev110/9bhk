import test from "node:test";
import assert from "node:assert/strict";
import { migratedDatabase } from "./helpers/database.mjs";

// Service-role-only RPCs must not be executable by the public API roles, even
// with Supabase's explicit default EXECUTE grants to anon/authenticated.
const SERVICE_ONLY = [
  "bhk_capture_service_payment", "bhk_record_service_payout", "bhk_record_service_refund",
  "bhk_claim_service_payout", "bhk_claim_service_refund", "bhk_claim_service_order",
  "bhk_bind_service_order", "bhk_queue_service_refunds", "bhk_expire_service_checkouts",
  "bhk_prepare_occasion_booking", "bhk_discovery_quotes", "bhk_stay_quote",
  "bhk_prepare_booking", "bhk_claim_order", "bhk_capture_payment",
];

test("anon and authenticated cannot execute service-role-only RPCs", async () => {
  const db = await migratedDatabase();
  try {
    const { rows } = await db.query(`
      select p.proname, has_function_privilege('anon', p.oid, 'execute') anon,
             has_function_privilege('authenticated', p.oid, 'execute') authed
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = any($1)`, [SERVICE_ONLY]);
    assert.ok(rows.length >= SERVICE_ONLY.length - 1, `expected functions to exist, found ${rows.length}`);
    const leaks = rows.filter(r => r.anon || r.authed).map(r => r.proname);
    assert.deepEqual(leaks, []);
  } finally { await db.close(); }
});
