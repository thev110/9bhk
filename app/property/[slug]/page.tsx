import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropertyExperience } from "@/components/property-experience";
import { getServerCatalog } from "@/lib/server/catalog";
import { propertyCrumbs } from "@/lib/seo/breadcrumbs";
import { propertyFaq } from "@/lib/seo/faq";
import { propertyPageSchema } from "@/lib/seo/schema";
import { generatePropertyMetadata } from "@/lib/seo/metadata";
import { SITE } from "@/lib/seo/site";

/**
 * Property route — the highest-value SEO surface on the site.
 *
 * Split into a server shell and a client experience:
 *
 *   • The **server shell** owns `generateMetadata`, `generateStaticParams`, the
 *     404 decision, and the JSON-LD graph. All of those have to run on the
 *     server; none of them can be done from a `"use client"` page, which is
 *     exactly why this file previously exported no metadata at all and every
 *     listing in the catalog shared the root default title.
 *
 *   • The **client experience** owns the interactive chrome (saved toggle,
 *     booking CTA, walkthrough sheet) and the semantic content blocks.
 *
 * The server-resolved listing is passed down as `initialProperty`. That is not
 * an optimisation — it is a correctness fix. The browser catalog starts from
 * the static seed list and only merges Supabase rows in a `useEffect`, so
 * without this a host-published listing rendered its "this stay is gone" state
 * into the server HTML at HTTP 200: a soft 404 that a crawler would index and
 * a guest on a slow connection would actually see. Passing the server's copy
 * means the first byte of HTML is the real listing, and the client simply
 * re-renders the same data once its own catalog catches up.
 *
 * `dynamicParams` stays on so a listing published after the build renders on
 * first request and is picked up by the revalidated sitemap, rather than 404ing
 * until the next deploy.
 */
export const dynamicParams = true;
export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const properties = await getServerCatalog();
  return properties.filter((property) => !property.noindex).map((property) => ({ slug: property.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const properties = await getServerCatalog();
  const property = properties.find((item) => item.id === slug);

  if (!property) {
    return {
      title: "This stay is no longer listed",
      description: `That listing is not currently published on ${SITE.displayName}. Browse the stays that are available.`,
      robots: { index: false, follow: true },
    };
  }

  const generated = generatePropertyMetadata(property);

  /* Editor overrides win; everything else is generated from the listing. */
  if (!property.seoTitle && !property.seoDescription && !property.canonical) return generated;

  return {
    ...generated,
    ...(property.seoTitle ? { title: { absolute: property.seoTitle } } : {}),
    ...(property.seoDescription ? { description: property.seoDescription } : {}),
    ...(property.canonical ? { alternates: { canonical: property.canonical } } : {}),
  };
}

export default async function PropertyPage({ params }: Params) {
  const { slug } = await params;
  const properties = await getServerCatalog();
  const property = properties.find((item) => item.id === slug);

  /*
   * A real 404, not a soft one. Rendering the shell with "this stay is gone"
   * would return HTTP 200 for every deleted or mistyped slug, which Google
   * treats as a soft 404 and which quietly drains crawl budget from the
   * listings that do exist.
   */
  if (!property) notFound();

  const crumbs = propertyCrumbs(property);
  const faq = propertyFaq(property);

  return (
    <PropertyExperience
      slug={slug}
      initialProperty={property}
      /* Built here, on the server, from the same listing the page renders. */
      schema={propertyPageSchema(property, crumbs, faq)}
    />
  );
}
