import type { Vars } from "./types";
import type { Dict } from "./en";

const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Resolve `key` against a catalog, substituting {named} placeholders.
 *
 * A missing key returns the key itself and warns in development rather than
 * throwing — a typo in one string should never blank out a screen.
 */
export function translate(dict: Dict, key: string, vars?: Vars): string {
  const raw = (dict as Record<string, string>)[key];
  if (raw === undefined) {
    if (typeof console !== "undefined") {
      console.warn(`[i18n] missing translation key: ${key}`);
    }
    return key;
  }
  if (!vars) return raw;
  return raw.replace(PLACEHOLDER, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
