import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialShell, PageHero, Section, StatStrip } from "@/components/seo/page-frame";
import { PropertyGrid, PropertyRowCard } from "@/components/seo/property-card";
import { FaqSection, QuickAnswer } from "@/components/seo/faq";
import { collectionFacts } from "@/components/seo/quick-facts";
import { LinkCluster, LinkTile } from "@/components/seo/link-tile";
import { EditorialCta } from "@/components/seo/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { getIndexableProperties } from "@/lib/server/catalog";
import { generateLocationMetadata } from "@/lib/seo/metadata";
import { locationCrumbs } from "@/lib/seo/breadcrumbs";
import { locationFaq } from "@/lib/seo/faq";
import { capacityBand, locationIntro, priceBand } from "@/lib/seo/copy";
import { getLocation, locationSlugFor, nearbyLocations, publishableLocations } from "@/lib/seo/locations";
import {
  createArticleSchema,
  createBreadcrumbSchema,
  createCollectionPageSchema,
  createItemListSchema,
  createPlaceSchema,
  graph,
} from "@/lib/seo/schema";
import { CATEGORIES, categoryFor } from "@/lib/seo/taxonomy";
import { CONTENT } from "@/lib/content/guides";
import { GuideCard } from "@/components/seo/guide-blocks";

/**
 * `/locations/[slug]` — a destination page (GEO / local SEO).
 *
 * Inventory-gated: the route 404s unless the destination clears its
 * `minInventory` threshold, which is the same check the sitemap uses. A
 * destination with one listing therefore never ships a page — it stays
 * discoverable through the property that sits there and through `/locations`.
 *
 * The content is genuinely destination-specific: the registry's geographic
 * overview, how the destination is reached, the stay types present, the live
 * inventory, price and capacity bands, location-specific FAQs, and links out
 * to the destinations travellers pair it with. None of it is a city name
 * swapped into a template.
 */
export const revalidate = 3600;
export const dynamicParams = true;

type Params = { params: Promise<{ slug: string }> };

async function resolve(slug: string) {
  const location = getLocation(slug);
  if (!location) return null;
  const properties = await getIndexableProperties();
  const scoped = properties.filter((property) => locationSlugFor(property) === location.slug);
  if (scoped.length < location.minInventory) return null;
  return { location, scoped, properties };
}

