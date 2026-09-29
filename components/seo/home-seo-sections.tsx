import type { SeoProperty } from "@/lib/catalog-rows";
import { Link } from "@/components/seo/link-tile";
import { FaqSection, QuickAnswer } from "@/components/seo/faq";
import { GuideCard } from "@/components/seo/guide-blocks";
import { capacityBand, joinList, listingCount, priceBand } from "@/lib/seo/copy";
import { platformFaq } from "@/lib/seo/faq";
import { CATEGORIES, categoryFor, distinctTypes } from "@/lib/seo/taxonomy";
import { locationSummaries, publishableLocations } from "@/lib/seo/locations";
import { SITE } from "@/lib/seo/site";
import { CONTENT } from "@/lib/content/guides";

/**
 * Homepage editorial layer.
 *
 * Rendered inside the app shell, below the existing hero, search bar and card
 * rails. It uses the same design tokens and typography as the rest of 9bhk, so
 * it reads as part of the product rather than an SEO block bolted underneath.
 *
 * Every section is generated from the live catalog:
 *   • the stay-type links only list categories with inventory,
 *   • the destination links only list destinations that have a page,
 *   • the "how booking works" and trust sections state the actual terms, and
 *   • the FAQ is the same `platformFaq()` array the `/faq` page renders.
 *
 * None of it is keyword filler: the words change when the inventory changes,
 * and a section with nothing behind it does not render.
 */
