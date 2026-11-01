import test from "node:test";
import assert from "node:assert/strict";
import { migratedDatabase, asRole } from "./helpers/database.mjs";
import {
  resolvePortalFromHost,
  isCanonicalPortalHost,
  resolveSubdomainLandingPath,
  resolveCrossPortalRedirect,
  summarizeCategoryKyc,
} from "../lib/portal-domains.ts";

test("4-subdomain host routing maps www, realtor, owners, and admin hosts accurately", () => {
  assert.equal(resolvePortalFromHost("www.9bhk.app"), "guest");
  assert.equal(resolvePortalFromHost("9bhk.app"), "guest");
  assert.equal(resolvePortalFromHost("realtor.9bhk.app"), "realtor");
  assert.equal(resolvePortalFromHost("realtor.localhost:3000"), "realtor");
  assert.equal(resolvePortalFromHost("owners.9bhk.app"), "owners");
  assert.equal(resolvePortalFromHost("owners.localhost:3000"), "owners");
  assert.equal(resolvePortalFromHost("admin.9bhk.app"), "admin");
  assert.equal(resolvePortalFromHost("admin.localhost:3000"), "admin");

  assert.equal(isCanonicalPortalHost("www.9bhk.app", "www.9bhk.app"), true);
  assert.equal(isCanonicalPortalHost("realtor.9bhk.app", "www.9bhk.app"), true);
  assert.equal(isCanonicalPortalHost("owners.9bhk.app", "www.9bhk.app"), true);
  assert.equal(isCanonicalPortalHost("admin.9bhk.app", "www.9bhk.app"), true);
  assert.equal(isCanonicalPortalHost("9bhk.app", "www.9bhk.app"), false);

  assert.equal(resolveSubdomainLandingPath("www.9bhk.app", "/"), null);
  assert.equal(resolveSubdomainLandingPath("realtor.9bhk.app", "/"), "/realtor");
  assert.equal(resolveSubdomainLandingPath("owners.9bhk.app", "/"), "/host");
  assert.equal(resolveSubdomainLandingPath("admin.9bhk.app", "/"), "/admin");
  assert.equal(resolveSubdomainLandingPath("realtor.9bhk.app", "/buy"), null);

  assert.equal(resolveCrossPortalRedirect("www.9bhk.app", "/realtor"), "https://realtor.9bhk.app");
  assert.equal(resolveCrossPortalRedirect("www.9bhk.app", "/host"), "https://owners.9bhk.app");
  assert.equal(resolveCrossPortalRedirect("www.9bhk.app", "/host/new"), "https://owners.9bhk.app/host/new");
  assert.equal(resolveCrossPortalRedirect("www.9bhk.app", "/admin"), "https://admin.9bhk.app");
  assert.equal(resolveCrossPortalRedirect("realtor.9bhk.app", "/login"), "https://realtor.9bhk.app/");
  assert.equal(resolveCrossPortalRedirect("owners.9bhk.app", "/profile"), "https://owners.9bhk.app/");
  assert.equal(resolveCrossPortalRedirect("admin.9bhk.app", "/login"), "https://admin.9bhk.app/");
  assert.equal(resolveCrossPortalRedirect("127.0.0.1:3000", "/realtor"), null);
});

test("summarizeCategoryKyc enforces all mandatory documents per portal category", () => {
  const partialRealtor = summarizeCategoryKyc("realtor", [
    { kind: "rera_certificate", status: "verified" },
    { kind: "realtor_pan", status: "pending" },
  ]);
  assert.equal(partialRealtor.verified, false);
  assert.equal(partialRealtor.verifiedCount, 1);
  assert.equal(partialRealtor.totalRequired, 3);
  assert.deepEqual(partialRealtor.missingKinds, ["realtor_pan", "agency_proof"]);

  const completeRealtor = summarizeCategoryKyc("realtor", [
    { kind: "rera_certificate", status: "verified" },
    { kind: "realtor_pan", status: "verified" },
    { kind: "agency_proof", status: "verified" },
  ]);
  assert.equal(completeRealtor.verified, true);
  assert.equal(completeRealtor.verifiedCount, 3);
  assert.deepEqual(completeRealtor.missingKinds, []);
});

