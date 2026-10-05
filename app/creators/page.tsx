import type { Metadata } from "next";
import { EditorialShell, PageHero, Section } from "@/components/seo/page-frame";
import { LinkCluster } from "@/components/seo/link-tile";
import { JsonLd } from "@/components/seo/json-ld";
import { generateCreatorsMetadata } from "@/lib/seo/metadata";
import { createAboutPageSchema, createBreadcrumbSchema, graph } from "@/lib/seo/schema";
import { staticCrumbs } from "@/lib/seo/breadcrumbs";
import { SITE } from "@/lib/seo/site";
import { getIndexableProperties } from "@/lib/server/catalog";
import { publishableLocations } from "@/lib/seo/locations";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return generateCreatorsMetadata();
}

export default async function CreatorsPage() {
  const properties = await getIndexableProperties();
  const destinations = publishableLocations(properties);
  const crumbs = staticCrumbs("Creators & Partners", "/creators");

  return (
    <EditorialShell current="/creators">
      <JsonLd
        data={graph(
          createAboutPageSchema({
            name: `Creators & Production Partnerships — ${SITE.displayName}`,
            description:
              "Partner with 9bhk for brand campaigns, architectural photography, film shoots, and creator stays across private farmhouses and luxury estates in Chennai & ECR.",
            path: "/creators",
          }),
          createBreadcrumbSchema(crumbs),
        )}
      />

      <PageHero
        crumbs={crumbs}
        eyebrow="Creators & Production"
        title="Film, shoot and create at South India's finest private estates"
        lede={
          <p>
            From dramatic beachfront infinity pools along the ECR to secluded orchard compounds in
            Chengalpattu, 9bhk connects lifestyle creators, fashion houses, film crews, and brands
            with verified whole-house locations built for visual storytelling.
          </p>
        }
      />

      <Section title="Collaboration Tracks" id="creators-tracks">
        <div className="seo-prose">
          <p>
            Every 9bhk estate is privately owned and rented as an exclusive whole property. We offer
            three primary collaboration pathways for creators and creative agencies:
          </p>
        </div>
        <div className="home-seo-cards" style={{ marginTop: 20 }}>
          <div className="home-seo-card">
            <div className="home-seo-card-badge">01 · Hosted Stays</div>
            <h3>Architectural &amp; Lifestyle Creator Stays</h3>
            <p>
              We sponsor experiential weekend residencies for verified travel photographers, interior
              designers, and lifestyle creators. Share the unhurried craft of private gathering with your
              audience while enjoying exclusive estate amenities.
            </p>
          </div>
          <div className="home-seo-card">
            <div className="home-seo-card-badge">02 · Commercial Shoots</div>
            <h3>Fashion Lookbooks, Music Videos &amp; Campaigns</h3>
            <p>
              Book multi-acre private estates with verified power infrastructure (up to 40 kW sanctioned
              load), generator backups, dedicated green rooms, and caterer kitchens. Guaranteed privacy
              with zero tourist interruptions.
            </p>
          </div>
          <div className="home-seo-card">
            <div className="home-seo-card-badge">03 · Affiliate Partner</div>
            <h3>Creator Referral &amp; Booking Commission</h3>
            <p>
              Curate and recommend your favorite 9bhk villas to your community. Earn standard
              commissions on confirmed reservations with transparent real-time tracking.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Production-Ready Specifications" id="creators-specs">
        <div className="seo-prose">
          <p>
            Unlike typical vacation listings that ban cameras or spring surprise location surcharges,
            9bhk properties declare their commercial capabilities upfront:
          </p>
          <ul>
            <li>
              <strong>Verified electrical load:</strong> Sanctioned kW ratings and on-site diesel
              generators that easily power heavy HMIs, arri fixtures, and lighting rigs.
            </li>
            <li>
              <strong>Sound curfew clarity:</strong> Explicit operational hours for amplified audio
              and playback during shoots.
            </li>
            <li>
              <strong>Parking &amp; vanity logistics:</strong> Dedicated off-street parking for
              equipment vans, catering trucks, and crew vehicles.
            </li>
            <li>
              <strong>Direct beach frontage:</strong> Unobstructed private access to the Bay of
              Bengal for golden-hour coastal frames.
            </li>
          </ul>
        </div>
      </Section>

      <Section title="How to Apply" id="creators-apply">
        <aside className="seo-factbox">
          <h3>Apply for Creator Residency or Shoot Permissions</h3>
          <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--ink)" }}>
            Send your portfolio, agency deck, or channel handles along with proposed dates to our
            partnerships desk:
          </p>
          <dl>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${SITE.email}?subject=[Creator%20Application]%20`}>{SITE.email}</a>
              </dd>
            </div>
            <div>
              <dt>Required info</dt>
              <dd>Handle/deck, crew size, requested property, proposed dates &amp; deliverables</dd>
            </div>
            <div>
              <dt>Response time</dt>
              <dd>Within 24 to 48 business hours</dd>
            </div>
          </dl>
        </aside>
      </Section>

      <LinkCluster
        title="Explore Featured Stays"
        headingId="creators-browse-heading"
        links={destinations.slice(0, 4).map((d) => ({
          href: `/locations/${d.entry.slug}`,
          label: `${d.entry.name} Private Stays`,
          note: `${d.count} verified whole estates`,
        }))}
      />
    </EditorialShell>
  );
}
