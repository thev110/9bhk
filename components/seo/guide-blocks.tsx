import Image from "next/image";
import Link from "next/link";
import type { Guide, GuideBlock } from "@/lib/content/guides";
import { getLocation } from "@/lib/seo/locations";

/** Renders the typed guide body. No raw HTML, so nothing can be injected. */
export function GuideBody({ blocks }: { blocks: GuideBlock[] }) {
  return (
    <div className="seo-prose">
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "h2":
            return <h2 key={index}>{block.text}</h2>;
          case "h3":
            return <h3 key={index}>{block.text}</h3>;
          case "p":
            return <p key={index}>{block.text}</p>;
          case "ul":
            return (
              <ul key={index}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={index}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            );
          case "factbox":
            return (
              <aside className="seo-factbox" key={index} aria-label={block.title}>
                <h3>{block.title}</h3>
                <dl>
                  {block.items.map((item) => (
                    <div key={item.label}>
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </aside>
            );
          case "link":
            return (
              <p className="seo-inline-link" key={index}>
                <Link href={block.href}>{block.label}</Link>
                {block.note ? <span className="muted"> — {block.note}</span> : null}
              </p>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

/** Byline + publish/modified dates. Dates are real, not generated at render. */
export function GuideByline({ guide }: { guide: Guide }) {
  const modified = guide.updatedAt !== guide.publishedAt;
  return (
    <p className="seo-byline">
      <span>{guide.author}</span>
      <time dateTime={guide.publishedAt}>{formatDate(guide.publishedAt)}</time>
      {modified ? <time dateTime={guide.updatedAt}>Updated {formatDate(guide.updatedAt)}</time> : null}
    </p>
  );
}

export function GuideHeroImage({ guide }: { guide: Guide }) {
  return (
    <figure className="seo-guide-figure">
      <Image
        src={guide.image}
        alt={guide.imageAlt}
        width={1200}
        height={675}
        priority
        quality={74}
        sizes="(max-width: 900px) 100vw, 880px"
      />
      <figcaption>{guide.imageAlt}</figcaption>
    </figure>
  );
}

/** Guide card for index and related lists. */
export function GuideCard({ guide }: { guide: Guide }) {
  return (
    <article className="seo-guide-card">
      <Link href={`/guides/${guide.slug}`} className="seo-guide-card-media" tabIndex={-1} aria-hidden="true">
        <Image src={guide.image} alt="" fill sizes="(max-width: 700px) 92vw, 320px" quality={70} />
      </Link>
      <div className="seo-guide-card-body">
        {guide.locations.length ? (
          <p className="seo-card-eyebrow">
            {guide.locations
              .map((slug) => getLocation(slug)?.name ?? slug)
              .slice(0, 2)
              .join(" · ")}
          </p>
        ) : null}
        <h3>
          <Link href={`/guides/${guide.slug}`}>{guide.title}</Link>
        </h3>
        <p>{guide.excerpt}</p>
        <p className="seo-guide-card-meta">
          <time dateTime={guide.publishedAt}>{formatDate(guide.publishedAt)}</time>
        </p>
      </div>
    </article>
  );
}

function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
