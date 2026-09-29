import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import type { SeoProperty } from "@/lib/catalog-rows";
import { EditorialShell, PageHero, Section, StatStrip } from "@/components/seo/page-frame";
import { PropertyGrid } from "@/components/seo/property-card";
import { FaqSection, QuickAnswer } from "@/components/seo/faq";
import { collectionFacts } from "@/components/seo/quick-facts";
import { LinkCluster, LinkTile } from "@/components/seo/link-tile";
import { EditorialCta } from "@/components/seo/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { categoryCrumbs } from "@/lib/seo/breadcrumbs";
import { categoryFaq } from "@/lib/seo/faq";
import { capacityBand, categoryIntro, priceBand } from "@/lib/seo/copy";
import { nearbyLocations, type LocationEntry, type LocationSummary } from "@/lib/seo/locations";
import {
  createBreadcrumbSchema,
  createCollectionPageSchema,
  createItemListSchema,
  createPlaceSchema,
  graph,
} from "@/lib/seo/schema";
import { CATEGORIES, categoryFor, distinctTypes, type StayCategory } from "@/lib/seo/taxonomy";

/**
 * Shared renderer for every category surface.
 *
 * Used by all three category hubs and by the category × destination pages, so
 * `/farmhouses`, `/farmhouses/ecr` and `/beach-houses/ecr` are produced by the
 * same code path. One template means one place to fix a heading level, one
 * place to add a block, and no chance of the two page families drifting apart
 * into near-duplicate content.
 *
 * The copy is assembled by `lib/seo/copy.ts` from the listings actually in
 * scope — the introduction, the quick facts and every FAQ answer are recomputed
 * per inventory set, so a page with two listings says something different from
 * a page with ten.
 */