export function HomeSeoSections({ properties }: { properties: SeoProperty[] }) {
  const destinations = publishableLocations(properties);
  const allDestinations = locationSummaries(properties);
  const capacity = capacityBand(properties);
  const band = priceBand(properties);
  const types = distinctTypes(properties);
  const popular = properties
    .filter((property) => property.group === "popular" || property.group === "featured")
    .slice(0, 3);
  const forSale = properties.filter((property) => property.isForSale && property.salePrice);

  return (
    <div className="home-seo">
      <div className="pad">
        <QuickAnswer
          question="What is 9bhk?"
          answer={`${SITE.name} is a marketplace for whole premium private stays — farmhouses, beach houses, villas and hill-station homes — booked for the entire house rather than by the room. It currently lists ${listingCount(properties.length, "property", "properties")} across ${joinList(
            allDestinations.slice(0, 6).map((summary) => summary.entry.name),
          )}.`}
        />
      </div>

      {/* ── Stay types ─────────────────────────────────────────────────── */}
      <section className="home-seo-section" aria-labelledby="home-types-heading">
        <div className="home-seo-head">
          <h2 id="home-types-heading">Browse by stay type</h2>
        </div>
        <ul className="seo-links">
          {CATEGORIES.map((category) => {
            const scoped = properties.filter((property) => categoryFor(property).slug === category.slug);
            if (!scoped.length) return null;
            return (
              <li key={category.slug}>
                <Link
                  href={category.href}
                  label={category.plural}
                  note={`${scoped.length} ${scoped.length === 1 ? "stay" : "stays"} · ${capacityBand(scoped) ?? "various sizes"}`}
                />
              </li>
            );
          })}
          <li>
            <Link href="/stays" label="Every stay on 9bhk" note={`${properties.length} listings in total`} />
          </li>
        </ul>
      </section>

      {/* ── Destinations ───────────────────────────────────────────────── */}
      {destinations.length ? (
        <section className="home-seo-section" aria-labelledby="home-destinations-heading">
          <div className="home-seo-head">
            <h2 id="home-destinations-heading">Popular destinations</h2>
            <Link href="/locations" label="All destinations" />
          </div>
          <ul className="seo-links">
            {destinations.map((summary) => (
              <li key={summary.entry.slug}>
                <Link
                  href={`/locations/${summary.entry.slug}`}
                  label={summary.entry.name}
                  note={`${summary.count} ${summary.count === 1 ? "stay" : "stays"} · ${summary.entry.region}`}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── Popular properties ─────────────────────────────────────────── */}
      {popular.length ? (
        <section className="home-seo-section" aria-labelledby="home-popular-heading">
          <div className="home-seo-head">
            <h2 id="home-popular-heading">Popular right now</h2>
            <Link href="/stays" label="See all stays" />
          </div>
          <ul className="home-seo-list">
            {popular.map((property) => (
              <li key={property.id}>
                <Link
                  href={`/property/${property.id}`}
                  label={property.name}
                  note={`${property.type} · ${property.settingName} · sleeps ${property.guests}`}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── Why 9bhk ───────────────────────────────────────────────────── */}
      <section className="home-seo-section" aria-labelledby="home-why-heading">
        <div className="home-seo-head">
          <h2 id="home-why-heading">Why book a whole house on 9bhk</h2>
        </div>
        <div className="home-seo-cards">
          <div className="home-seo-card">
            <h3>The whole house, not a room</h3>
            <p>
              Every 9bhk listing is a private home taken exclusively for your dates. Bedrooms start
              at three because that is what a group travelling together actually needs.
            </p>
          </div>
          <div className="home-seo-card">
            <h3>The specification is the host&apos;s own</h3>
            <p>
              Capacity, bedrooms, bathrooms, amenities, nightly rate, cleaning fee — and, where the
              host has entered it, beach frontage, garage specification and event capacity. 9bhk
              does not fill in fields that have not been declared.
            </p>
          </div>
          <div className="home-seo-card">
            <h3>A booking is a request, not a charge</h3>
            <p>
              You send a request with your dates and the host confirms it. Payment goes to the
              host&apos;s own UPI ID; 9bhk does not take or hold the money.
            </p>
          </div>
          <div className="home-seo-card">
            <h3>One clear total</h3>
            <p>
              The nightly rate, the cleaning fee and 12% tax make up the whole price. There is no
              platform fee added at the end of checkout.
            </p>
          </div>
        </div>
      </section>

      {/* ── How booking works ──────────────────────────────────────────── */}
      <section className="home-seo-section" aria-labelledby="home-how-heading">
        <div className="home-seo-head">
          <h2 id="home-how-heading">How booking works</h2>
          <Link href="/faq" label="Full FAQ" />
        </div>
        <ol className="home-seo-steps">
          <li>
            <strong>Find a house.</strong> Filter by destination, stay type, guest count and the
            features that matter — pool, beach access, event capacity.
          </li>
          <li>
            <strong>Open the listing.</strong> Quick facts, the amenity list, the rate and the
            location context are all on the page before you enquire.
          </li>
          <li>
            <strong>Send a booking request.</strong> Pick your dates. The request stays pending
            until the host confirms it.
          </li>
          <li>
            <strong>Pay the published UPI ID.</strong> Keep the confirmation — the refund window
            runs from your check-in date.
          </li>
        </ol>
      </section>

      {/* ── Inventory facts ────────────────────────────────────────────── */}
      {types.length || band ? (
        <section className="home-seo-section" aria-labelledby="home-facts-heading">
          <div className="home-seo-head">
            <h2 id="home-facts-heading">The 9bhk catalog</h2>
          </div>
          <dl className="seo-inline-facts">
            <div>
              <dt>Listings</dt>
              <dd>{properties.length}</dd>
            </div>
            {capacity ? (
              <div>
                <dt>Capacity</dt>
                <dd>{capacity}</dd>
              </div>
            ) : null}
            {band ? (
              <div>
                <dt>Nightly rate</dt>
                <dd>{band}</dd>
              </div>
            ) : null}
            <div>
              <dt>Property types</dt>
              <dd>{types.length}</dd>
            </div>
            <div>
              <dt>Destinations</dt>
              <dd>{allDestinations.length}</dd>
            </div>
            {forSale.length ? (
              <div>
                <dt>Also for sale</dt>
                <dd>{forSale.length}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      {/* ── Guides ─────────────────────────────────────────────────────── */}
      {CONTENT.length ? (
        <section className="home-seo-section" aria-labelledby="home-guides-heading">
          <div className="home-seo-head">
            <h2 id="home-guides-heading">Guides</h2>
            <Link href="/guides" label="All guides" />
          </div>
          <ul className="seo-guide-grid">
            {CONTENT.slice(0, 2).map((guide) => (
              <li key={guide.slug}>
                <GuideCard guide={guide} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <FaqSection
        items={platformFaq().slice(0, 5)}
        heading="Common questions"
        headingId="home-faq-heading"
      />

      <section className="home-seo-section" aria-labelledby="home-company-heading">
        <div className="home-seo-head">
          <h2 id="home-company-heading">About 9bhk</h2>
        </div>
        <div className="home-seo-prose">
          <p>{SITE.description}</p>
          <p>
            Coverage follows inventory: 9bhk only operates where it has a real, bookable listing.{" "}
            <a href="/about">Read about how listings are published</a> or{" "}
            <a href="/contact">get in touch</a>.
          </p>
          <ul className="home-seo-links">
            <li>
              <a href="/legal/terms">Terms of service</a>
            </li>
            <li>
              <a href="/legal/privacy">Privacy policy</a>
            </li>
            <li>
              <a href="/legal/refunds">Refund policy</a>
            </li>
            <li>
              <a href="/legal/cookies">Cookie policy</a>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
