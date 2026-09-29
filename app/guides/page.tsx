import type { Metadata } from "next";
import { EditorialShell, PageHero, Section } from "@/components/seo/page-frame";
import { GuideCard } from "@/components/seo/guide-blocks";
import { LinkTile } from "@/components/seo/link-tile";
import { EditorialCta } from "@/components/seo/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { generateGuidesIndexMetadata } from "@/lib/seo/metadata";
import { CONTENT } from "@/lib/content/guides";
import { createBreadcrumbSchema, createItemListSchema, createCollectionPageSchema, graph } from "@/lib/seo/schema";
import { staticCrumbs } from "@/lib/seo/breadcrumbs";
import { CATEGORIES } from "@/lib/seo/taxonomy";
import { publishableLocations } from "@/lib/seo/locations";
import { getIndexableProperties } from "@/lib/server/catalog";

/**
 * `/guides` — editorial index.
 *
 * Deliberately a hub, not a feed. There is no generator here and no scheduled
 * publishing: a guide is written because it answers a planning question the
 * listing data cannot. Adding thin, keyword-shaped articles to fill this page
 * would do more damage than leaving it short, so the type requires a body, an
 * excerpt, an author byline and a real image before it will render.
 */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return generateGuidesIndexMetadata(CONTENT.length);
}

export default async function GuidesIndexPage() {
  const crumbs = staticCrumbs("Guides", "/guides");
  const properties = await getIndexableProperties();
  const destinations = publishableLocations(properties);

  return (
    <EditorialShell current="/guides">
      <JsonLd
        data={graph(
          createCollectionPageSchema({
            name: "9bhk guides",
            description: "Planning guides for booking a private stay in Tamil Nadu and Puducherry.",
            path: "/guides",
          }),
          createItemListSchema(
            CONTENT.map((guide) => ({ name: guide.title, href: `/guides/${guide.slug}`, image: guide.image })),
            { name: "9bhk guides", path: "/guides" },
          ),
          createBreadcrumbSchema(crumbs),
        )}
      />

      <PageHero
        crumbs={crumbs}
        eyebrow="Editorial"
        title="Guides"
        lede={
          <p>
            Short, practical guides to choosing and booking a private stay on the 9bhk coast,
            countryside and hills — written from the actual listings, so the specifications quoted
            are the ones the hosts have published.
          </p>
        }
      />

      <Section title="All guides" id="all-guides">
        <ul className="seo-guide-grid">
          {CONTENT.map((guide) => (
            <li key={guide.slug}>
              <GuideCard guide={guide} />
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Guides by destination"
        id="by-destination"
        aside={<a href="/locations">All destinations</a>}
      >
        <ul className="seo-links">
          {destinations.map((summary) => {
            const count = CONTENT.filter((guide) => guide.locations.includes(summary.entry.slug)).length;
            if (!count) return null;
            return (
              <li key={summary.entry.slug}>
                <LinkTile
                  href={`/locations/${summary.entry.slug}`}
                  title={summary.entry.name}
                  note={`${count} ${count === 1 ? "guide" : "guides"} · ${summary.count} ${
                    summary.count === 1 ? "stay" : "stays"
                  }`}
                />
              </li>
            );
          })}
        </ul>
      </Section>

      <Section
        title="Guides by stay type"
        id="by-type"
        description="Start from the kind of house you are looking for rather than the place."
      >
        <ul className="seo-links">
          {CATEGORIES.map((category) => {
            const count = CONTENT.filter((guide) => guide.categories.includes(category.slug)).length;
            return (
              <li key={category.slug}>
                <LinkTile
                  href={category.href}
                  title={category.plural}
                  note={`${count} ${count === 1 ? "guide" : "guides"}`}
                />
              </li>
            );
          })}
        </ul>
      </Section>

      <EditorialCta
        title="Still deciding?"
        body="Compare every listing side by side on the catalog page, or read how a booking actually works before you pay anyone."
        primary={{ href: "/stays", label: "Browse all stays" }}
        secondary={{ href: "/faq", label: "How booking works" }}
      />
    </EditorialShell>
  );
}
