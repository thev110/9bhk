"use client";

import { PageBar, Shell } from "@/components/shell";
import { useT } from "@/lib/i18n";

/**
 * Server-render placeholder for the search screen.
 *
 * Shown while the client component hydrates. It uses the real app shell and
 * the real heading so the page has meaningful content in the initial HTML
 * rather than an empty container.
 */
export function SearchFallback() {
  const t = useT();
  return (
    <Shell>
      <PageBar title={t("search.title")} backHref="/" />
    </Shell>
  );
}
