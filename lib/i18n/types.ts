export type Locale = "en" | "ta" | "te";

export const LOCALES: readonly Locale[] = ["en", "ta", "te"] as const;

export const DEFAULT_LOCALE: Locale = "en";

/** Endonyms — always shown in their own script, never translated. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ta: "தமிழ்",
  te: "తెలుగు",
};

/** BCP 47 tags, used for <html lang> and Intl formatting. */
export const LOCALE_TAGS: Record<Locale, string> = {
  en: "en-IN",
  ta: "ta-IN",
  te: "te-IN",
};

export type Vars = Record<string, string | number>;
