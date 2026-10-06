"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PageBar, Shell } from "@/components/shell";
import { useStore } from "@/lib/store";
import { Icon, settingIcon } from "@/components/icon";
import { Rating } from "@/components/cards";
import { useCatalog } from "@/lib/catalog";
import { formatInrCrores, hasGarage, isSeaside } from "@/lib/properties";
import { BaseSheet } from "@/components/base-sheet";
import NumberFlow from "@number-flow/react";
import { useT } from "@/lib/i18n";
import { settingLabel } from "@/lib/i18n/vibes";
import type { SeoProperty } from "@/lib/catalog-rows";
import type { JsonLd as JsonLdNode } from "@/lib/seo/schema";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { FaqSection } from "@/components/seo/faq";
import { propertyFacts } from "@/components/seo/quick-facts";
import { categoryFor } from "@/lib/seo/taxonomy";
import { locationFor } from "@/lib/seo/locations";
import { propertyCrumbs } from "@/lib/seo/breadcrumbs";
import { propertyFaq } from "@/lib/seo/faq";
import { propertyPageSchema } from "@/lib/seo/schema";
import { relatedWithFallback } from "@/lib/seo/related";
import { guidesForListing } from "@/lib/content/guides";

/**
 * Interactive half of the property page.
 *
 * The server wrapper at `app/property/[slug]/page.tsx` owns `generateMetadata`,
 * `generateStaticParams` and the 404 path; this component owns everything that
 * needs browser state (saved toggle, booking CTA, walkthrough sheet).
 *
 * SEO-critical blocks — breadcrumbs, the spec table, the answer-engine FAQ and
 * the related-stay links — are rendered here but computed from
 * `useCatalog()` using the same pure builders the server uses. Because the
 * catalog provider initialises with the static catalog, all of that text is in
 * the server-rendered HTML on the first byte, not injected after hydration.
 */
