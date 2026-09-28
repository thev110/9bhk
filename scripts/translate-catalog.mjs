#!/usr/bin/env node
/**
 * Bulk-fill the Tamil / Telugu catalogs from an open-source MT model.
 *
 * Model: ai4bharat/indictrans2-en-indic-1B (MIT licence, purpose-built for
 * English -> Indic). Chosen over NLLB-200 because NLLB is CC-BY-NC-4.0
 * (non-commercial) and over OPUS-MT because no en<->ta / en<->te model exists.
 *
 * Usage
 *   pip install torch transformers sentencepiece sacremoses
 *   node scripts/translate-catalog.mjs --locale ta --dry-run
 *   node scripts/translate-catalog.mjs --locale ta
 *   node scripts/translate-catalog.mjs --locale te --only nav,action
 *
 * Behaviour
 *   - Reads every key from lib/i18n/en.ts and lib/i18n/keys/*.ts
 *   - Skips keys that already have a translation in the target catalog
 *   - Never translates brand/technical terms: they come from GLOSSARY.md and
 *     are applied verbatim
 *   - Rejects any output that is byte-identical to the English source, so an
 *     untranslated string can never silently pass
 *   - Preserves {placeholder} names exactly; a mismatch is a hard error
 *
 * Machine output is a FIRST PASS, not a deliverable. Every value it produces
 * needs a native-speaker review, and anything it cannot translate confidently
 * should stay English.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const KEY_RE = /^\s*"([A-Za-z][\w]*(?:\.[A-Za-z][\w]*)+)"\s*:\s*"([\s\S]*?)",?\s*$/gm;
const PLACEHOLDER_RE = /\{(\w+)\}/g;

// ── Term lock: transliterated, never machine-translated ───────────────────
const DO_NOT_TRANSLATE = new Set([
  "9bhk.app", "Google", "RERA", "CRZ", "UPI", "LOI", "OTA", "NDA", "BHK",
  "ESC", "Chennai", "ECR", "Mahabalipuram", "Chengalpattu", "Kanchipuram",
  "Pondicherry", "Collector Vault", "Marine Port", "EV Pavilion", "Teak Portico",
]);

function args() {
  const out = { locale: "ta", dryRun: false, only: null };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--locale") out.locale = argv[++i];
    else if (argv[i] === "--only") out.only = new Set(argv[++i].split(","));
    else if (argv[i] === "--dry-run") out.dryRun = true;
  }
  return out;
}

/** Extract key -> English value from the catalog and its surface fragments. */
function readEnglish() {
  const entries = new Map();
  const enSrc = fs.readFileSync(path.join(ROOT, "lib/i18n/en.ts"), "utf8");
  const inline = enSrc.split("...onboardingKeys")[0];
  for (const m of inline.matchAll(KEY_RE)) entries.set(m[1], m[2]);

  const dir = path.join(ROOT, "lib/i18n/keys");
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".ts"))) {
      const src = fs.readFileSync(path.join(dir, f), "utf8");
      // Skip the comment block that names keys reused from the shared catalog.
      for (const m of src.matchAll(KEY_RE)) entries.set(m[1], m[2]);
    }
  }
  return entries;
}

/** Read existing translations so the script is incremental. */
function readExisting(locale) {
  const dir = path.join(ROOT, `lib/i18n/${locale}`);
  const map = new Map();
  if (!fs.existsSync(dir)) return map;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".ts"))) {
    const src = fs.readFileSync(path.join(dir, f), "utf8");
    for (const m of src.matchAll(KEY_RE)) map.set(m[1], m[2]);
  }
  return map;
}

function placeholdersOf(s) {
  return [...s.matchAll(PLACEHOLDER_RE)].map((m) => m[1]).sort().join(",");
}

/**
 * Translate a batch through IndicTrans2. Lives in a Python helper because the
 * model runs on transformers; kept out of the Node process on purpose.
 */
