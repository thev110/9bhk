"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/icon";
import { Rating } from "@/components/cards";
import { useCatalog } from "@/lib/catalog";
import { formatInrCrores } from "@/lib/properties";
import { BaseSheet } from "@/components/base-sheet";
import NumberFlow from "@number-flow/react";
import { useT } from "@/lib/i18n";

export default function PropertyPage() {
  const params = useParams<{ slug: string }>();
  const { properties } = useCatalog();
  const property = properties.find((item) => item.id === params.slug);
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
        <PageBar title={t("detail.beachfrontEstate")} backHref="/" />
        <div className="empty">
          <h3>{t("detail.gone")}</h3>
          <Link className="btn" href="/search">
            {t("detail.exploreStays")}
          </Link>
        </div>
      </Shell>
    );
  }

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
        automotiveMandate: buyerNote.trim() || undefined,
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

      <div className="gal" style={{ marginTop: 12, position: "relative" }}>
        <img
          src={property.image}
          alt={property.alt}
          style={{
            gridColumn: "1 / -1",
            width: "100%",
            aspectRatio: "4/3",
            objectFit: "cover",
            borderRadius: "var(--r-lg)",
            boxShadow: "var(--sh-sm)",
          }}
        />
        <span className="badge-coastal" style={{ bottom: 16, left: 16 }}>
          <Icon name="waves" />
          {property.beachFrontage}
        </span>
      </div>
      <p className="pad muted" style={{ marginTop: 8, fontSize: 13, fontWeight: 700 }}>
        {t("detail.morePhotos")}
      </p>

      <div className="pad mt stack">
        <div>
          <div className="between">
            <p className="muted" style={{ fontSize: 13, fontWeight: 700 }}>
              {property.type} · {property.coastalZone}
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
          <p className="p-loc">{property.location}</p>
          <div className="row mt" style={{ marginTop: 8 }}>
            <Rating rating={property.rating} reviews={property.reviews} />
            {property.guestFavourite ? <span className="pill ok">{t("property.guestFavourite")}</span> : null}
            <span className="pill forest">{t("detail.tideBoundary", { m: property.tideDistanceMeters })}</span>
          </div>
        </div>

        {/* Coastal Acquisition Showcase (If Listed For Sale) */}
        {property.isForSale && property.salePrice ? (
          <div className="card" style={{ border: "1.5px solid var(--terracotta)", background: "var(--surface)" }}>
            <div className="between">
              <span className="p-sale-tag" style={{ margin: 0, textTransform: "uppercase", fontSize: 12, letterSpacing: ".08em" }}>
                {t("detail.acquisitionOpportunity")}
              </span>
              <span className="pill forest" style={{ fontSize: 11 }}>{t("detail.cleanCrzTitle")}</span>
            </div>
            <div className="between mt" style={{ alignItems: "baseline" }}>
              <div>
                <p className="nb" style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "var(--forest)" }}>
                  {formatInrCrores(property.salePrice)}
                </p>
                <p className="sub" style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                  {t("detail.groundAndRights", {
                    ground: property.landArea || t("detail.coastalEstateGround"),
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

        {/* Coastal Boundary Section */}
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
              <span className="v">{t("detail.meters", { n: property.tideDistanceMeters })}</span>
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

        {/* Automotive Sanctuary & Garage Showcase */}
        <div>
          <div className="between">
            <h3 className="sec-title">{t("detail.garageTitle")}</h3>
            <span className="pill forest">
              <Icon name="car" style={{ width: 13, height: 13 }} />
              {t("detail.vehicleCapacity", { n: property.garage.capacity })}
            </span>
          </div>
          <p className="mt" style={{ fontSize: 13.5, color: "var(--fg)", lineHeight: 1.5 }}>
            {property.garage.description}
          </p>
          <div className="spec-grid">
            <div className="spec-box">
              <span className="k">{t("detail.garageArchitecture")}</span>
              <span className="v">{property.garage.name}</span>
              <span className="sub">{t("detail.subSaltInsulated")}</span>
            </div>
            <div className="spec-box">
              <span className="k">{t("detail.supercarLowRamp")}</span>
              <span className="v">
                {t(property.garage.supercarFriendly ? "detail.rampReady" : "detail.standardIncline")}
              </span>
              <span className="sub">{t(property.garage.supercarFriendly ? "detail.subZeroScrape" : "detail.subSuvCruiser")}</span>
            </div>
            <div className="spec-box">
              <span className="k">{t("detail.evHighOutput")}</span>
              <span className="v">
                <Icon name="bolt" style={{ width: 14, height: 14, color: "var(--primary)" }} />
                {t("detail.kwOutput", { kw: property.garage.evChargingKw })}
              </span>
              <span className="sub">{t("detail.subLoadBalancer")}</span>
            </div>
            <div className="spec-box">
              <span className="k">{t("detail.marineWashdown")}</span>
              <span className="v">
                {t(property.garage.washdownStation ? "detail.deionized" : "detail.standardWash")}
              </span>
              <span className="sub">{t("detail.subStripsMist")}</span>
            </div>
          </div>
        </div>

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
              {property.location} · {property.coastalZone}
            </span>
          </div>
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
              {t("detail.arrangeInspection", { name: property.name, frontage: property.beachFrontage })}
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
