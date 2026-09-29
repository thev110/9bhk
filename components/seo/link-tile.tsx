import NextLink from "next/link";

/**
 * Titled internal-link tile.
 *
 * The internal-linking primitive for the new pages: category hubs, destination
 * pages, guide footers and related-collection blocks all use this, so every
 * cross-link in the graph looks the same and every one of them is a real
 * crawlable `<a href>`.
 */
export function LinkTile({
  href,
  title,
  note,
  count,
}: {
  href: string;
  title: string;
  note?: string;
  count?: number;
}) {
  return (
    <NextLink href={href}>
      <strong>{title}</strong>
      {note ? <span>{note}</span> : null}
      {typeof count === "number" ? <span>{count} listings</span> : null}
    </NextLink>
  );
}

/**
 * Compact variant used where a page wants a link with a label and a note
 * rather than a tile. Kept as a named export so the homepage and the guide
 * footers share one internal-link primitive instead of rolling their own.
 */
export function Link({
  href,
  label,
  note,
}: {
  href: string;
  label: string;
  note?: string;
}) {
  return (
    <NextLink href={href}>
      <strong>{label}</strong>
      {note ? <span>{note}</span> : null}
    </NextLink>
  );
}

/** A titled list of related links, used in "related collections" blocks. */
export function LinkCluster({
  title,
  links,
  headingId,
}: {
  title: string;
  links: Array<{ href: string; label: string; note?: string }>;
  headingId?: string;
}) {
  if (!links.length) return null;
  return (
    <section className="seo-section" aria-labelledby={headingId}>
      <div className="seo-section-head">
        <h2 id={headingId}>{title}</h2>
      </div>
      <ul className="seo-links">
        {links.map((link) => (
          <li key={link.href}>
            <NextLink href={link.href}>
              <strong>{link.label}</strong>
              {link.note ? <span>{link.note}</span> : null}
            </NextLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