export async function generateStaticParams() {
  const properties = await getIndexableProperties();
  return publishableLocations(properties).map((summary) => ({ slug: summary.entry.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolve(slug);
  if (!resolved) return { robots: { index: false, follow: true } };

  const { location, scoped } = resolved;
  const categories = CATEGORIES.filter((category) =>
    scoped.some((property) => categoryFor(property).slug === category.slug),
  );
  return generateLocationMetadata(location, scoped, categories);
}

export default async function LocationPage({ params }: Params) {
  const { slug } = await params;
  const resolved = await resolve(slug);
  if (!resolved) notFound();

  const { location, scoped, properties } = resolved;
  const categories = CATEGORIES.filter((category) =>
    scoped.some((property) => categoryFor(property).slug === category.slug),
  );
  const crumbs = locationCrumbs(location);
  const neighbours = nearbyLocations(location.slug, properties);
  const guides = CONTENT.filter((guide) => guide.locations.includes(location.slug));
  const capacity = capacityBand(scoped);
  const band = priceBand(scoped);
  const intro = locationIntro(location, scoped, categories);

  return (
    <EditorialShell current={`/locations/${location.slug}`}>
      <JsonLd
        data={graph(
          createPlaceSchema(location),
          createCollectionPageSchema({
            name: `Private stays in ${location.name}`,
            description: intro,
            path: `/locations/${location.slug}`,
          }),
          createItemListSchema(
            scoped.map((property) => ({
              name: property.name,
              href: `/property/${property.id}`,
              image: property.image,
            })),
            { name: `Stays in ${location.name}`, path: `/locations/${location.slug}` },
          ),
          createBreadcrumbSchema(crumbs),
        )}
      />

      <PageHero
        crumbs={crumbs}
        eyebrow={`${location.region} · ${location.kind === "coast" ? "Coast" : location.kind === "hills" ? "Hills" : location.kind === "city" ? "City" : "Countryside"}`}
        title={`Private stays in ${location.name}`}
        lede={<p>{intro}</p>}
        meta={
          <StatStrip
            items={[
              { label: "Listings", value: String(scoped.length) },
              { label: "Sleeps", value: capacity ?? "—" },
              { label: "Nightly from", value: band ?? "—" },
              { label: "Stay types", value: String(categories.length) },
            ]}
          />
        }
      />

      <QuickAnswer
        question={`What private stays are available in ${location.name}?`}
        answer={`9bhk has ${scoped.length} ${scoped.length === 1 ? "whole-house stay" : "whole-house stays"} in ${location.name}${
          capacity ? `, sleeping ${capacity}` : ""
        }${band ? `, from ${band}` : ""}. ${
          categories.length
            ? `They cover ${categories.map((category) => category.plural.toLowerCase()).join(", ")}.`
            : ""
        } ${location.reach}`}
      />

      <Section
        title={`Stays in ${location.name}`}
        id="inventory"
        description="Every 9bhk listing in this destination, with the capacity, amenities and rate its host has published."
      >
        <PropertyGrid properties={scoped} priorityCount={2} />
      </Section>

      <Section title={`About ${location.name}`} id="about">
        <div className="seo-copy">
          <p>{location.overview}</p>
          <h2>Getting there</h2>
          <p>{location.reach}</p>
          {/*
            Travel figures are opt-in. `distanceFromChennaiKm` and
            `driveTimeFromChennai` are null in the registry today, and this block
            renders nothing until the team supplies verified numbers — better an
            honest omission than a plausible guess in a travel-time line.
          */}
          {location.driveTimeFromChennai ? (
            <>
              <h2>From Chennai</h2>
              <p>
                About {location.driveTimeFromChennai}
                {location.distanceFromChennaiKm
                  ? ` — roughly ${location.distanceFromChennaiKm} km on the road.`
                  : "."}
              </p>
            </>
          ) : null}
          <h2>Stay types here</h2>
          <ul>
            {categories.map((category) => (
              <li key={category.slug}>
                <a href={`${category.href}/${location.slug}`}>
                  {category.plural} in {location.name}
                </a>{" "}
                — {scoped.filter((property) => categoryFor(property).slug === category.slug).length}{" "}
                {scoped.filter((property) => categoryFor(property).slug === category.slug).length === 1
                  ? "listing"
                  : "listings"}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section title={`${location.name} at a glance`} id="facts">
        <dl className="seo-facts-grid" data-cols={3}>
          {collectionFacts(scoped, { locationName: location.name }).map((fact) => (
            <div className="seo-fact" key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <FaqSection
        items={locationFaq(location, scoped, categories)}
        heading={`${location.name}: questions`}
        headingId="location-faq-heading"
      />

      {guides.length ? (
        <Section
          title={`Guides about ${location.name}`}
          id="guides"
          aside={<a href="/guides">All guides</a>}
        >
          <ul className="seo-guide-grid">
            {guides.map((guide) => (
              <li key={guide.slug}>
                <GuideCard guide={guide} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {neighbours.length ? (
        <Section
          title={`Other destinations near ${location.name}`}
          id="nearby"
          description="Destinations travellers usually pair with this one, based on where 9bhk has inventory."
        >
          <ul className="seo-links">
            {neighbours.map((summary) => (
              <li key={summary.entry.slug}>
                {summary.publishable ? (
                  <LinkTile
                    href={`/locations/${summary.entry.slug}`}
                    title={summary.entry.name}
                    note={`${summary.count} ${summary.count === 1 ? "stay" : "stays"} · ${summary.entry.region}`}
                  />
                ) : (
                  <div className="seo-links-plain">
                    <strong>{summary.entry.name}</strong>
                    <span>
                      {summary.count} {summary.count === 1 ? "stay" : "stays"} · {summary.entry.region}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <section className="seo-section" aria-labelledby="location-stays-heading">
        <div className="seo-section-head">
          <h2 id="location-stays-heading">What the hosts have declared</h2>
        </div>
        <p className="seo-section-lede">
          A quick read of the specification each host has entered for their house. Anything a host
          has not filled in simply does not appear.
        </p>
        <ul className="seo-rows">
          {scoped.slice(0, 6).map((property) => (
            <li key={property.id}>
              <PropertyRowCard property={property} />
            </li>
          ))}
        </ul>
      </section>

      <LinkCluster
        headingId="explore-heading"
        title="Keep exploring"
        links={[
          { href: "/stays", label: "All stays on 9bhk", note: "The complete catalog" },
          ...CATEGORIES.map((category) => ({
            href: category.href,
            label: category.plural,
            note: category.summary.slice(0, 88).replace(/\.$/, "") + "…",
          })),
          { href: "/guides", label: "Guides", note: "Planning help for a private stay" },
        ]}
      />

      <EditorialCta
        title={`Ready to look at ${location.name}?`}
        body={`Every house here is a whole home rented exclusively. Open a listing to see its capacity, amenities and nightly rate before you enquire.`}
        primary={{ href: "/stays", label: "Browse all stays" }}
        secondary={{ href: "/faq", label: "How booking works" }}
      />
    </EditorialShell>
  );
}
