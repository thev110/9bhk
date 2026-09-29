import type { Metadata } from "next";
import { EditorialShell, PageHero, Section } from "@/components/seo/page-frame";
import { JsonLd } from "@/components/seo/json-ld";
import { EditorialCta } from "@/components/seo/site-header";
import { generateContactMetadata } from "@/lib/seo/metadata";
import { createBreadcrumbSchema, createContactPageSchema, graph } from "@/lib/seo/schema";
import { staticCrumbs } from "@/lib/seo/breadcrumbs";
import { SITE } from "@/lib/seo/site";

/**
 * `/contact` — the verified contact channel, published as a real page.
 *
 * Only the email address is asserted, because that is the only contact route
 * the app has actually verified. A phone number, a street address or a
 * registered entity would be an invented business fact, so those lines are
 * marked TODO rather than filled with something plausible.
 */
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  return generateContactMetadata();
}

export default async function ContactPage() {
  const crumbs = staticCrumbs("Contact", "/contact");

  return (
    <EditorialShell current="/contact">
      <JsonLd
        data={graph(
          createContactPageSchema({
            name: `Contact ${SITE.displayName}`,
            description: `Contact the ${SITE.displayName} team about a listing, a booking or a stay.`,
            path: "/contact",
          }),
          createBreadcrumbSchema(crumbs),
        )}
      />

      <PageHero
        crumbs={crumbs}
        eyebrow="Contact"
        title={`Get in touch with ${SITE.displayName}`}
        lede={
          <p>
            One address for everything: a question about a booking, an enquiry about a property you
            want to list, or a correction to a published listing.
          </p>
        }
      />

      <Section title="Email" id="email">
        <div className="seo-copy">
          <p>
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </p>
          <p>
            Include the listing name or URL if your message is about a specific property, and the
            dates you are looking at if it is about a booking. That is usually enough for a first
            reply.
          </p>
        </div>
      </Section>

      <Section title="What to write about" id="topics">
        <div className="seo-copy">
          <ul>
            <li>
              <strong>A booking.</strong> A request is pending until the host confirms it, so if
              you have not heard back, tell us the listing and the dates.
            </li>
            <li>
              <strong>A listing.</strong> Hosts can create and edit a property from the hosting
              area after signing in — no email required.
            </li>
            <li>
              <strong>Something wrong on a page.</strong> If a listing shows a specification that
              is not true, say which listing and which field. Corrections get applied.
            </li>
            <li>
              <strong>A payment that did not go through.</strong> See the{" "}
              <a href="/legal/refunds">refund policy</a> first — it sets out the cancellation
              windows and who returns the money.
            </li>
          </ul>
        </div>
      </Section>

      <Section title="Before you write" id="before">
        <div className="seo-copy">
          <p>
            Most questions are answered faster on the <a href="/faq">frequently asked
            questions</a>, which covers how a booking request works, how payment is made, and the
            refund windows. The <a href="/legal/terms">terms</a> and <a href="/legal/privacy">privacy
            policy</a> cover what a booking costs and what 9bhk stores.
          </p>
        </div>
      </Section>

      <EditorialCta
        title="Looking for a stay?"
        body="The catalog page lists every bookable house with its capacity, amenities and nightly rate."
        primary={{ href: "/stays", label: "Browse all stays" }}
        secondary={{ href: "/faq", label: "How booking works" }}
      />
    </EditorialShell>
  );
}