export function PropertyExperience({
  slug,
  initialProperty,
  schema,
}: {
  slug: string;
  /**
   * The listing as the **server** resolved it. The browser catalog initialises
   * from the static seed list and only merges Supabase rows in an effect, so
   * without this a host-published listing server-renders its "gone" state and a
   * crawler sees a soft 404. The client catalog still wins once it catches up,
   * because it is the fresher of the two.
   */
  initialProperty?: SeoProperty;
  /** JSON-LD built on the server from the same listing. */
  schema?: JsonLdNode;
}) {
  const { properties } = useCatalog();
  const property = properties.find((item) => item.id === slug) ?? initialProperty;
  const { user, isSaved, toggleSaved, showToast, presentationMode, setPresentationMode, addViewingRequest } = useStore();
  const t = useT();

  const [viewingModalOpen, setViewingModalOpen] = useState(false);
  const [buyerName, setBuyerName] = useState(user?.name || "");
  const [buyerPhone, setBuyerPhone] = useState(user?.phone || "");
  const [buyerNote, setBuyerNote] = useState("");
  const [submittedViewing, setSubmittedViewing] = useState(false);

  if (!property) {
    return (
      <Shell>
        <PageBar title={t("detail.estate")} backHref="/" />
        <div className="empty">
          <h3>{t("detail.gone")}</h3>
          <Link className="btn" href="/search">
            {t("detail.exploreStays")}
          </Link>
          {/* Crawlable fallbacks: a slug the server could not resolve still needs
              to offer a real next step rather than a dead end. */}
          <div className="mt stack sm" style={{ padding: "0 20px", maxWidth: 420 }}>
            <Link className="btn outline" href="/stays">
              Browse all stays
            </Link>
            <Link className="btn outline" href="/locations">
              Browse by destination
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  const seaside = isSeaside(property);
  const garage = hasGarage(property) ? property.garage : undefined;
  // Optional, like the garage: a house not set up for functions simply has no
  // event spec, and the page never invents one.
  const celebration = property.celebration;

  async function handleRequestViewing(e: React.FormEvent) {
    e.preventDefault();
    if (!property) return;
    if (!buyerName.trim() || !buyerPhone.trim()) {
      showToast(t("toast.needNamePhone"));
      return;
    }
    setSubmittedViewing(true);
    try {
      await addViewingRequest({
        propertyId: property.id,
        propertyName: property.name,
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        buyerEmail: user?.email,
        notes: buyerNote.trim() || undefined,
      });
    } catch {
      /* ignore if offline */
    }
    showToast(t("toast.viewingReceived"));
    setTimeout(() => {
      setViewingModalOpen(false);
      setSubmittedViewing(false);
    }, 2000);
  }

  const stats = [
    t("detail.statGuests", { n: property.guests }),
    t("detail.statSuites", { n: property.bedrooms }),
    t("detail.statBeds", { n: property.beds }),
    t("detail.statBaths", { n: property.bathrooms }),
  ];

  return (
    <Shell dock="bar">
      <PropertySeoBlocks property={property} serverSchema={schema} />
      <PageBar
        title={property.name}
        backHref="/"
        right={
          <button
            className="icon-btn"
            type="button"
            aria-pressed={isSaved(property.id)}
            aria-label={t(isSaved(property.id) ? "a11y.removeName" : "a11y.saveName", { name: property.name })}
            onClick={() => {
              toggleSaved(property.id);
              showToast(t(isSaved(property.id) ? "toast.removed" : "toast.saved", { name: property.name }));
            }}
          >
            <Icon name={isSaved(property.id) ? "heart-fill" : "heart"} />
          </button>
        }
      />

      {presentationMode ? (
        <div
          style={{
            margin: "8px 16px 0",
            padding: "8px 12px",
            background: "var(--surface)",
            border: "1px solid var(--forest)",
            borderRadius: "var(--r-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "var(--sh-xs)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="pill forest" style={{ fontSize: 11, padding: "2px 8px" }}>
              {t("detail.presentationMode")}
            </span>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
              {t("detail.presentationSub")}
            </span>
          </div>
          <button
            type="button"
            className="btn ghost sm"
            style={{ fontSize: 11, padding: "4px 8px", height: "auto" }}
            onClick={() => {
              setPresentationMode(false);
              showToast(t("toast.exitedPresentation"));
            }}
          >
            {t("action.exit")}
          </button>
        </div>
      ) : null}

      <div className="gal" style={{ marginTop: 12 }}>
        <div className="gal-hero">
          <Image
            src={property.image}
            alt={property.alt || property.name}
            fill
            priority
            quality={78}
            sizes="(max-width: 768px) 100vw, 860px"
            style={{
              objectFit: "cover",
              borderRadius: "var(--r-lg)",
            }}
          />
        </div>
      </div>
      <p className="pad muted" style={{ marginTop: 8, fontSize: 13, fontWeight: 700 }}>
        {t("detail.morePhotos")}
      </p>

      <div className="pad mt stack">
        <div>
          <div className="between">
            <p className="muted" style={{ fontSize: 13, fontWeight: 700 }}>
              {property.type} · {settingLabel(t, property.setting)}
            </p>
            {property.isForSale ? (
              <span className="pill info" style={{ fontWeight: 800 }}>
                {t("property.listedForSale")}
              </span>
            ) : null}
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 32, lineHeight: 1.1, marginTop: 4 }}>
            {property.name}
          </h2>
          <p className="p-loc">{property.settingName}</p>
          <div className="row wrap mt" style={{ marginTop: 8, gap: 6 }}>
            <Rating rating={property.rating} reviews={property.reviews} />
            {property.guestFavourite ? <span className="pill ok">{t("property.guestFavourite")}</span> : null}
            <span className="pill forest">
              <Icon name={settingIcon(property.setting)} style={{ width: 12, height: 12 }} />
              {property.settingDetail}
            </span>
            {seaside && property.tideDistanceMeters ? (
              <span className="pill muted">{t("detail.tideBoundary", { m: property.tideDistanceMeters })}</span>
            ) : null}
          </div>
        </div>

        {/* Acquisition Showcase (If Listed For Sale) */}
        {property.isForSale && property.salePrice ? (
          <div className="card" style={{ border: "1.5px solid var(--terracotta)", background: "var(--surface)" }}>
            <div className="between">
              <span className="p-sale-tag" style={{ margin: 0, textTransform: "uppercase", fontSize: 12, letterSpacing: ".08em" }}>
                {t("detail.acquisitionOpportunity")}
              </span>
              <span className="pill forest" style={{ fontSize: 11 }}>{t("detail.clearTitle")}</span>
            </div>
            <div className="between mt" style={{ alignItems: "baseline" }}>
              <div>
                <p className="nb" style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "var(--forest)" }}>
                  {formatInrCrores(property.salePrice)}
                </p>
                <p className="sub" style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                  {t("detail.groundAndTitle", {
                    ground: property.landArea || t("detail.estateGround"),
                  })}
                </p>
              </div>
              <button
                className="btn accent sm"
                type="button"
                onClick={() => setViewingModalOpen(true)}
              >
                {t("detail.scheduleWalkthroughShort")}
              </button>
            </div>
          </div>
        ) : null}

        {/* Space Stats */}
        <div className="stats">
          {stats.map((label) => (
            <div key={label} className="stat">
              <p className="nb" style={{ fontSize: 15, fontWeight: 700 }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Setting & Grounds — every listing gets this. The shoreline
            sub-block below only renders for beachfront properties. */}
        <div>
          <h3 className="sec-title">{t("detail.settingTitle")}</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            {t("detail.settingBody")}
          </p>
          <div className="spec-grid">
            <div className="spec-box">
              <span className="k">{t("detail.settingLabel")}</span>
              <span className="v">
                <Icon name={settingIcon(property.setting)} style={{ width: 14, height: 14, color: "var(--moss)" }} />
                {settingLabel(t, property.setting)}
              </span>
              <span className="sub">{t("detail.subVerifiedSetting")}</span>
            </div>
            <div className="spec-box">
              <span className="k">{t("detail.settingDetailLabel")}</span>
              <span className="v">{property.settingDetail}</span>
              <span className="sub">{property.settingName}</span>
            </div>
            <div className="spec-box">
              <span className="k">{t("detail.landAreaLabel")}</span>
              <span className="v">{property.landArea || "—"}</span>
              <span className="sub">{t("detail.subNoLandRecord")}</span>
            </div>
            <div className="spec-box">
              <span className="k">{t("detail.statSuites", { n: property.bedrooms })}</span>
              <span className="v">{property.guests}</span>
              <span className="sub">{t("detail.statGuests", { n: property.guests })}</span>
            </div>
          </div>
        </div>

        {/* Shoreline — beachfront listings only */}
        {seaside ? (
          <div>
            <h3 className="sec-title">{t("detail.shorelineTitle")}</h3>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {t("detail.shorelineBody")}
            </p>
            <div className="spec-grid">
              <div className="spec-box">
                <span className="k">{t("detail.beachFrontageLabel")}</span>
                <span className="v">
                  <Icon name="waves" style={{ width: 14, height: 14, color: "var(--moss)" }} />
                  {property.beachFrontage}
                </span>
                <span className="sub">{t("detail.subUninterrupted")}</span>
              </div>
              <div className="spec-box">
                <span className="k">{t("detail.highTideLine")}</span>
                <span className="v">{t("detail.meters", { n: property.tideDistanceMeters ?? 0 })}</span>
                <span className="sub">{t("detail.subDirectOcean")}</span>
              </div>
              <div className="spec-box">
                <span className="k">{t("detail.sandAccess")}</span>
                <span className="v">{t("detail.privateBoardwalk")}</span>
                <span className="sub">{t("detail.subGateToDune")}</span>
              </div>
              <div className="spec-box">
                <span className="k">{t("detail.coastalZone")}</span>
                <span className="v">{property.coastalZone}</span>
                <span className="sub">{t("detail.subVerifiedClearance")}</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Garage — only when the listing has a garage spec */}
        {garage ? (
          <div>
            <div className="between">
              <h3 className="sec-title">{t("detail.garageTitle")}</h3>
              <span className="pill forest">
                <Icon name="car" style={{ width: 13, height: 13 }} />
                {t("detail.vehicleCapacity", { n: garage.capacity })}
              </span>
            </div>
            <p className="mt" style={{ fontSize: 13.5, color: "var(--fg)", lineHeight: 1.5 }}>
              {garage.description}
            </p>
            <div className="spec-grid">
              <div className="spec-box">
                <span className="k">{t("detail.garageArchitecture")}</span>
                <span className="v">{garage.name}</span>
                <span className="sub">{t("detail.subClimateSealed")}</span>
              </div>
              <div className="spec-box">
                <span className="k">{t("detail.supercarLowRamp")}</span>
                <span className="v">
                  {t(garage.supercarFriendly ? "detail.rampReady" : "detail.standardIncline")}
                </span>
                <span className="sub">{t(garage.supercarFriendly ? "detail.subZeroScrape" : "detail.subSuvCruiser")}</span>
              </div>
              <div className="spec-box">
                <span className="k">{t("detail.evHighOutput")}</span>
                <span className="v">
                  <Icon name="bolt" style={{ width: 14, height: 14, color: "var(--primary)" }} />
                  {garage.evChargingKw > 0 ? t("detail.kwOutput", { kw: garage.evChargingKw }) : t("detail.noCharging")}
                </span>
                <span className="sub">{t("detail.subLoadBalancer")}</span>
              </div>
              <div className="spec-box">
                <span className="k">{t("detail.washdownBay")}</span>
                <span className="v">{t(garage.washdownStation ? "detail.deionized" : "detail.standardWash")}</span>
                <span className="sub">{t("detail.subStripsMist")}</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="sec-title">{t("detail.noGarageTitle")}</h3>
            <p className="mt" style={{ fontSize: 13.5, color: "var(--fg)", lineHeight: 1.5 }}>
              {t("detail.noGarageBody")}
            </p>
          </div>
        )}

        {/* Celebration capacity — only when the house is genuinely set up for events */}
        {celebration ? (
          <div>
            <div className="between">
              <h3 className="sec-title">{t("celebration.sectionTitle")}</h3>
              <span className="pill info" style={{ fontWeight: 800 }}>
                <Icon name="users" style={{ width: 13, height: 13 }} />
                {t("celebration.capacityValue", { n: celebration.maxEventGuests })}
              </span>
            </div>
            <div className="spec-grid mt">
              <div className="spec-box">
                <span className="k">{t("celebration.fieldPower")}</span>
                <span className="v">{t("celebration.powerValue", { kw: celebration.powerLoadKw })}</span>
              </div>
              <div className="spec-box">
                <span className="k">{t("celebration.fieldCurfew")}</span>
                <span className="v">{t("celebration.curfewValue", { hour: celebration.soundCurfewHour })}</span>
              </div>
              <div className="spec-box">
                <span className="k">{t("celebration.fieldParking")}</span>
                <span className="v">{t("celebration.parkingValue", { n: celebration.parkingCars })}</span>
              </div>
              <div className="spec-box">
                <span className="k">{t("celebration.fieldGenerator")}</span>
                <span className="v">{t("celebration.generatorValue", { kw: celebration.generatorKw })}</span>
              </div>
              <div className="spec-box">
                <span className="k">{t("celebration.fieldCatering")}</span>
                <span className="v">
                  {t(celebration.catererKitchen ? "celebration.catererYes" : "celebration.catererNo")}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <div>
          <h3 className="sec-title">{t("detail.aboutTitle")}</h3>
          <p className="mt" style={{ lineHeight: 1.6 }}>{property.blurb}</p>
        </div>

        <div>
          <h3 className="sec-title">{t("detail.amenitiesTitle")}</h3>
          <div className="amen mt">
            {property.amenities.map((item) => (
              <div className="a" key={item}>
                <Icon name="check" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="sec-title">{t("detail.whereTitle")}</h3>
          <p className="muted">{t("detail.whereBody")}</p>
          <div className="card mt" style={{ minHeight: 140, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>
              {property.settingName} · {settingLabel(t, property.setting)}
            </span>
          </div>
          <LocationLinkRow property={property} />
        </div>

        <div>
          <h3 className="sec-title">{t("detail.covenantsTitle")}</h3>
          <ul className="stack sm" style={{ paddingLeft: 18, marginTop: 10 }}>
            <li>{t("detail.covenant1")}</li>
            <li>{t("detail.covenant2")}</li>
            <li>{t("detail.covenant3")}</li>
            <li>{t("detail.covenant4")}</li>
          </ul>
        </div>

        <PropertySeoBlocks property={property} variant="tail" serverSchema={schema} />
      </div>

      {/* Sticky Action Bar */}
      <div className="stickybar">
        <div>
          {property.isForSale && property.salePrice ? (
            <div>
              <p className="p-price num" style={{ margin: 0, color: "var(--forest)", fontSize: 17 }}>
                {formatInrCrores(property.salePrice)}
              </p>
              <p className="muted" style={{ fontSize: 11, margin: 0 }}>
                {t("detail.askingOrStay", { price: property.price.toLocaleString("en-IN") })}
              </p>
            </div>
          ) : (
            <div>
              <p className="p-price num" style={{ margin: 0 }}>
                <NumberFlow value={property.price} prefix="₹" /> <span className="per">{t("property.perNight")}</span>
              </p>
              <p className="muted" style={{ fontSize: 12 }}>
                {t("detail.exclusiveStay")}
              </p>
            </div>
          )}
        </div>
        <div className="row" style={{ gap: 8 }}>
          {presentationMode ? (
            <>
              <button
                className="btn outline sm"
                type="button"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    showToast(t("toast.linkCopied"));
                  }
                }}
              >
                {t("action.copyLink")}
              </button>
              <button
                className="btn accent sm"
                type="button"
                onClick={() => setViewingModalOpen(true)}
              >
                {t("detail.scheduleWalkthroughShort")}
              </button>
            </>
          ) : (
            <>
              {property.isForSale ? (
                <button
                  className="btn outline sm"
                  type="button"
                  onClick={() => setViewingModalOpen(true)}
                >
                  {t("action.privateViewing")}
                </button>
              ) : null}
              <Link
                className="btn"
                href={
                  user
                    ? `/book/${property.id}`
                    : `/login?next=${encodeURIComponent(`/book/${property.id}`)}`
                }
              >
                {t("action.reserveStay")}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Private Walkthrough / Acquisition Modal */}
      <BaseSheet
        open={viewingModalOpen}
        onOpenChange={setViewingModalOpen}
        title={t("buy.scheduleWalkthrough")}
      >
        {submittedViewing ? (
          <div className="stack center pad" style={{ padding: "20px 0" }}>
            <div className="pill ok" style={{ margin: "0 auto", padding: "8px 16px" }}>
              {t("buy.requestReceived")}
            </div>
            <h3 style={{ marginTop: 12 }}>{t("buy.advisorAssigned")}</h3>
            <p className="muted" style={{ fontSize: 13 }}>
              {t("detail.tourBody")}
            </p>
          </div>
        ) : (
          <form className="stack" onSubmit={handleRequestViewing}>
            <p className="muted" style={{ fontSize: 13 }}>
              {t("detail.arrangeInspection", { name: property.name, setting: property.settingDetail })}
            </p>
            <label className="field">
              <span>{t("buy.fieldBuyerName")}</span>
              <input
                className="ctrl"
                type="text"
                placeholder={t("detail.namePlaceholder")}
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>{t("buy.fieldPhone")}</span>
              <input
                className="ctrl"
                type="tel"
                placeholder="+91 98400 00000"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>{t("detail.mandateField")}</span>
              <textarea
                className="ctrl"
                rows={2}
                placeholder={t("detail.mandatePlaceholder")}
                value={buyerNote}
                onChange={(e) => setBuyerNote(e.target.value)}
              />
            </label>
            <div className="between mt">
              <span className="pill forest">{t("detail.confidentialDirect")}</span>
              <button className="btn accent" type="submit">
                {t("action.confirmWalkthrough")}
              </button>
            </div>
          </form>
        )}
      </BaseSheet>
    </Shell>
  );
}

/* ── SEO blocks ───────────────────────────────────────────────────────── */

/**
 * Breadcrumb trail + JSON-LD, rendered above the app bar.
 * `Breadcrumbs` is a server component but is pure markup with no client hooks,
 * so importing it into a client tree is safe and keeps it in the SSR payload.
 */
function PropertySeoBlocks({
  property,
  variant = "head",
  serverSchema,
}: {
  property: SeoProperty;
  variant?: "head" | "tail";
  serverSchema?: JsonLdNode;
}) {
  const { properties } = useCatalog();
  const crumbs = propertyCrumbs(property);
  const faq = propertyFaq(property);
  const related = relatedWithFallback(property, properties, 4);
  const category = categoryFor(property);
  const location = locationFor(property);
  const guides = guidesForListing(
    property.id,
    location?.slug,
    category.slug,
  ).slice(0, 2);
  const facts = propertyFacts(property);
  const graph = serverSchema ?? propertyPageSchema(property, crumbs, faq);

  if (variant === "head") {
    return (
      <>
        <JsonLd data={graph} id="property-jsonld" />
        <div className="pad" style={{ marginTop: 10 }}>
          {/* The page graph already carries this BreadcrumbList. */}
          <Breadcrumbs crumbs={crumbs} schema={false} />
        </div>
      </>
    );
  }

  return (
    <>
      <section className="seo-inline-block" aria-labelledby="property-facts-heading">
        <h2 id="property-facts-heading">Quick facts</h2>
        <p>Everything below is entered by the host who owns this house.</p>
        <dl className="seo-inline-facts">
          {facts.slice(0, 12).map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <nav className="seo-inline-block" aria-label="Explore related collections">
        <h2>More {category.plural.toLowerCase()}</h2>
        <p>Jump to the collections this listing belongs to.</p>
        <ul className="list-stack" style={{ gap: 8 }}>
          <li>
            <Link className="btn outline sm" href={category.href} style={{ width: "100%" }}>
              All {category.plural.toLowerCase()} on 9bhk
            </Link>
          </li>
          {location ? (
            <li>
              <Link
                className="btn outline sm"
                href={`/locations/${location.slug}`}
                style={{ width: "100%" }}
              >
                {location.name} stays
              </Link>
            </li>
          ) : null}
          {location ? (
            <li>
              <Link
                className="btn outline sm"
                href={`${category.href}/${location.slug}`}
                style={{ width: "100%" }}
              >
                {category.plural} in {location.name}
              </Link>
            </li>
          ) : null}
          <li>
            <Link className="btn outline sm" href="/stays" style={{ width: "100%" }}>
              All stays on 9bhk
            </Link>
          </li>
        </ul>
      </nav>

      {/* The page graph already carries this FAQPage. */}
        <FaqSection
          items={faq}
          heading="Questions about this property"
          headingId="property-faq-heading"
          schema={false}
        />

      {related.length ? (
        <section className="seo-inline-block" aria-labelledby="property-related-heading">
          <h2 id="property-related-heading">Similar stays</h2>
          <p>Comparable houses based on destination, stay type, capacity and price.</p>
          <ul className="stack sm" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {related.map((item) => (
              <li key={item.id}>
                <Link
                  className="rowcard hit"
                  href={`/property/${item.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <span className="thumb">
                    <Image
                      src={item.image}
                      width={400}
                      height={400}
                      alt={item.alt || item.name}
                      sizes="96px"
                      quality={68}
                    />
                  </span>
                  <span className="grow">
                    <strong style={{ display: "block", fontSize: 15 }}>{item.name}</strong>
                    <span className="p-loc" style={{ display: "block" }}>
                      {item.settingName}
                    </span>
                    <span className="p-amen" style={{ display: "block", marginTop: 2 }}>
                      {item.guests} guests · {item.bedrooms} bedrooms
                    </span>
                    <span className="p-price num" style={{ display: "block" }}>
                      ₹{item.price.toLocaleString("en-IN")}{" "}
                      <span className="per">a night</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {guides.length ? (
        <section className="seo-inline-block" aria-labelledby="property-guides-heading">
          <h2 id="property-guides-heading">Read before you book</h2>
          <ul className="stack sm" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {guides.map((guide) => (
              <li key={guide.slug}>
                <Link href={`/guides/${guide.slug}`} style={{ fontWeight: 700 }}>
                  {guide.title}
                </Link>
                <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                  {guide.excerpt}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

/** Contextual link into the destination collection. */
function LocationLinkRow({ property }: { property: SeoProperty }) {
  const location = locationFor(property);
  const category = categoryFor(property);
  if (!location) return null;
  return (
    <p className="muted" style={{ fontSize: 13, marginTop: 10, lineHeight: 1.6 }}>
      Explore{" "}
      <Link href={`/locations/${location.slug}`} style={{ fontWeight: 700 }}>
        other stays in {location.name}
      </Link>{" "}
      or{" "}
      <Link href={`${category.href}/${location.slug}`} style={{ fontWeight: 700 }}>
        {category.plural.toLowerCase()} in {location.name}
      </Link>
      .
    </p>
  );
}
