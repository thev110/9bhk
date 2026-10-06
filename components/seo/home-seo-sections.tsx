import type { SeoProperty } from "@/lib/catalog-rows";
import NextLink from "next/link";
import { Link } from "@/components/seo/link-tile";
import { FaqSection, QuickAnswer } from "@/components/seo/faq";
import { GuideCard } from "@/components/seo/guide-blocks";
import { capacityBand, joinList, listingCount, priceBand } from "@/lib/seo/copy";
import { platformFaq } from "@/lib/seo/faq";
import { CATEGORIES, categoryFor, distinctTypes } from "@/lib/seo/taxonomy";
import { locationSummaries, publishableLocations } from "@/lib/seo/locations";
import { SITE } from "@/lib/seo/site";
import { CONTENT } from "@/lib/content/guides";
import { CreatorAttribution } from "@/components/creator-attribution";

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
          question="What is 9bhk (9bhk.app)?"
          answer={`${SITE.displayName} is India's dedicated marketplace for whole-property private farmhouses, beach houses, and luxury villas in Chennai, ECR (East Coast Road), Mahabalipuram, and Pondicherry. Named after grand gathering estates, 9bhk exclusively lists entire private compounds (from 3 BHK up to 9+ BHK properties with private pools and lawns) for group stays, family reunions, creator shoots, and private acquisitions.`}
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
                <NextLink
                  href={`/property/${property.id}`}
                  className="home-popular-item"
                  aria-label={`${property.name}, ${property.type} in ${property.settingName}, sleeps ${property.guests}, ₹${property.price.toLocaleString("en-IN")} per night`}
                >
                  <div className="home-popular-thumb">
                    <img
                      src={property.image}
                      alt={property.alt || property.name}
                      width={160}
                      height={120}
                      className="home-popular-img"
                      loading="lazy"
                    />
                    <span className="home-popular-tag">
                      {property.settingName.split("·")[0]?.trim() || property.type}
                    </span>
                  </div>
                  <div className="home-popular-info">
                    <strong className="home-popular-title">{property.name}</strong>
                    <p className="home-popular-spec">
                      <span>{property.type}</span>
                      <span className="home-popular-sep" aria-hidden="true">·</span>
                      <span>{property.bedrooms} BHK</span>
                      <span className="home-popular-sep" aria-hidden="true">·</span>
                      <span>Sleeps {property.guests}</span>
                    </p>
                    <div className="home-popular-meta-row">
                      <span className="home-popular-rate">
                        <strong className="num">₹{property.price.toLocaleString("en-IN")}</strong>
                        <small>/ night</small>
                      </span>
                      {property.rating ? (
                        <span className="home-popular-score" aria-label={`Rating ${property.rating} of 5`}>
                          <svg className="home-star" viewBox="0 0 20 20" fill="currentColor" width="12" height="12" aria-hidden="true">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="num">{property.rating.toFixed(2)}</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="home-popular-affordance" aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 4l6 6-6 6" />
                    </svg>
                  </div>
                </NextLink>
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
            <div className="home-seo-card-badge">01 · Exclusive Gathering</div>
            <h3>The whole house, not a room</h3>
            <p>
              Every 9bhk listing is a private home reserved exclusively for your group. Bedrooms start
              at three because genuine gatherings need dedicated space, total privacy, and communal living.
            </p>
          </div>
          <div className="home-seo-card">
            <div className="home-seo-card-badge">02 · Verified Direct Specs</div>
            <h3>The specification is the host&apos;s own</h3>
            <p>
              Capacity, bedrooms, amenities, generator capacity, and beach frontage are declared directly by verified owners. 9bhk never inflates specs or creates synthetic amenities.
            </p>
          </div>
          <div className="home-seo-card">
            <div className="home-seo-card-badge">03 · Escrow Protection</div>
            <h3>Direct Razorpay escrow protection</h3>
            <p>
              Your payment is safeguarded in escrow via Razorpay until check-in. Hosts receive transparent payouts following a 15-day clearance window, ensuring full dispute protection.
            </p>
          </div>
          <div className="home-seo-card">
            <div className="home-seo-card-badge">04 · Transparent Fee</div>
            <h3>One clear total, zero checkout surprises</h3>
            <p>
              The nightly rate, cleaning fee, and standard 10% platform fee are itemized upfront. No hidden resort fees or inflated final screens when you confirm your reservation.
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
            <strong>Confirm with secure payment.</strong> Pay seamlessly with UPI or card via Razorpay escrow. Funds are held safely with clear cancellation protections until your arrival.
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
              <a href="/credits">The Creator</a>
            </li>
            <li>
              <a href="/creators">Creators &amp; Shoots</a>
            </li>
            <li>
              <a href="/developers">Developers &amp; API</a>
            </li>
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
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid color-mix(in oklch, var(--fg) 10%, transparent)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, fontSize: 12.5 }}>
            <span className="muted">© {new Date().getFullYear()} {SITE.displayName}. All rights reserved.</span>
            <CreatorAttribution variant="footer" />
          </div>
        </div>
      </section>
    </div>
  );
}
