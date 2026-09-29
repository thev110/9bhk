"use client";

import Link from "next/link";
import { PageBar, Shell } from "@/components/shell";
import { useT } from "@/lib/i18n";

/**
 * 404 body.
 *
 * The translated chrome comes from the client locale store, so this is a client
 * component. `children` lets the server `app/not-found.tsx` inject real,
 * crawlable fallback links as static HTML — the suggestions are genuine routes,
 * not a dead end.
 */
export function NotFoundBody({ children }: { children?: React.ReactNode }) {
  const t = useT();
  return (
    <Shell dock="none">
      <PageBar title={t("notFound.title")} backHref="/" />
      <div className="empty">
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 26 }}>
          {t("notFound.heading")}
        </h2>
        <p>{t("notFound.body")}</p>
        <Link className="btn" href="/">
          {t("notFound.back")}
        </Link>
        {children}
      </div>
    </Shell>
  );
}