test("bhk_kyc_documents enforces RLS, staff-only verification, and automatic RERA broker sync", async () => {
  const db = await migratedDatabase();
  try {
    const guestId = "00000000-0000-0000-0000-000000000101";
    const realtorId = "00000000-0000-0000-0000-000000000102";
    const sellerId = "00000000-0000-0000-0000-000000000103";
    const buyerId = "00000000-0000-0000-0000-000000000104";
    const staffId = "00000000-0000-0000-0000-000000000199";

    await db.query(
      `insert into auth.users(id, email, email_confirmed_at) values
        ($1, 'guest@example.test', now()),
        ($2, 'realtor@example.test', now()),
        ($3, 'seller@example.test', now()),
        ($4, 'buyer@example.test', now()),
        ($5, 'rathnavelkarthi1@gmail.com', now())`,
      [guestId, realtorId, sellerId, buyerId, staffId],
    );

    await db.query(
      `insert into public.bhk_profiles(id, email, full_name, role) values
        ($1, 'guest@example.test', 'Guest User', 'guest'),
        ($2, 'realtor@example.test', 'Realtor User', 'realtor'),
        ($3, 'seller@example.test', 'Seller User', 'seller'),
        ($4, 'buyer@example.test', 'Buyer User', 'buyer'),
        ($5, 'rathnavelkarthi1@gmail.com', 'Staff Admin', 'admin')
      on conflict (id) do update
        set email = excluded.email,
            full_name = excluded.full_name,
            role = excluded.role`,
      [guestId, realtorId, sellerId, buyerId, staffId],
    );

    // 1. Realtor uploads 3 mandatory KYC documents; cannot self-verify or forge another user's storage_path
    await asRole(db, "authenticated", realtorId, async () => {
      await assert.rejects(
        db.query(
          `insert into public.bhk_kyc_documents(user_id, category, kind, storage_path, file_name, mime_type, size_bytes, status)
           values ($1, 'realtor', 'rera_certificate', $2, 'rera.pdf', 'application/pdf', 2048, 'verified')`,
          [realtorId, `${realtorId}/kyc/realtor/rera_certificate-rera.pdf`],
        ),
        /staff-only/i,
      );

      await assert.rejects(
        db.query(
          `insert into public.bhk_kyc_documents(user_id, category, kind, storage_path, file_name, mime_type, size_bytes)
           values ($1, 'realtor', 'rera_certificate', $2, 'rera.pdf', 'application/pdf', 2048)`,
          [realtorId, `${guestId}/kyc/realtor/rera_certificate-rera.pdf`],
        ),
        /authenticated user folder/i,
      );

      for (const kind of ["rera_certificate", "realtor_pan", "agency_proof"]) {
        await db.query(
          `insert into public.bhk_kyc_documents(user_id, category, kind, storage_path, file_name, mime_type, size_bytes)
           values ($1, 'realtor', $2, $3, $4, 'application/pdf', 4096)`,
          [
            realtorId,
            kind,
            `${realtorId}/kyc/realtor/${kind}-doc.pdf`,
            `${kind}.pdf`,
          ],
        );
      }

      const { rows: checkBefore } = await db.query(
        `select public.bhk_category_kyc_verified($1, 'realtor') as ok`,
        [realtorId],
      );
      assert.equal(checkBefore[0].ok, false);
    });

    // 2. Guest cannot read Realtor's KYC documents
    await asRole(db, "authenticated", guestId, async () => {
      const { rows } = await db.query(
        `select * from public.bhk_kyc_documents where user_id = $1`,
        [realtorId],
      );
      assert.equal(rows.length, 0);
    });

    // 3. Staff verifies all 3 Realtor KYC docs -> triggers automatic verified_broker = true
    await asRole(db, "authenticated", staffId, async () => {
      await db.query(
        `update public.bhk_kyc_documents
         set status = 'verified', reviewer_note = 'Verified RERA credentials'
         where user_id = $1 and category = 'realtor'`,
        [realtorId],
      );
    });

    const { rows: profileAfterVerify } = await db.query(
      `select verified_broker from public.bhk_profiles where id = $1`,
      [realtorId],
    );
    assert.equal(profileAfterVerify[0].verified_broker, true);

    await asRole(db, "authenticated", realtorId, async () => {
      const { rows: checkAfter } = await db.query(
        `select public.bhk_category_kyc_verified($1, 'realtor') as ok`,
        [realtorId],
      );
      assert.equal(checkAfter[0].ok, true);

      // 4. Realtor replaces one document -> status resets to pending and verified_broker drops back to false
      await db.query(
        `update public.bhk_kyc_documents
         set file_name = 'updated-rera.pdf', size_bytes = 8192
         where user_id = $1 and kind = 'rera_certificate'`,
        [realtorId],
      );
    });

    const { rows: profileAfterReplace } = await db.query(
      `select verified_broker from public.bhk_profiles where id = $1`,
      [realtorId],
    );
    assert.equal(profileAfterReplace[0].verified_broker, false);
  } finally {
    await db.close();
  }
});
