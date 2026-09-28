# i18n — adding Tamil & Telugu

9bhk ships in English, Tamil and Telugu. English is the source of truth; the
other two fall back to it, so the app is never blank or broken while a
translation is still missing.

## How it works

| File | Role |
|---|---|
| `lib/i18n/en.ts` | The catalog. Every user-facing string in the app lives here. |
| `lib/i18n/keys/*.ts` | One English fragment per surface (`host`, `realtor`, `admin`, …), merged into `en`. |
| `lib/i18n/ta/*.ts` | Tamil translations, one file per surface. |
| `lib/i18n/te/*.ts` | Telugu translations, one file per surface. |
| `lib/i18n/ta.ts`, `te.ts` | Merge the surface fragments and fall back to English. |
| `lib/i18n/GLOSSARY.md` | Binding terminology. Read it before translating anything. |
| `lib/i18n/use-t.ts` | The `useT()` hook. |
| `lib/i18n/t.ts` | Key resolution and `{placeholder}` interpolation. |
| `lib/i18n/garage.ts` | Shared garage-type vocabulary. |
| `lib/i18n/vibes.ts` | Display labels for the search tokens in `VIBES`/`FILTERS`. |
| `scripts/translate-catalog.mjs` | Bulk machine-translation via IndicTrans2. |

There is no `[locale]` route segment and no middleware. The locale lives on the
existing `StoreProvider`, persists to `localStorage`, syncs to
`bhk_profiles.locale`, and updates `<html lang>` on change so screen readers
announce the right language. Switching is instant and does not reload.

## Adding a string

1. Add the key to the right file (`lib/i18n/en.ts`, or the surface fragment in
   `lib/i18n/keys/`). Namespaces are dot-separated: `nav.`, `auth.`,
   `property.`, `realtor.`, `host.`, `admin.`.
2. Use it in the component:

```tsx
const t = useT();
t("realtor.addClient");                       // no interpolation
t("greeting", { name: "Vikram" });            // -> "Welcome, Vikram"
```

` t()` is typed as `keyof typeof en`, so a missing or misspelled key is a
**TypeScript error**, not a runtime blank.

```bash
npm run typecheck   # catches undefined and duplicate keys
npm test            # catalog parity, placeholder balance, translation progress
```

## Translating

Translations live in `lib/i18n/<locale>/<surface>.ts`, one file per surface,
each exporting the same keys. That layout means parallel work on different
surfaces does not collide.

```ts
// lib/i18n/ta/host.ts
import type { Dict } from "../en";

export const taHost = {
  "host.workspace": "ஹோஸ்ட் பணியிடம்",
} as const satisfies Partial<Dict>;
```

Read `GLOSSARY.md` first — it fixes the word for every recurring term so the
app does not read like four different people wrote it. Anything marked
`// REVIEW:` in a translation file is a known-weak term awaiting a native pass.

`npm test` gates on all of the following and fails if any break:

- every key in the English catalog has a translation in **both** languages —
  a gap renders a mixed-language UI, which is worse than an untranslated one
- no translation is byte-identical to its English source
- every `{placeholder}` survives, by name, in both languages
- no duplicate keys across the English fragments

```bash
npm test           # prints  [i18n] ta: 818/818 translated
npm run typecheck
```

### Machine translation

`scripts/translate-catalog.mjs` bulk-fills missing keys using
[`ai4bharat/indictrans2-en-indic-1B`](https://huggingface.co/ai4bharat/indictrans2-en-indic-1B)
— MIT licensed, purpose-built for English → Indic.

```bash
pip install torch transformers sentencepiece sacremoses
npm run i18n:translate -- --locale ta --dry-run   # show what would change
npm run i18n:translate -- --locale ta             # do it
```

It refuses output identical to English, treats placeholder mismatches as hard
errors, and never machine-translates the Rule 1 terms. Its output is a **first
pass, not a deliverable** — review it.

If you reach for a different model, note:

- **OPUS-MT has no `en↔ta` or `en↔te` model at all.** It is the usual
  recommendation and it does not apply here.
- **Argos Translate ships no `en→ta` / `en→te` packages.**
- **NLLB-200 covers both, but is CC-BY-NC-4.0** — non-commercial, so not
  usable for this product.

## What must not be translated

- **Listing content** — property names, blurbs, amenity lists in
  `lib/properties.ts`. This is host-authored content that lives in the
  database, not UI chrome. Per-listing translatable fields are a separate piece
  of work; those strings stay English until then.
- **Proper nouns and registrations** — RERA, CRZ, LOI, ECR, agency names.
- **City names** in `lib/format.ts` (`CITIES`).
- **Language names** in the switcher. These are shown as endonyms (தமிழ்,
  తెలుగు) on purpose: people scan for their own script, not for an English
  description of their language.

## Before shipping a translation

`npm test` will not catch a plausible-but-wrong translation. The following
need a native speaker or a professional translator, because a confident error
on a high-value listing is worse than showing English:

- Garage taxonomy — Collector Vault, Marine Port, EV Pavilion, Teak Portico
- Regulatory — CRZ clearance, RERA registration, land survey area, title status
- Transaction — co-broking commission split, confidential mandate, LOI
- Any legal copy under `app/legal/`
