"use client";

import Link from "next/link";
import { PageBar, Shell } from "@/components/shell";
import { useT } from "@/lib/i18n";

export function NotFoundBody() {
  const t = useT();
  return (
    <Shell dock="none">
      <PageBar title={t("notFound.title")} backHref="/" />
      <div className="empty">
        <h3>{t("notFound.heading")}</h3>
        <p>{t("notFound.body")}</p>
        <Link className="btn" href="/">
          {t("notFound.back")}
        </Link>
      </div>
    </Shell>
  );
}
