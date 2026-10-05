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
        eyebrow="About 9bhk"
        title="Reclaiming authentic gathering in private whole estates"
        lede={
          <p>
            Not a hotel, and not an apartment-sharing directory. 9bhk is an escrow-protected
            marketplace built for families, teams, and friend circles to reserve an entire private
            farmhouse, beach house, or villa — with verified functional specs, transparent pricing,
            and total privacy.
          </p>
        }
      />

      <Section title="The Problem We Are Solving" id="problem">
        <div className="seo-copy">
          <p>
            Renting a private farmhouse or seaside villa in South India has historically been an
            unorganized, high-risk ordeal. For decades, groups planning a weekend retreat along the
            ECR, Chennai coast, or Pondicherry had to rely on informal brokers, unverified Instagram
            pages, and direct UPI transfers with zero contract protection or refund guarantees.
          </p>
          <p>
            Too often, guests arrive to find unmaintained pools, unannounced on-site caretakers, or
            inadequate electrical wiring that trips the moment air conditioning and basic sound
            equipment run together.
          </p>
          <p>
            Meanwhile, global OTAs treat multi-acre estates like hotel rooms: they obscure property
            specs, ban legitimate group celebration queries, and tack on 18% to 25% surprise fees
            at the checkout screen. 9bhk was founded to eliminate this friction entirely.
          </p>
        </div>
      </Section>

      <Section title="How We Are Different" id="differentiation">
        <div className="home-seo-cards">
          <div className="home-seo-card">
            <div className="home-seo-card-badge">Difference 01 · Zero Shared Spaces</div>
            <h3>Strictly Whole Estates with a 3-Bedroom Floor</h3>
            <p>
              We never list individual rooms, homestays, or partitioned floors. Bedrooms start at
              three because true groups need undivided living rooms, private swimming pools, and
              exclusive grounds. When you book a 9bhk, the gate closes behind you.
            </p>
          </div>
          <div className="home-seo-card">
            <div className="home-seo-card-badge">Difference 02 · Functional Integrity</div>
            <h3>Direct, Verifiable Owner Specifications</h3>
            <p>
              We declare the technical metrics other sites omit: electrical load in kW, on-site
              generator capacity, sound curfews, vehicle parking slots, and exact high-tide coastal
              distance. We never inflate descriptions or invent synthetic amenities.
            </p>
          </div>
          <div className="home-seo-card">
            <div className="home-seo-card-badge">Difference 03 · Institutional Trust</div>
            <h3>Direct Razorpay Escrow Protection</h3>
            <p>
              Your payment is safeguarded in escrow via Razorpay until your arrival. Hosts receive
              predictable settlements through a 15-day clearance ledger, eliminating fraud for guests
              and arbitrary chargebacks for owners.
            </p>
          </div>
          <div className="home-seo-card">
            <div className="home-seo-card-badge">Difference 04 · Transparent Economics</div>
            <h3>Flat 10% Platform Fee, Zero Checkout Traps</h3>
            <p>
              The nightly rate, cleaning fee, and our 10% service fee are itemized upfront. There are
              no surprise resort levies, conversion fees, or hidden markups at checkout.
            </p>
          </div>
        </div>
      </Section>

      <Section title="For Whom We Build" id="audience">
        <div className="seo-copy">
          <p>
            9bhk is intentionally designed for gatherings that require space, dignity, and autonomy:
          </p>
          <ul>
            <li>
              <strong>Multi-Generational Families:</strong> Grandparents, parents, and children
              gathering for birthdays, anniversaries, and festive reunions with room to breathe.
            </li>
            <li>
              <strong>Founders &amp; Companies:</strong> Strategic offsites, hackathons, and leadership
              retreats that require high-speed connectivity, quiet grounds, and privacy.
            </li>
            <li>
              <strong>Close Friend Circles:</strong> Slow weekend getaways centered around pool
              afternoons, home-cooked feasts, and late-night conversations.
            </li>
            <li>
              <strong>Filmmakers &amp; Creators:</strong> Commercial lookbooks, video campaigns, and
              brand shoots requiring production-ready electrical loads and verified permits.
            </li>
          </ul>
        </div>
      </Section>

      <Section title="Why We Do It: The Purpose of Gathering" id="purpose">
        <div className="seo-copy">
          <p>
            Modern urban life isolates people into vertical apartments and separated hotel cubicles.
            True togetherness does not happen across hotel corridors. It happens around a shared dining
            table, in the evening breeze by a private pool, preparing breakfast in a sunlit kitchen, and
            relaxing on a lawn without strangers watching.
          </p>
          <p>
            We believe that gathering with the people who matter most is a fundamental human need. We
            build 9bhk to protect and elevate those rare days.
          </p>
        </div>
      </Section>

      <Section title="Our Impact" id="impact">
        <div className="seo-copy">
          <p>
            We are transforming South India&apos;s private estate sector from an informal, opaque
            broker economy into a transparent, institutional-grade market.
          </p>
          <p>
            For estate owners, we unlock predictable monetization for multi-crore idle assets without
            sacrificing property care. For travelers, we deliver absolute booking security, verified
            amenities, and seamless split payments.
          </p>
        </div>
      </Section>

      <Section title="Built by Rathnavel Karthi" id="creator">
        <div className="seo-copy">
          <p>
            Rathnavel Karthi is an independent product builder and full-stack developer from
            Chennai, India, focused on turning ideas into real-world digital products.
          </p>
          <p>
            His work spans software products, AI-powered applications, automation systems, web
            platforms, SaaS products, digital experiences and business-focused technology solutions.
          </p>
          <p>
            He combines product thinking, software development, AI, automation, UX and rapid
            experimentation to take products from concept to production. The goal is simple:
            Build useful technology, ship it fast, and continuously improve it.
          </p>
          <p style={{ marginTop: 16 }}>
            <a
              href="https://www.linkedin.com/in/rathnavel-karthi-114991135/"
              target="_blank"
              rel="noopener noreferrer"
              className="seo-creator-link"
              aria-label="Connect with Rathnavel Karthi on LinkedIn"
            >
              Connect with Rathnavel Karthi on LinkedIn →
            </a>
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
            shapes your experience far more than price alone.
          </p>
        </div>
      </Section>

      <Section title="Where 9bhk operates" id="coverage">
        <div className="seo-copy">
          <p>
            Coverage follows inventory, not ambition. 9bhk currently operates bookable houses across{" "}
            {destinations.map((summary) => summary.entry.name).join(", ")}, with verified coastal
            and countryside inventory expanding deliberately.
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
