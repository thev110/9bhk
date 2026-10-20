"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/use-t";
import type { DictKey } from "@/lib/i18n/en";

/**
 * Shown on a collection hub (/villas, /farmhouses, /beach-houses, /locations)
 * while it has no published inventory. The route still answers 200 so header
 * links never dead-end, and the page metadata is noindex until listings exist.
 */
export function CollectionEmptyState({ titleKey }: { titleKey: DictKey }) {
  const t = useT();
  return (
    <section className="seo-section" data-empty-collection style={{ padding: "48px 0", textAlign: "center" }}>
      <h1>{t(titleKey)}</h1>
      <p className="muted">{t("collection.emptyBody")}</p>
      <div className="row" style={{ gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <Link className="btn" href="/host/new" data-host-cta>
          {t("collection.emptyCta")}
        </Link>
        <Link className="btn outline" href="/stays">
          {t("collection.emptyBrowse")}
        </Link>
      </div>
    </section>
  );
}
