"use client";

import { useStore } from "@/lib/store";
import { useT, LOCALES, LOCALE_LABELS } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * Interface language picker.
 *
 * Labels are shown as endonyms (தமிழ், తెలుగు) rather than translated names —
 * a user looking for their own language scans for their own script, not for
 * an English description of it.
 */
export function LanguageSwitcher() {
  const { locale, setLocale } = useStore();
  const t = useT();

  return (
    <div className="card">
      <strong>{t("settings.language")}</strong>
      <p className="muted" style={{ fontSize: 12, margin: "2px 0 10px" }}>
        {t("settings.languageSub")}
      </p>
      <div className="chips" role="group" aria-label={t("a11y.languageGroup")}>
        {LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            className={`chip${locale === code ? " is-active" : ""}`}
            lang={code}
            aria-pressed={locale === code}
            onClick={() => setLocale(code as Locale)}
          >
            {LOCALE_LABELS[code]}
          </button>
        ))}
      </div>
    </div>
  );
}
