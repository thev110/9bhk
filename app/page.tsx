import type { Metadata } from "next";
import { HomeExperience } from "@/components/home-experience";
import { HomeTabBar } from "@/components/home-tab-bar";
import { HomeSeoSections } from "@/components/seo/home-seo-sections";
import { JsonLd } from "@/components/seo/json-ld";
import { getIndexableProperties } from "@/lib/server/catalog";
import { generateHomeMetadata } from "@/lib/seo/metadata";
import {
  createBreadcrumbSchema,
  createCollectionPageSchema,
  createItemListSchema,
  graph,
} from "@/lib/seo/schema";
import { SITE } from "@/lib/seo/site";
import { HomeCrumbs } from "@/lib/seo/breadcrumbs";

/**
 * `/` — the homepage.
 *
 * Now a server component. The premium hero, search bar, rails and card layout
 * are unchanged: they live in `HomeExperience`, which renders exactly what the
 * old page rendered. What changed is everything around it.
 *
 * What this fixes, and why it was previously invisible to a crawler:
 *
 *   • **A real `<h1>`.** The old page's only heading was a client-translated
 *     string inside a `"use client"` file, and the copy ("Villas built for
 *     gathering") described neither the marketplace nor the geography.
 *   • **Static metadata.** There was no `generateMetadata`, so the homepage
 *     shipped the root default — a bare "9bhk.app" with a description that
 *     contradicted the actual catalog.
 *   • **Body content.** Search engines and answer engines had a hero, a search
 *     box and five image cards to work with. The destination, stay-type,
 *     trust and FAQ content below the fold is what makes the page legible as a
 *     topic rather than a browse tool.
 *   • **Internal linking.** The homepage is now the strongest internal-link hub
 *     on the site, linking to every category, destination and guide.
 */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const properties = await getIndexableProperties();
  return generateHomeMetadata(properties);
}

export default async function HomePage() {
  const properties = await getIndexableProperties();

  return (
    <div className="app">
      {/*
        The homepage graph: the page itself, the breadcrumb and
        an `ItemList` of the featured listings. `Organization` and `WebSite` are
        declared once in the root layout; re-declaring them here would produce a
        duplicate `@id` and invalidate the whole graph.
      */}
      <JsonLd
        data={graph(
          createCollectionPageSchema({
            name: `${SITE.displayName} — private farmhouses, beach houses & villas`,
            description: SITE.description,
            path: "/",
          }),
          createItemListSchema(
            properties
              .filter((property) => property.group === "featured")
              .map((property) => ({
                name: property.name,
                href: `/property/${property.id}`,
                image: property.image,
              })),
            { name: "Featured 9bhk stays", path: "/" },
          ),
          createBreadcrumbSchema(HomeCrumbs()),
        )}
      />
      <main className="content">
        <HomeExperience hero={<HomeHeadline />} />
        <HomeSeoSections properties={properties} />
      </main>
      <HomeTabBar />
    </div>
  );
}

/**
 * The homepage H1 and lede.
 *
 * Written to name the marketplace and its geography in one line, which is the
 * single most important sentence on the page for both a first-time reader and
 * an answer engine. It is factual: the catalog really does cover farmhouses,
 * beach houses and villas across the Chennai coast, ECR and beyond.
 */
function HomeHeadline() {
  return (
    <div style={{ marginTop: 8 }}>
      <h1 style={{ marginTop: 0, fontSize: 30, lineHeight: 1.08 }}>
        Luxury farmhouses, beach houses &amp; private villas in Chennai, ECR &amp; beyond
      </h1>
      <p className="muted" style={{ fontSize: 13, marginTop: 6, maxWidth: "42ch" }}>
        Whole premium homes booked for the house — across the Chennai coast, Pondicherry and the
        Tamil Nadu hills.
      </p>
    </div>
  );
}
