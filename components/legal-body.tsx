"use client";

import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { PageBar, Shell } from "@/components/shell";
import { useT } from "@/lib/i18n";

/**
 * Chrome shared by every page under /legal.
 *
 * The legal `page.tsx` files are Server Components (they export `metadata`),
 * so they cannot call `useT()` directly. They pass their document body in as
 * `children` — which stays in English, because it is lawyer-reviewed prose —
 * and this client child renders only the translated UI chrome around it.
 */
const LEGAL_DOCS = [
  { id: "privacy", href: "/legal/privacy", barKey: "legal.privacy", titleKey: "legal.privacyTitle" },
  { id: "terms", href: "/legal/terms", barKey: "legal.terms", titleKey: "legal.termsTitle" },
  { id: "refunds", href: "/legal/refunds", barKey: "legal.refunds", titleKey: "legal.refundsTitle" },
  { id: "cookies", href: "/legal/cookies", barKey: "legal.cookies", titleKey: "legal.cookiesTitle" },
] as const;

export type LegalDocId = (typeof LEGAL_DOCS)[number]["id"];

export function LegalBody({
  doc,
  backHref,
  children,
}: {
  doc: LegalDocId;
  backHref: string;
  children: ReactNode;
}) {
  const t = useT();
  const current = LEGAL_DOCS.find((d) => d.id === doc);

  if (!current) return null;

  return (
    <Shell dock="none">
      <PageBar title={t(current.barKey)} backHref={backHref} />
      <article className="pad mt stack">
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 36 }}>
          {t(current.titleKey)}
        </h1>
        {children}
        <p className="muted">
          {LEGAL_DOCS.filter((d) => d.id !== doc).map((d, i) => (
            <Fragment key={d.id}>
              {i > 0 ? " · " : null}
              <Link href={d.href}>{t(d.barKey)}</Link>
            </Fragment>
          ))}
        </p>
      </article>
    </Shell>
  );
}
