# i18n — adding Tamil & Telugu

9bhk ships in English, Tamil and Telugu. English is the source of truth; the
other two fall back to it, so the app is never blank or broken while a
translation is still missing.

## How it works

| File | Role |
|---|---|
| `lib/i18n/en.ts` | The catalog. Every user-facing string in the app lives here. |
| `lib/i18n/keys/*.ts` | One fragment per surface (`host`, `realtor`, `admin`, …), merged into `en`. |
| `lib/i18n/ta.ts` | Tamil. `overrides` holds translated strings. |
| `lib/i18n/te.ts` | Telugu. `overrides` holds translated strings. |
| `lib/i18n/use-t.ts` | The `useT()` hook. |
| `lib/i18n/t.ts` | Key resolution and `{placeholder}` interpolation. |
| `lib/i18n/garage.ts` | Shared garage-type vocabulary. |

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

Add entries to `overrides` in `lib/i18n/ta.ts` and `lib/i18n/te.ts`. Anything
you leave out silently falls back to English.

```ts
const overrides: Partial<Dict> = {
  "nav.buy": "வாங்கு",
};
```

`npm test` prints progress and fails on any override that is byte-identical to
its English source:

```
[i18n] ta: 0/512 translated, 512 falling back to English
```

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