export function CategoryView({
  category,
  properties,
  allProperties,
  location,
  locationSummaries,
}: {
  category: StayCategory;
  properties: SeoProperty[];
  allProperties: SeoProperty[];
  location?: LocationEntry;
  locationSummaries: LocationSummary[];
}) {
  const crumbs = categoryCrumbs(category, location);
  const inScope = properties.filter((property) => categoryFor(property).slug === category.slug);
  const types = distinctTypes(inScope);

  const intro = categoryIntro(category, inScope, locationSummaries);
  const capacity = capacityBand(inScope);
  const band = priceBand(inScope);
  const poolCount = inScope.filter((property) =>
    (property.amenities ?? []).some((amenity: string) => /pool/i.test(amenity)),
  ).length;
  const beachCount = inScope.filter(
    (property) => property.setting === "seaside" || Boolean(property.beachFrontage),
  ).length;
  const eventCount = inScope.filter((property) => property.celebration).length;

  const neighbours = location
    ? nearbyLocations(location.slug, allProperties).filter(
        (summary) => summary.entry.slug !== location.slug,
      )
    : [];

  const otherCategories = CATEGORIES.filter((entry) => entry.slug !== category.slug);

  const answerLocation = location
    ? location.name
    : locationSummaries.slice(0, 3).map((summary) => summary.entry.name).join(", ");

  return (
    <EditorialShell current={location ? undefined : category.href}>
      <JsonLd
        data={graph(
          createCollectionPageSchema({
            name: location ? `${category.plural} in ${location.name}` : category.plural,
            description: intro,
            path: location ? `${category.href}/${location.slug}` : category.href,
          }),
          createItemListSchema(
            inScope.map((property) => ({
              name: property.name,
              href: `/property/${property.id}`,
              image: property.image,
            })),
            {
              name: location ? `${category.plural} in ${location.name}` : category.plural,
              path: location ? `${category.href}/${location.slug}` : category.href,
            },
          ),
          location ? createPlaceSchema(location) : undefined,
          createBreadcrumbSchema(crumbs),
        )}
      />

      <PageHero
        crumbs={crumbs}
        eyebrow={location ? `${location.region} · ${category.plural}` : "Stay type"}
        title={headline(category, location, inScope.length)}
        lede={<p>{intro}</p>}
        meta={
          <StatStrip
            items={[
              { label: "Listings", value: String(inScope.length) },
              { label: "Sleeps", value: capacity ?? "—" },
              { label: "Nightly from", value: band ?? "—" },
              { label: "Property types", value: String(types.length) },
            ]}
          />
        }
      />

      <QuickAnswer
        question={
          location
            ? `Which ${category.plural.toLowerCase()} are available in ${location.name}?`
            : `Which ${category.plural.toLowerCase()} can I book near Chennai on 9bhk?`
        }
        answer={quickAnswer(category, inScope, location, types, capacity, band)}
      />

      <Section
        title={location ? `${category.plural} in ${location.name}` : `All ${category.plural.toLowerCase()}`}
        id="listings"
      >
        <PropertyGrid properties={inScope} priorityCount={3} />
      </Section>

      {location ? (
        <Section
          title={`About ${location.name}`}
          id="about-destination"
          description={
            <>
              <p>{location.overview}</p>
              <p>{location.reach}</p>
              {/*
                TODO(business-data): `distanceFromChennaiKm` and
                `driveTimeFromChennai` render here once the team supplies
                verified figures. They are deliberately null today rather than
                guessed.
              */}
              {location.distanceFromChennaiKm ? (
                <p>
                  {location.name} is about {location.distanceFromChennaiKm} km from Chennai
                  {location.driveTimeFromChennai ? `, roughly ${location.driveTimeFromChennai}` : ""}.
                </p>
              ) : null}
            </>
          }
        >
          <dl className="seo-facts-grid" data-cols={3}>
            {collectionFacts(inScope, {
              categoryName: category.plural,
              locationName: location.name,
            }).map((fact) => (
              <div className="seo-fact" key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : (
        <Section
          title={`What you can book as a ${category.singular.toLowerCase()} on 9bhk`}
          id="what-you-can-book"
          description="The property types actually present in this collection, taken from the listings rather than from a marketing list."
        >
          <dl className="seo-facts-grid" data-cols={3}>
            <div className="seo-fact">
              <dt>Property types</dt>
              <dd>{types.length ? types.join(", ") : "—"}</dd>
            </div>
            <div className="seo-fact">
              <dt>With a pool</dt>
              <dd>{poolCount ? `${poolCount} of ${inScope.length}` : "None listed"}</dd>
            </div>
            <div className="seo-fact">
              <dt>Beach access</dt>
              <dd>{beachCount ? `${beachCount} of ${inScope.length}` : "None listed"}</dd>
            </div>
            <div className="seo-fact">
              <dt>Event-capable</dt>
              <dd>{eventCount ? `${eventCount} of ${inScope.length}` : "None listed"}</dd>
            </div>
            <div className="seo-fact">
              <dt>Capacity</dt>
              <dd>{capacity ?? "—"}</dd>
            </div>
            <div className="seo-fact">
              <dt>Nightly rate</dt>
              <dd>{band ?? "—"}</dd>
            </div>
          </dl>
        </Section>
      )}

      {!location && locationSummaries.length ? (
        <Section
          title={`${category.plural} by destination`}
          id="by-destination"
          description="A destination sub-page only exists where this stay type has real inventory in that destination."
        >
          <ul className="seo-links">
            {locationSummaries.map((summary) => (
              <li key={summary.entry.slug}>
                <LinkTile
                  href={`${category.href}/${summary.entry.slug}`}
                  title={`${category.plural} in ${summary.entry.name}`}
                  note={`${summary.count} ${summary.count === 1 ? "listing" : "listings"}`}
                />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <FaqSection
        items={categoryFaq(
          category,
          inScope,
          locationSummaries.map((summary) => summary.entry),
        )}
        heading={location ? `${category.plural} in ${location.name}: questions` : `${category.plural}: questions`}
        headingId="category-faq-heading"
      />

      <LinkCluster
        headingId="nearby-heading"
        title={location ? `Stays near ${location.name}` : "Nearby destinations"}
        links={neighbours.map((summary) => ({
          href: `/locations/${summary.entry.slug}`,
          label: summary.entry.name,
          note: `${summary.count} ${summary.count === 1 ? "stay" : "stays"}`,
        }))}
      />

      <LinkCluster
        headingId="cross-category-heading"
        title="Other stay types"
        links={[
          ...otherCategories.map((entry) => ({
            href: entry.href,
            label: entry.plural,
            note: entry.summary.slice(0, 90).replace(/\.$/, "") + "…",
          })),
          ...(location
            ? [
                {
                  href: `/locations/${location.slug}`,
                  label: `All stays in ${location.name}`,
                  note: "Every stay type in this destination",
                },
              ]
            : [{ href: "/stays", label: "All stays on 9bhk", note: "The complete catalog" }]),
        ]}
      />

      <EditorialCta
        title={`Ready to look at the ${category.plural.toLowerCase()}?`}
        body={`Every listing is a whole house taken exclusively. Open one to see the capacity, amenities and nightly rate${
          answerLocation ? `, or compare across ${answerLocation}` : ""
        }.`}
        primary={{ href: location ? `/locations/${location.slug}` : "/stays", label: "See the listings" }}
        secondary={{ href: "/faq", label: "How booking works" }}
      />
    </EditorialShell>
  );
}

/** Metadata for a category surface. */
export function categoryMetadata(
  category: StayCategory,
  properties: SeoProperty[],
  locationSummaries: LocationSummary[],
  location?: LocationEntry,
): Metadata {
  const where = location ? location.name : locationSummaries.slice(0, 3).map((s) => s.entry.name).join(", ");
  const capacity = capacityBand(properties);
  const band = priceBand(properties);

  const title = location
    ? `${category.plural} in ${where} — ${properties.length} ${properties.length === 1 ? "stay" : "stays"}`
    : `${category.plural} near Chennai & along the coast — ${properties.length} on 9bhk`;

  const description = [
    `${properties.length} ${category.plural.toLowerCase()} on 9bhk${location ? ` in ${where}` : where ? ` across ${where}` : ""}.`,
    capacity ? `Sleeps ${capacity}.` : "",
    band ? `${band[0].toUpperCase()}${band.slice(1)}.` : "",
    "Whole house, exclusive use.",
  ]
    .filter(Boolean)
    .join(" ");

  /* Routed through the shared factory so the canonical, robots directives and
     Open Graph block are identical in shape to every other page type. */
  return buildMetadata({
    title,
    description,
    path: location ? `${category.href}/${location.slug}` : category.href,
    image: properties[0]?.image ?? null,
    imageAlt: properties[0]?.alt ?? `${category.plural} on 9bhk`,
  });
}

/** 404 helper for an inventory-gated category surface. */
export function notEnoughInventory(): never {
  notFound();
}

function headline(category: StayCategory, location: LocationEntry | undefined, count: number): string {
  if (location) {
    return `${category.plural} in ${location.name}`;
  }
  if (category.slug === "farmhouses") return "Private farmhouses & farm stays";
  if (category.slug === "beach-houses") return "Beach houses on the Coromandel Coast";
  return "Villas, bungalows & estates";
}

function quickAnswer(
  category: StayCategory,
  properties: SeoProperty[],
  location: LocationEntry | undefined,
  types: string[],
  capacity: string | null,
  band: string | null,
): string {
  const where = location ? location.name : "the Chennai coast, ECR, Pondicherry and the Tamil Nadu hills";
  const capacityText = capacity ? ` sleeping ${capacity}` : "";
  const rateText = band ? `, from ${band}` : "";
  const typeText = types.length ? ` — ${types.slice(0, 3).join(", ")}` : "";
  return `9bhk lists ${properties.length} ${category.plural.toLowerCase()} in ${where}${capacityText}${rateText}${typeText}. Each one is a whole home rented exclusively, not a room in a hotel.`;
}
