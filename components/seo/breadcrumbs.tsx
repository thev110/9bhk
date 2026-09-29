import Link from "next/link";
import type { Crumb } from "@/lib/seo/schema";
import { createBreadcrumbSchema } from "@/lib/seo/schema";
import { JsonLd } from "@/components/seo/json-ld";

/**
 * Semantic breadcrumb trail.
 *
 * Renders a real `<nav>` with an ordered list, emits the matching
 * `BreadcrumbList` JSON-LD from the *same* array, and adds `BreadcrumbList`
 * markup inside the `<ol>` so assistive technology announces the hierarchy
 * rather than just a run of links.
 *
 * The final crumb is the current page: rendered as plain text with
 * `aria-current="page"` rather than a link back to itself, which removes the
 * last self-referencing internal link on every page.
 */
export function Breadcrumbs({
  crumbs,
  className,
  schema = true,
}: {
  crumbs: Crumb[];
  className?: string;
  /**
   * Set false when the page's own `@graph` already contains a
   * `BreadcrumbList`. Two nodes with the same `@id` is invalid structured
   * data — Google discards the whole graph rather than merging them.
   */
  schema?: boolean;
}) {
  if (crumbs.length < 2) return null;
  const last = crumbs.length - 1;

  return (
    <>
      {schema ? <JsonLd data={createBreadcrumbSchema(crumbs)} id="breadcrumb-jsonld" /> : null}
      <nav aria-label="Breadcrumb" className={`crumbs${className ? ` ${className}` : ""}`}>
        <ol>
          {crumbs.map((crumb, index) => {
            const isLast = index === last;
            return (
              <li key={`${crumb.href}-${index}`}>
                {isLast ? (
                  <span aria-current="page">{crumb.name}</span>
                ) : (
                  <Link href={crumb.href}>{crumb.name}</Link>
                )}
                {!isLast ? <span className="crumbs-sep" aria-hidden="true">/</span> : null}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
