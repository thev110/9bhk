"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { dictionaries } from "./dictionaries";
import { translate } from "./t";
import { LOCALE_TAGS, DEFAULT_LOCALE, type Locale, type Vars } from "./types";
import type { DictKey } from "./en";

/**
 * Translation hook.
 *
 * `t` is typed against the English catalog, so calling it with a key that
 * doesn't exist is a TypeScript error rather than a runtime blank.
 */
export function useT() {
  const { locale } = useStore();

  // Keep <html lang> in sync so screen readers announce the right language
  // and the browser picks the correct font fallback.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
  }, [locale]);

  return useCallback(
    (key: DictKey, vars?: Vars) => translate(dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE], key, vars),
    [locale],
  );
}

export function useLocale() {
  const { locale, setLocale } = useStore();
  return useMemo(
    () => ({ locale: (locale ?? DEFAULT_LOCALE) as Locale, setLocale, tag: LOCALE_TAGS[locale ?? DEFAULT_LOCALE] }),
    [locale, setLocale],
  );
}
