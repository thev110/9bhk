import type { ReactNode } from "react";
import { SiteFooter } from "@/components/seo/site-footer";
import { SiteHeader } from "@/components/seo/site-header";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import type { Crumb } from "@/lib/seo/schema";

/**
 * Page frame for the server-rendered editorial surfaces.
 *
 * One `<header>` / `<nav>` / `<main>` / `<footer>` per page, one `<h1>`, and a
 * logical `<h2>`/`<h3>` hierarchy below it. The mobile app shell in
 * `components/shell.tsx` is untouched; this frame sits alongside it for the
 * pages that exist to be crawled and read.
 */
export function EditorialShell({
  children,
  current,
  className = "",
}: {
  children: ReactNode;
  current?: string;
  className?: string;
}) {
  return (
    <div className="seo-page">
      <SiteHeader current={current} />
      <main id="main" className={`seo-main${className ? ` ${className}` : ""}`}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

/** Breadcrumb + eyebrow + H1 + lede. The top of every landing page. */
export function PageHero({
  eyebrow,
  title,
  lede,
  crumbs,
  meta,
}: {
  eyebrow?: string;
  title: string;
  lede?: ReactNode;
  crumbs?: Crumb[];
  meta?: ReactNode;
}) {
  return (
    <div className="seo-hero">
      {/*
        `schema={false}`: every page that passes `crumbs` to PageHero also
        builds an `@graph` containing `createBreadcrumbSchema()`. Emitting a
        second BreadcrumbList with the same `@id` is invalid structured data —
        Google discards the entire graph, not just the duplicate.
      */}
      {crumbs?.length ? <Breadcrumbs crumbs={crumbs} schema={false} /> : null}
      {eyebrow ? <p className="seo-eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {lede ? <div className="seo-lede">{lede}</div> : null}
      {meta ? <div className="seo-hero-meta">{meta}</div> : null}
    </div>
  );
}

/** A titled `<section>`. Keeps heading order monotonic down the page. */
export function Section({
  title,
  id,
  children,
  aside,
  description,
}: {
  title: string;
  id?: string;
  children: ReactNode;
  aside?: ReactNode;
  description?: ReactNode;
}) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section className="seo-section" aria-labelledby={headingId} id={id}>
      <div className="seo-section-head">
        <h2 id={headingId}>{title}</h2>
        {aside ? <div className="seo-section-aside">{aside}</div> : null}
      </div>
      {description ? <div className="seo-section-lede">{description}</div> : null}
      {children}
    </section>
  );
}

/** Compact definition-style strip used for inventory summaries. */
export function StatStrip({ items }: { items: Array<{ label: string; value: string }> }) {
  if (!items.length) return null;
  return (
    <ul className="seo-stats">
      {items.map((item) => (
        <li key={item.label}>
          <span className="seo-stat-value">{item.value}</span>
          <span className="seo-stat-label">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

/** Editorial paragraph block. */
export function Prose({ children }: { children: ReactNode }) {
  return <div className="seo-prose">{children}</div>;
}
