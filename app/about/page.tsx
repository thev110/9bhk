import type { Metadata } from "next";
import { EditorialShell, PageHero, Section } from "@/components/seo/page-frame";
import { LinkCluster } from "@/components/seo/link-tile";
import { JsonLd } from "@/components/seo/json-ld";
import { EditorialCta } from "@/components/seo/site-header";
import { generateAboutMetadata } from "@/lib/seo/metadata";
import { createAboutPageSchema, createBreadcrumbSchema, graph } from "@/lib/seo/schema";
import { staticCrumbs } from "@/lib/seo/breadcrumbs";
import { SITE } from "@/lib/seo/site";
import { CATEGORIES } from "@/lib/seo/taxonomy";
import { getIndexableProperties } from "@/lib/server/catalog";
import { publishableLocations } from "@/lib/seo/locations";
import { SETTINGS, SETTING_LABEL } from "@/lib/properties";

/**
 * `/about` — entity consistency.
 *
 * Exists so the brand has one canonical statement of what it is, which coverage
 * it has and how a listing is published. That statement is the same string used
 * in the `Organization` schema, the footer and the root metadata, which is what
 * keeps the entity description consistent across the site.
 *
 * No company registration details are asserted: the legal entity, registered
 * address and social profiles are not yet confirmed, so they are marked
 * TODO rather than filled in.
 */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return generateAboutMetadata();
}

export default async function AboutPage() {
  const properties = await getIndexableProperties();
  const destinations = publishableLocations(properties);
  const crumbs = staticCrumbs("About", "/about");

  return (
    <EditorialShell current="/about">
      <JsonLd
        /*
          `Organization` is declared once in the root layout and referenced by
          `@id`; re-declaring it here would duplicate the identifier.
        */
        data={graph(
          createAboutPageSchema({
            name: `About ${SITE.displayName}`,
            description: SITE.description,
            path: "/about",
          }),
          createBreadcrumbSchema(crumbs),
        )}
      />

      <PageHero
        crumbs={crumbs}
        eyebrow="About"
        title={`${SITE.displayName} is a marketplace for whole premium stays`}
        lede={
          <p>
            Not a hotel, and not a room-sharing site. 9bhk is a place to find a private farmhouse,
            beach house, villa or hill-station home and take the whole thing for a weekend — booked
            for the house, with the capacity, the amenities and the rate stated up front.
          </p>
        }
      />

      <Section title="What 9bhk is" id="what">
        <div className="seo-copy">
          <p>
            Every listing on 9bhk is a whole home. That is the product decision the whole site is
            built around: bedrooms start at three because a two-bedroom apartment is not what a
            group travelling together needs, and pricing is per house per night because there is no
            room to divide.
          </p>
          <p>
            A booking on 9bhk is a request. You pick a house and your dates, the host confirms, and
            you pay the UPI ID the host has published. 9bhk does not take the money and does not
            hold it in escrow — which is stated plainly on the{" "}
            <a href="/legal/terms">terms</a> and <a href="/legal/refunds">refund policy</a> rather
            than left for a guest to discover at checkout.
          </p>
        </div>
      </Section>

      <Section title="What you can book" id="categories">
        <div className="seo-copy">
          <ul>
            {CATEGORIES.map((category) => (
              <li key={category.slug}>
                <a href={category.href}>{category.plural}</a> — {category.summary}
              </li>
            ))}
          </ul>
          <p>
            Listings are also grouped by setting —{" "}
            {SETTINGS.map((setting) => SETTING_LABEL[setting].toLowerCase()).join(", ")} — which
            changes what a stay is actually like far more than the price does. The{" "}
            <a href="/guides/private-stays-near-chennai">guide to choosing a stay near Chennai</a>{" "}
            sets out the trade-offs.
          </p>
        </div>
      </Section>

      <Section title="Where 9bhk operates" id="coverage">
        <div className="seo-copy">
          <p>
            Coverage follows inventory, not ambition. 9bhk currently has bookable houses across{" "}
            {destinations.map((summary) => summary.entry.name).join(", ")}, plus destinations where
            the inventory is still a single house and a destination page would be too thin to
            publish. The full list is on the <a href="/locations">destinations page</a>.
          </p>
        </div>
      </Section>

      <Section title="How a listing is published" id="listings">
        <div className="seo-copy">
          <p>
            A host enters the property's own details: name, type, location, guest capacity, bedroom
            and bathroom counts, the amenity list, the nightly rate, the cleaning fee, and — where
            it applies — beach frontage, coastal zone, distance from the high-tide line, a garage
            specification, event capacity, sale price and land area.
          </p>
          <p>
            9bhk does not fill in fields a host has not entered, and it does not infer them. A
            listing with no pool simply has no pool line. That is why the quick-facts table on a
            property page is sometimes shorter than the one beside it — the difference is the host's
            data, not a rendering error.
          </p>
          <p>
            Hosts create and edit listings from the hosting area after signing in. Search engines
            are excluded from that area entirely.
          </p>
        </div>
      </Section>

      <Section title="How 9bhk is paid" id="money">
        <div className="seo-copy">
          <p>
            Payment goes to the host's own UPI ID. There is no platform fee added at the end of
            checkout: the total is the nightly rate, the cleaning fee and 12% tax, and that is what
            you are shown before you pay. The full terms are on the{" "}
            <a href="/legal/terms">terms page</a>.
          </p>
        </div>
      </Section>

      <Section title="Contact" id="contact">
        <div className="seo-copy">
          <p>
            The verified contact channel today is email: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
            Use it for a booking question, a listing enquiry, or to report a problem with a
            published listing.
          </p>
          <p>
            {/* TODO(business-data): publish the registered entity name, the
                registered address and a support phone number once the business
                details are confirmed. They are intentionally absent rather than
                guessed. */}
            A support phone number and the registered business address are not yet published.
          </p>
        </div>
      </Section>

      <LinkCluster
        headingId="about-links-heading"
        title="Start here"
        links={[
          { href: "/stays", label: "All stays on 9bhk", note: "The complete catalog" },
          { href: "/locations", label: "Destinations", note: "Where 9bhk operates" },
          { href: "/guides", label: "Guides", note: "Planning help before you book" },
          { href: "/faq", label: "Frequently asked questions", note: "How booking works" },
          { href: "/contact", label: "Contact", note: SITE.email },
        ]}
      />

      <EditorialCta
        title="See what is available"
        body="Every listing shows the capacity, amenities and nightly rate its host has published — no hidden quote step."
        primary={{ href: "/stays", label: "Browse all stays" }}
        secondary={{ href: "/faq", label: "How booking works" }}
      />
    </EditorialShell>
  );
}