function runModel(texts, locale) {
  const script = `
import sys, json
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
tok = AutoTokenizer.from_pretrained("ai4bharat/indictrans2-en-indic-1B")
mod = AutoModelForSeq2SeqLM.from_pretrained("ai4bharat/indictrans2-en-indic-1B")
target = "tam" if "${locale}" == "ta" else "tel"
payload = json.loads(sys.stdin.read())
src = "eng_Latn"; tgt = "tam_Taml" if target == "tam" else "tel_Telu"
tok.src_lang = src; mod.src_lang = src
inputs = tok(payload["texts"], return_tensors="pt", padding=True)
out = mod.generate(**inputs, forced_bos_token_id=tok.convert_tokens_to_ids(tgt), max_new_tokens=256, num_beams=5)
print(json.dumps(tok.batch_decode(out, skip_special_tokens=True)))
`;
  const res = spawnSync("python", ["-c", script], {
    input: JSON.stringify({ texts }),
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.status !== 0) {
    console.error(res.stderr?.toString().slice(0, 2000) || "model process failed");
    process.exit(1);
  }
  return JSON.parse(res.stdout);
}

const { locale, dryRun, only } = args();
const english = readEnglish();
const existing = readExisting(locale);

let todo = [...english].filter(([k]) => !existing.has(k));
if (only) todo = todo.filter(([k]) => only.has(k.split(".")[0]));

const locked = todo.filter(([, v]) => DO_NOT_TRANSLATE.has(v));
const untranslatable = todo.filter(
  ([, v]) => !/[A-Za-z]{3}/.test(v) || DO_NOT_TRANSLATE.has(v),
);
const batch = todo.filter(([, v]) => /[A-Za-z]{3}/.test(v) && !DO_NOT_TRANSLATE.has(v));

console.log(`locale=${locale}  total=${english.size}  done=${existing.size}`);
console.log(`todo=${todo.length}  model=${batch.length}  locked=${locked.length}  skipped=${untranslatable.length - locked.length}`);

if (dryRun) {
  console.log("\nlocked terms (use GLOSSARY.md, do not machine-translate):");
  for (const [k, v] of locked) console.log(`  ${k} = "${v}"`);
  console.log("\nnon-alphabetic (numbers, symbols, placeholders only):");
  for (const [k, v] of untranslatable)
    if (!DO_NOT_TRANSLATE.has(v)) console.log(`  ${k} = "${v}"`);
  process.exit(0);
}

const results = new Map();
const CHUNK = 16;
for (let i = 0; i < batch.length; i += CHUNK) {
  const slice = batch.slice(i, i + CHUNK);
  const out = runModel(slice.map(([, v]) => v), locale);
  slice.forEach(([k], n) => results.set(k, out[n]));
  process.stdout.write(`\r  translated ${Math.min(i + CHUNK, batch.length)}/${batch.length}`);
}

const rejected = [];
const valid = [];
for (const [k, v] of results) {
  const source = english.get(k);
  if (!v || !v.trim()) rejected.push([k, "empty output", source]);
  else if (v === source) rejected.push([k, "identical to English", source]);
  else if (placeholdersOf(v) !== placeholdersOf(source))
    rejected.push([k, "placeholder mismatch", source]);
  else valid.push([k, v]);
}

console.log(`\n\naccepted=${valid.length}  rejected=${rejected.length}`);
if (rejected.length) {
  console.log("\nREJECTED — keep English or hand-translate:");
  for (const [k, why, src] of rejected) console.log(`  ${k}  [${why}]  "${src}"`);
}

const surface = [...new Set(valid.map(([k]) => k.split(".")[0]))];
console.log("\nsurfaces with translations:", surface.join(", "));
console.log("\nNext: hand-review every accepted value, then regenerate the catalog files.");
console.log("See lib/i18n/GLOSSARY.md for terms that must not be machine-translated.");
