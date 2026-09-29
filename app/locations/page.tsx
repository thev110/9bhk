import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditorialShell, PageHero, Section } from "@/components/seo/page-frame";
import { PropertyGrid } from "@/components/seo/property-card";
import { LinkTile } from "@/components/seo/link-tile";
import { EditorialCta } from "@/components/seo/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { getIndexableProperties } from "@/lib/server/catalog";
import { generateLocationsIndexMetadata } from "@/lib/seo/metadata";
import { locationSummaries, publishableLocations } from "@/lib/seo/locations";
import { createBreadcrumbSchema, createItemListSchema, createCollectionPageSchema, graph } from "@/lib/seo/schema";
import { categoryFor } from "@/lib/seo/taxonomy";
import { HomeCrumbs } from "@/lib/seo/breadcrumbs";
import { SITE } from "@/lib/seo/site";

/**
 * `/locations` — destination index.
 *
 * Lists every destination with inventory, and separates the ones that clear
 * their threshold (and therefore have a page) from the ones that do not. The
 * thin ones still appear, still get an anchor, and are described by their
 * inventory rather than by invented copy — so a single-listing hill station is
 * discoverable without a page being manufactured for it.
 */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const properties = await getIndexableProperties();
  return generateLocationsIndexMetadata(locationSummaries(properties));
}

export default async function LocationsPage() {
  const properties = await getIndexableProperties();
  const summaries = locationSummaries(properties);
  const publishable = publishableLocations(properties);
  const crumbs = HomeCrumbs();

  if (!summaries.length) notFound();

  const byKind = {
    coast: summaries.filter((summary) => summary.entry.kind === "coast"),
    city: summaries.filter((summary) => summary.entry.kind === "city"),
    hills: summaries.filter((summary) => summary.entry.kind === "hills"),
    countryside: summaries.filter((summary) => summary.entry.kind === "countryside"),
  };

  const kindLabels: Record<string, string> = {
    coast: "Coastal destinations",
    city: "In and around the city",
    hills: "Hill stations",
    countryside: "Countryside",
  };

  return (
    <EditorialShell current="/locations">
      <JsonLd
        data={graph(
          createCollectionPageSchema({
            name: "Destinations on 9bhk",
            description: "Every destination with private-stay inventory on 9bhk.",
            path: "/locations",
          }),
          createItemListSchema(
            publishable.map((summary) => ({ name: summary.entry.name, href: `/locations/${summary.entry.slug}` })),
            { name: "9bhk destinations", path: "/locations" },
          ),
          createBreadcrumbSchema(crumbs),
        )}
      />

      <PageHero
        crumbs={crumbs}
        eyebrow="Where 9bhk operates"
        title="Destinations"
        lede={
          <p>
            9bhk covers the Chennai coast — ECR, Mahabalipuram, the northern beach road and the
            city neighbourhoods — plus Pondicherry, the Kanchipuram and Hosur countryside, and the
            Ooty, Kodaikanal and Courtallam hill stations. A destination gets its own page only
            where there is enough inventory there to make one useful; everything else is listed
            here and reachable from the stay it belongs to.
          </p>
        }
      />

      {(["coast", "city", "countryside", "hills"] as const)
        .filter((kind) => byKind[kind].length)
        .map((kind) => (
          <Section key={kind} title={kindLabels[kind]} id={`kind-${kind}`}>
            <ul className="seo-links">
              {byKind[kind].map((summary) => (
                <li key={summary.entry.slug}>
                  {summary.publishable ? (
                    <LinkTile
                      href={`/locations/${summary.entry.slug}`}
                      title={summary.entry.name}
                      note={`${summary.count} ${summary.count === 1 ? "stay" : "stays"} · ${summary.entry.region}`}
                    />
                  ) : (
                    /* Below the inventory threshold: listed, linked from its
                       properties, but no page of its own. */
                    <div className="seo-links-plain">
                      <strong>{summary.entry.name}</strong>
                      <span>
                        {summary.count} {summary.count === 1 ? "stay" : "stays"} ·{" "}
                        {summary.entry.region} ·{" "}
                        <Link href={`/search?city=${encodeURIComponent(summary.entry.name)}`}>
                          see the {summary.count === 1 ? "stay" : "stays"}
                        </Link>
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        ))}

      {publishable.length ? (
        <Section
          title="Most-booked destinations"
          id="popular-destinations"
          description="The destinations with the deepest inventory on 9bhk right now."
        >
          <PropertyGrid
            properties={publishable[0].properties.slice(0, 3)}
            priorityCount={1}
            showCategory={false}
          />
        </Section>
      ) : null}

      <Section title="Coverage note" id="coverage">
        <div className="seo-copy">
          <p>
            {SITE.name} only operates where it has a real listing. We do not publish destination
            pages for places we have not stayed in, and we do not list properties we cannot take a
            booking on. If a destination is not on this page, that is because nothing on it is
            bookable yet — not because the page is missing.
          </p>
          <p>
            Interested in listing a property in a destination that is not here yet?{" "}
            <a href="/contact">Get in touch</a>.
          </p>
        </div>
      </Section>

      <EditorialCta
        title="See the whole catalog"
        body="Every 9bhk listing in one place, with capacity, amenities and nightly rate on each one."
        primary={{ href: "/stays", label: "Browse all stays" }}
        secondary={{ href: "/guides", label: "Read the guides" }}
      />
    </EditorialShell>
  );
}
