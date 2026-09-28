import { en, type Dict } from "./en";

/**
 * Tamil (தமிழ்) catalog.
 *
 * Add translated strings to `overrides`. Anything omitted falls back to the
 * English value in `en`, so the UI is never broken or blank — it just stays
 * English until the string is translated.
 *
 * Complex terms (Collector Vault, Marine Port, CRZ, RERA, LOI) should be
 * confirmed by a native Tamil speaker before going live.
 */
const overrides: Partial<Dict> = {};

export const ta: Dict = { ...en, ...overrides };
