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

/**
 * Translations live one file per surface under lib/i18n/<locale>/, so that
 * parallel authoring does not collide and each surface stays reviewable.
 * Reading them as text keeps this test free of a TS loader.
 */
function readLocale(locale) {
  const dir = path.resolve(`lib/i18n/${locale}`);
  const map = new Map();
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".ts"))) {
      for (const m of fs.readFileSync(path.join(dir, f), "utf8").matchAll(KEY_LINE)) {
        map.set(m[1], m[2]);
      }
    }
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
    const translated = readLocale(locale);
    const unknown = [...translated.keys()].filter((key) => !english.has(key));
    assert.deepEqual(
      unknown,
      [],
      `${locale} translations reference keys that do not exist: ${unknown.join(", ")}`,
    );

    console.log(`  [i18n] ${locale}: ${translated.size}/${total} translated`);
    assert.ok(translated.size <= total, `${locale} reports more keys than the catalog has`);
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
    const overrides = readLocale(locale);
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

test("every catalog key has a Tamil and a Telugu translation", () => {
  // The completeness gate. If a key falls through to English, selecting that
  // language silently renders mixed output — which is the failure mode this
  // whole feature exists to prevent, so it must fail loudly.
  const expected = [...english.keys()];
  const report = [];
  const gaps = [];

  for (const locale of ["ta", "te"]) {
    const dir = path.resolve(`lib/i18n/${locale}`);
    const have = new Set();

    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".ts"))) {
        for (const m of fs.readFileSync(path.join(dir, f), "utf8").matchAll(KEY_LINE)) {
          have.add(m[1]);
        }
      }
    }
    for (const key of readLocale(locale).keys()) have.add(key);

    const missing = expected.filter((k) => !have.has(k));
    const unknown = [...have].filter((k) => !english.has(k));

    report.push(
      `  ${locale}: ${have.size}/${expected.length} translated` +
        (missing.length ? ` — ${missing.length} MISSING` : " — complete"),
    );
    if (unknown.length) report.push(`    unknown keys: ${unknown.join(", ")}`);
    if (missing.length) {
      const bySurface = {};
      for (const k of missing) (bySurface[k.split(".")[0]] ||= []).push(k);
      report.push(
        `    by surface: ${Object.entries(bySurface)
          .map(([s, ks]) => `${s} (${ks.length})`)
          .join(", ")}`,
      );
      gaps.push(`${locale} is missing ${missing.length} keys`);
    }
  }

  console.log(report.join("\n"));
  assert.deepEqual(gaps, [], `\nIncomplete translations:\n${report.join("\n")}`);
});

test("translated values keep the same {placeholders} as English", () => {
  // Tamil and Telugu are verb-final, so a translator can legitimately move a
  // placeholder — but it must never be renamed or dropped, or the substitution
  // silently leaves the raw token in the UI.
  const names = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
  const problems = [];

  for (const locale of ["ta", "te"]) {
    const dir = path.resolve(`lib/i18n/${locale}`);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".ts"))) {
      for (const m of fs.readFileSync(path.join(dir, f), "utf8").matchAll(KEY_LINE)) {
        const [, key, value] = m;
        const base = english.get(key);
        if (!base) continue;
        if (names(value) !== names(base)) {
          problems.push(`${locale} "${key}": got {${names(value)}}, want {${names(base)}}`);
        }
      }
    }
  }

  assert.deepEqual(problems, [], `Placeholder mismatches:\n  ${problems.join("\n  ")}`);
});

test("Tamil files contain no Telugu text, and vice versa", () => {
  // Parallel authoring makes it easy to write a Telugu string into the Tamil
  // fragment. Neither language can substitute for the other at runtime, so
  // this is invisible in testing and obvious to a user.
  const SCRIPT = {
    tamil: (cp) => (cp >= 0x0b80 && cp <= 0x0bff) || cp === 0x0964 || cp === 0x0965,
    telugu: (cp) => (cp >= 0x0c00 && cp <= 0x0c7f) || cp === 0x0964 || cp === 0x0965,
    // Scripts that have no business appearing at all.
    foreign: (cp) =>
      (cp >= 0x0900 && cp <= 0x097f) || // Devanagari
      (cp >= 0x0980 && cp <= 0x09ff) || // Bengali
      (cp >= 0x0a80 && cp <= 0x0aff) || // Gujarati
      (cp >= 0x0c80 && cp <= 0x0cff) || // Kannada
      (cp >= 0x0d00 && cp <= 0x0d7f), //   Malayalam
  };
  const EXPECTED = { ta: "tamil", te: "telugu" };
  // U+200C/U+200D are correct Indic orthography (ZWNJ/ZWJ) and appear in both.
  const isJoiner = (cp) => cp === 0x200c || cp === 0x200d;
  const isSymbol = (cp) =>
    cp <= 0x7f || "₹°·–—…→▲⌘#%+&<>/'\"".includes(String.fromCodePoint(cp));

  const problems = [];
  let checked = 0;

  for (const locale of ["ta", "te"]) {
    const own = SCRIPT[EXPECTED[locale]];
    const other = SCRIPT[locale === "ta" ? "telugu" : "tamil"];
    const dir = path.resolve(`lib/i18n/${locale}`);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".ts"))) {
      for (const m of fs.readFileSync(path.join(dir, f), "utf8").matchAll(KEY_LINE)) {
        const [, key, value] = m;
        checked++;
        for (const ch of value) {
          const cp = ch.codePointAt(0);
          if (cp === 0xfffd) {
            problems.push(`${locale} "${key}": U+FFFD replacement character`);
          } else if (SCRIPT.foreign(cp)) {
            problems.push(`${locale} "${key}": foreign script U+${cp.toString(16).toUpperCase()}`);
          } else if (!own(cp) && other(cp)) {
            const otherName = locale === "ta" ? "telugu" : "tamil";
            problems.push(`${locale} "${key}": ${otherName} character U+${cp.toString(16).toUpperCase()}`);
          } else if (!own(cp) && !other(cp) && !isJoiner(cp) && !isSymbol(cp)) {
            problems.push(`${locale} "${key}": unexpected U+${cp.toString(16).toUpperCase()}`);
          }
        }
      }
    }
  }

  assert.deepEqual(problems, [], `Script problems:\n  ${problems.slice(0, 25).join("\n  ")}`);
  assert.ok(checked > 0, "expected to inspect at least one translated value");
});
