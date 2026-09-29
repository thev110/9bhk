import type { Metadata } from "next";
import { EditorialShell, PageHero, Section, StatStrip } from "@/components/seo/page-frame";
import { PropertyGrid } from "@/components/seo/property-card";
import { FaqSection, QuickAnswer } from "@/components/seo/faq";
import { collectionFacts } from "@/components/seo/quick-facts";
import { LinkCluster, LinkTile } from "@/components/seo/link-tile";
import { EditorialCta } from "@/components/seo/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { getIndexableProperties } from "@/lib/server/catalog";
import { generateStaysMetadata } from "@/lib/seo/metadata";
import {
  createBreadcrumbSchema,
  createItemListSchema,
  createCollectionPageSchema,
  graph,
} from "@/lib/seo/schema";
import { CATEGORIES, categoryFor, capacityRange, priceRange } from "@/lib/seo/taxonomy";
import { publishableLocations } from "@/lib/seo/locations";
import { platformFaq } from "@/lib/seo/faq";
import { HomeCrumbs } from "@/lib/seo/breadcrumbs";

/**
 * `/stays` — the indexable inventory hub.
 *
 * This is the crawlable counterpart to `/search`. `/search` is a working tool
 * with an effectively infinite parameter space and is `noindex, follow`; this
 * page is the stable, canonical, linkable destination that filter states
 * consolidate to, and the page every listing is reachable from.
 */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const properties = await getIndexableProperties();
  return generateStaysMetadata(properties);
}

export default async function StaysPage() {
  const properties = await getIndexableProperties();
  const destinations = publishableLocations(properties);
  const crumbs = HomeCrumbs();

  const guests = capacityRange(properties);
  const prices = priceRange(properties);

  const ordered = [...properties].sort((a, b) => {
    const byGroup = { featured: 0, popular: 1, nearby: 2 } as Record<string, number>;
    return (byGroup[a.group] ?? 3) - (byGroup[b.group] ?? 3) || b.guests - a.guests;
  });

  return (
    <EditorialShell current="/stays">
      <JsonLd
        data={graph(
          createCollectionPageSchema({
            name: "All private stays on 9bhk",
            description:
              "Every whole-house stay on 9bhk, with capacity, amenities and nightly rate.",
            path: "/stays",
          }),
          createItemListSchema(
            properties.map((property) => ({
              name: property.name,
              href: `/property/${property.id}`,
              image: property.image,
            })),
            { name: "9bhk stays", path: "/stays" },
          ),
          createBreadcrumbSchema(crumbs),
        )}
      />

      <PageHero
        crumbs={crumbs}
        eyebrow="The full catalog"
        title="Every private stay on 9bhk"
        lede={
          <p>
            9bhk is a marketplace for whole premium stays — private farmhouses, beach houses,
            villas and hill-station homes — booked for the entire house rather than by the room.
            Everything below is a live listing, with the capacity, amenities and nightly rate its
            host has published.
          </p>
        }
        meta={
          <StatStrip
            items={[
              { label: "Listings", value: String(properties.length) },
              { label: "Capacity", value: guests ? `${guests.min}–${guests.max} guests` : "—" },
              {
                label: "From",
                value: prices ? `₹${prices.min.toLocaleString("en-IN")}` : "—",
              },
              { label: "Destinations", value: String(destinations.length) },
            ]}
          />
        }
      />

      <QuickAnswer
        question="What kinds of private stay can I book on 9bhk?"
        answer={`Whole private farmhouses, beach houses, villas and hill-station homes${
          guests ? ` sleeping ${guests.min} to ${guests.max} guests` : ""
        }${prices ? `, from ₹${prices.min.toLocaleString("en-IN")} a night` : ""}, across the Chennai coast, ECR, Pondicherry, the Tamil Nadu countryside and the hills.`}
      />

      <Section
        title="All stays"
        id="all-stays"
        aside={
          <span style={{ fontSize: 13, color: "var(--muted)" }}>Featured listings first</span>
        }
      >
        <PropertyGrid properties={ordered} priorityCount={3} />
      </Section>

      <LinkCluster
        headingId="by-type-heading"
        title="Browse by stay type"
        links={CATEGORIES.map((category) => {
          const scoped = properties.filter((property) => categoryFor(property).slug === category.slug);
          return {
            href: category.href,
            label: category.plural,
            note: `${scoped.length} ${scoped.length === 1 ? "listing" : "listings"}`,
          };
        })}
      />

      <Section
        title="Browse by destination"
        id="by-destination"
        description="Destination pages open only where 9bhk has enough inventory in that destination to justify one."
        aside={<a href="/locations">All destinations</a>}
      >
        <ul className="seo-links">
          {destinations.map((summary) => (
            <li key={summary.entry.slug}>
              <LinkTile
                href={`/locations/${summary.entry.slug}`}
                title={summary.entry.name}
                note={`${summary.count} ${summary.count === 1 ? "stay" : "stays"} · ${summary.entry.region}`}
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="What the catalog looks like"
        id="catalog-shape"
        aside={<a href="/faq">Read the full FAQ</a>}
      >
        <dl className="seo-facts-grid" data-cols={3}>
          {collectionFacts(properties, {}).map((fact) => (
            <div className="seo-fact" key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <FaqSection items={platformFaq()} heading="How 9bhk works" headingId="stays-faq-heading" />

      <EditorialCta
        title="Not sure which house fits?"
        body="The guides explain how to choose between the coast, the city and the countryside — and which questions to ask a host before you pay."
        primary={{ href: "/guides", label: "Read the guides" }}
        secondary={{ href: "/locations", label: "Browse destinations" }}
      />
    </EditorialShell>
  );
}
