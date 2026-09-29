import type { JsonLd } from "@/lib/seo/schema";

/**
 * Renders a JSON-LD graph.
 *
 * `JSON.stringify` output is embedded in a `<script type="application/ld+json">`
 * with `<` escaped. Without that escape a listing blurb containing `</script>`
 * would terminate the tag early and produce invalid markup — a real injection
 * risk now that descriptions come from a database.
 *
 * This is a server component, so the markup is present in the initial HTML
 * rather than injected after hydration.
 */
export function JsonLd({ data, id }: { data: JsonLd; id?: string }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      id={id}
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- JSON-LD is the only valid
      // way to ship structured data; the payload is generated, not user HTML.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
