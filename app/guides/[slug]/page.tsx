import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialShell, PageHero, Section } from "@/components/seo/page-frame";
import { FaqSection, QuickAnswer } from "@/components/seo/faq";
import { GuideBody, GuideByline, GuideCard, GuideHeroImage } from "@/components/seo/guide-blocks";
import { PropertyRowCard } from "@/components/seo/property-card";
import { LinkCluster } from "@/components/seo/link-tile";
import { EditorialCta } from "@/components/seo/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { guideCrumbs } from "@/lib/seo/breadcrumbs";
import { generateGuideMetadata } from "@/lib/seo/metadata";
import { createArticleSchema, createBreadcrumbSchema, createCollectionPageSchema, graph } from "@/lib/seo/schema";
import { CONTENT, getPublishedGuide } from "@/lib/content/guides";
import { getLocation } from "@/lib/seo/locations";
import { CATEGORIES } from "@/lib/seo/taxonomy";
import { guidesForListing } from "@/lib/content/guides";
import { getIndexableProperties } from "@/lib/server/catalog";

/**
 * `/guides/[slug]` — a single editorial article.
 *
 * `dynamicParams` stays on so a guide can be published without a redeploy, and
 * the route returns a real 404 for an unknown or draft slug — a draft guide
 * must not be reachable by URL, not even as a soft 404.
 */
export const revalidate = 3600;
export const dynamicParams = true;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return CONTENT.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const guide = getPublishedGuide(slug);
  if (!guide) return { robots: { index: false, follow: true } };
  return generateGuideMetadata(guide);
}

export default async function GuidePage({ params }: Params) {
  const { slug } = await params;
  const guide = getPublishedGuide(slug);
  if (!guide) notFound();

  const properties = await getIndexableProperties();
  const crumbs = guideCrumbs(guide);

  /* Property links: the guide's own picks first, then anything else it covers. */
  const picked = properties.filter((property) => guide.relatedProperties.includes(property.id));
  const locationSlug = guide.locations[0];
  const categorySlug = guide.categories[0];
  const fallback = properties.filter(
    (property) =>
      !picked.some((item) => item.id === property.id) &&
      guidesForListing(property.id, locationSlug, categorySlug).some((item) => item.slug === guide.slug),
  );
  const referenced = [...picked, ...fallback].slice(0, 6);

  const relatedGuides = CONTENT.filter(
    (item) => item.slug !== guide.slug && (guide.relatedGuides.includes(item.slug) || item.locations.some((l) => guide.locations.includes(l))),
  ).slice(0, 3);

  const destinationLinks = guide.locations
    .map((locationSlugValue) => getLocation(locationSlugValue))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return (
    <EditorialShell>
      <JsonLd
        data={graph(
          createCollectionPageSchema({
            name: guide.title,
            description: guide.excerpt,
            path: `/guides/${guide.slug}`,
          }),
          createArticleSchema(guide),
          createBreadcrumbSchema(crumbs),
        )}
      />

      <PageHero
        crumbs={crumbs}
        eyebrow={
          destinationLinks.length
            ? destinationLinks.map((entry) => entry.name).join(" · ")
            : "9bhk guide"
        }
        title={guide.h1 ?? guide.title}
        lede={<p>{guide.excerpt}</p>}
      />

      <GuideHeroImage guide={guide} />
      <GuideByline guide={guide} />

      <QuickAnswer
        question={`What does this guide cover?`}
        answer={guide.excerpt}
        headingId="guide-answer-heading"
      />

      <div style={{ marginTop: 26 }}>
        <GuideBody blocks={guide.body} />
      </div>

      {guide.faq.length ? (
        <FaqSection items={guide.faq} heading="Questions this guide answers" headingId="guide-faq-heading" />
      ) : null}

      {referenced.length ? (
        <Section
          title="Stays referenced in this guide"
          id="referenced-stays"
          aside={<a href="/stays">All stays</a>}
        >
          <ul className="seo-rows">
            {referenced.map((property) => (
              <li key={property.id}>
                <PropertyRowCard property={property} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <LinkCluster
        headingId="guide-destinations-heading"
        title="Destinations covered"
        links={destinationLinks.map((entry) => ({
          href: `/locations/${entry.slug}`,
          label: entry.name,
          note: `${entry.region} · ${entry.kind === "coast" ? "Coast" : entry.kind === "hills" ? "Hills" : entry.kind === "city" ? "City" : "Countryside"}`,
        }))}
      />

      <LinkCluster
        headingId="guide-staytypes-heading"
        title="Stay types in this guide"
        links={CATEGORIES.filter((category) => guide.categories.includes(category.slug)).map(
          (category) => ({ href: category.href, label: category.plural, note: category.summary }),
        )}
      />

      {relatedGuides.length ? (
        <Section title="Read next" id="related-guides">
          <ul className="seo-guide-grid">
            {relatedGuides.map((item) => (
              <li key={item.slug}>
                <GuideCard guide={item} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <EditorialCta
        title="Ready to book?"
        body="Every listing is a whole home taken exclusively. Open one to see the capacity, amenities and nightly rate its host has published."
        primary={{ href: "/stays", label: "Browse all stays" }}
        secondary={{ href: "/faq", label: "How booking works" }}
      />
    </EditorialShell>
  );
}
