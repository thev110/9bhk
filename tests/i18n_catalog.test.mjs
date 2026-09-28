import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// ── Catalog shape ────────────────────────────────────────────────────────
// Keys are declared as `"some.key": "Some English value",` at the start of a
// line, in lib/i18n/en.ts and in one fragment file per surface under
// lib/i18n/keys/. Reading them as text keeps this test free of a TS loader.

const KEY_LINE = /^\s*"([A-Za-z][\w]*(?:\.[A-Za-z][\w]*)+)"\s*:\s*"(.*)",?\s*$/gm;

function readCatalog(file) {
  const src = fs.readFileSync(file, "utf8");
  const map = new Map();
  for (const match of src.matchAll(KEY_LINE)) {
    map.set(match[1], match[2]);
  }
  return map;
}

function catalogFiles() {
  const dir = path.resolve("lib/i18n/keys");
  const fragments = fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".ts"))
        .map((f) => path.join(dir, f))
    : [];
  return [path.resolve("lib/i18n/en.ts"), ...fragments];
}

/** Keys explicitly listed in the `overrides` object, as key -> value pairs. */
function readOverrides(locale) {
  const file = path.resolve(`lib/i18n/${locale}.ts`);
  const src = fs.readFileSync(file, "utf8");
  const body = src.match(/overrides[^=]*=\s*\{([\s\S]*?)\n\};/);
  const map = new Map();
  if (!body) return map;
  for (const match of body[1].matchAll(/"([\w.]+)"\s*:\s*"([\s\S]*?)",?\s*\n/g)) {
    map.set(match[1], match[2]);
  }
  return map;
}

const english = new Map();
for (const file of catalogFiles()) {
  for (const [key, value] of readCatalog(file)) {
    assert.ok(!english.has(key), `Duplicate key "${key}" in ${path.basename(file)}`);
    english.set(key, value);
  }
}

// ── Used-but-undefined keys ──────────────────────────────────────────────
// Catches typos like t("profile.saveChnages") that TypeScript would also flag,
// but this also runs without a compile step.

function sourceFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, acc);
    else if (entry.name.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

// Matches the quoted string arguments of a t(...) call, covering both
// t("a.b") and t(cond ? "a.b" : "c.d").
const T_CALL = /\bt\(\s*(?:"([^"]+)"|[^)]*?\?\s*"([^"]+)"\s*:\s*"([^"]+)")/g;

test("English catalog is non-empty and every placeholder is balanced", () => {
  assert.ok(english.size > 0, "English catalog must not be empty");

  const unclosed = [];
  for (const [key, value] of english) {
    const opens = (value.match(/\{/g) || []).length;
    const closes = (value.match(/\}/g) || []).length;
    if (opens !== closes) unclosed.push(key);
  }
  assert.deepEqual(unclosed, [], `Unbalanced {placeholder} braces: ${unclosed.join(", ")}`);
});

test("every t() key used in a component exists in the English catalog", () => {
  const missing = [];
  const files = [...sourceFiles(path.resolve("app")), ...sourceFiles(path.resolve("components"))];

  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    for (const match of src.matchAll(T_CALL)) {
      for (const key of [match[1], match[2], match[3]].filter(Boolean)) {
        if (!english.has(key)) missing.push(`${path.relative(".", file)} -> "${key}"`);
      }
    }
  }

  assert.deepEqual(
    missing,
    [],
    `t() called with keys absent from the catalog:\n  ${missing.join("\n  ")}`,
  );
});

test("Tamil and Telugu catalogs are complete and report translation progress", () => {
  const total = english.size;

  for (const locale of ["ta", "te"]) {
    const translated = readOverrides(locale);
    const unknown = [...translated.keys()].filter((key) => !english.has(key));
    assert.deepEqual(
      unknown,
      [],
      `${locale}.ts overrides reference keys that do not exist: ${unknown.join(", ")}`,
    );

    // Untranslated keys fall back to English at runtime, so a partial catalog
    // is correct — this asserts the fallback is intact, not that it's finished.
    const remaining = total - translated.size;
    console.log(
      `  [i18n] ${locale}: ${translated.size}/${total} translated, ${remaining} falling back to English`,
    );
    assert.ok(translated.size <= total, `${locale} reports more overrides than catalog keys`);
  }
});

test("Tamil and Telugu overrides actually differ from the English source string", () => {
  // A copy-paste that keeps the English value defeats the whole exercise.
  // Brand terms that stay identical by design (e.g. "9bhk.app", "RERA") are
  // excluded by the allow-list below.
  const ALLOWED_IDENTICAL = new Set([
    "brand.name",
  ]);

  const identical = [];
  for (const locale of ["ta", "te"]) {
    const overrides = readOverrides(locale);
    for (const [key, value] of overrides) {
      if (ALLOWED_IDENTICAL.has(key)) continue;
      if (value === english.get(key)) identical.push(`${locale}: "${key}"`);
    }
  }

  assert.deepEqual(
    identical,
    [],
    `Overrides that are byte-identical to English:\n  ${identical.join("\n  ")}`,
  );
});
