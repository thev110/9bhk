import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) return { url: pathToFileURL(path.resolve(`${specifier.slice(2)}.ts`)).href, shortCircuit: true };
  return nextResolve(specifier, context);
} });
const { hasStaffVerification } = await import("../lib/verification.ts");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|txt)$/.test(entry.name)) out.push(full);
  }
  return out;
}
const COPY = [...walk("app"), ...walk("components"), ...walk("lib/i18n"), ...walk("lib/content"), ...walk("lib/seo"),
  "public/llms.txt", "public/llms-full.txt"];

test("no percentage fee, commission or markup claims in user-facing copy", () => {
  const offenders = [];
  for (const file of COPY) {
    const text = fs.readFileSync(file, "utf8");
    for (const m of text.matchAll(/\d+(?:\.\d+)?\s?%[^\n"]{0,40}?(fee|commission|markup|co-brok)|(fee|commission|markup)[^\n"]{0,25}?\d+(?:\.\d+)?\s?%/gi)) offenders.push(`${file}: ${m[0]}`);
  }
  assert.deepEqual(offenders, []);
});

test("marketing copy never claims 'verified' on its own", () => {
  const files = ["lib/seo/keywords.ts", "lib/content/guides.ts", "app/about/page.tsx", "app/creators/page.tsx", "app/credits/page.tsx", "public/llms-full.txt"];
  for (const file of files) assert.doesNotMatch(fs.readFileSync(file, "utf8"), /verif/i, file);
});

test("Verified requires a recorded staff review (status, reviewer and date)", () => {
  assert.equal(hasStaffVerification({}), false);
  assert.equal(hasStaffVerification({ verification: { status: "unverified" } }), false);
  assert.equal(hasStaffVerification({ verification: { status: "verified" } }), false);
  assert.equal(hasStaffVerification({ verification: { status: "verified", date: "2026-10-01" } }), false);
  assert.equal(hasStaffVerification({ verification: { status: "verified", date: "2026-10-01", verifiedBy: "00000000-0000-0000-0000-000000000001" } }), true);
});
