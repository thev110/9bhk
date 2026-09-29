"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandBar, Shell } from "@/components/shell";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import {
  createBreadcrumbSchema,
  createItemListSchema,
  graph,
} from "@/lib/seo/schema";
import { inr } from "@/lib/seo/copy";
import { Icon, settingIcon } from "@/components/icon";
import { FeatureCard, Rating } from "@/components/cards";
import { formatInrCrores, hasGarage, type Property, type Setting } from "@/lib/properties";
import { useCatalog } from "@/lib/catalog";
import { BaseSheet } from "@/components/base-sheet";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { settingLabel } from "@/lib/i18n/vibes";

export default function BuyPage() {
  const router = useRouter();
  const { city, addViewingRequest, showToast } = useStore();
  const { properties } = useCatalog();
  const t = useT();

  const [selectedSetting, setSelectedSetting] = useState<Setting | "all">("all");
  const [selectedGarage, setSelectedGarage] = useState<string>("all");
  const [supercarOnly, setSupercarOnly] = useState<boolean>(false);
  const [inquiryProperty, setInquiryProperty] = useState<Property | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerAgency, setBuyerAgency] = useState("");
  const [isRealtor, setIsRealtor] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const salesProperties = useMemo(() => {
    return properties.filter((p) => {
      if (!p.isForSale && !p.salePrice) return false;
      if (selectedSetting !== "all" && p.setting !== selectedSetting) return false;
      if (selectedGarage !== "all") {
        if (!hasGarage(p) || p.garage.type !== selectedGarage) return false;
      }
      if (supercarOnly && !(hasGarage(p) && p.garage.supercarFriendly)) return false;
      return true;
    });
  }, [properties, selectedSetting, selectedGarage, supercarOnly]);

  async function handleInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!buyerName.trim() || !buyerPhone.trim()) return;
    setSubmitted(true);
    if (inquiryProperty) {
      try {
        await addViewingRequest({
          propertyId: inquiryProperty.id,
          propertyName: inquiryProperty.name,
          buyerName: buyerName.trim(),
          buyerPhone: buyerPhone.trim(),
          notes: isRealtor ? t("buy.brokerMandate", { agency: buyerAgency.trim() }) : undefined,
        });
      } catch {
        /* ignore if offline */
      }
    }
    showToast(t("toast.walkthroughRecorded"));
    setTimeout(() => {
      setInquiryProperty(null);
      setSubmitted(false);
      setBuyerName("");
      setBuyerPhone("");
      setBuyerAgency("");
    }, 2200);
  }

  const forSale = properties.filter((p) => p.isForSale && p.salePrice);

  return (
    <Shell nav="buy">
      <BrandBar onLocation={() => {}} />

      <div className="pad" style={{ marginTop: 10 }}>
        {/* The page graph below already carries this BreadcrumbList. */}
        <Breadcrumbs
          crumbs={[{ name: "Home", href: "/" }, { name: "Estates for sale", href: "/buy" }]}
          schema={false}
        />
      </div>

      {/* Header / Mode Switcher */}
      <section className="greet">
        <div className="between" style={{ alignItems: "center" }}>
          <p className="hello" style={{ margin: 0 }}>{t("buy.hello")}</p>
          <div className="row" style={{ gap: 6 }}>
            <Link
              href="/"
              className="chip"
              style={{ minHeight: 32, padding: "0 10px", fontSize: 12 }}
            >
              {t("nav.explore")}
            </Link>
            <span
              className="chip is-active"
              style={{ minHeight: 32, padding: "0 10px", fontSize: 12 }}
            >
              {t("nav.buy")}
            </span>
          </div>
        </div>
        <h1 style={{ fontSize: 32, marginTop: 10 }}>
          {t("buy.title")}
        </h1>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 4, lineHeight: 1.4 }}>
          {t("buy.subtitle")}
        </p>
      </section>

      {/* AEO: one direct, factual answer to the question this page exists for.
          Counted from the live catalog so the number cannot go stale. */}
      <div className="pad">
        <BuyAnswerBlock listings={forSale} />
      </div>
      <JsonLd
        data={graph(
          createBreadcrumbSchema([
            { name: "Home", href: "/" },
            { name: "Estates for sale", href: "/buy" },
          ]),
          createItemListSchema(
            forSale.map((property) => ({
              name: property.name,
              href: `/property/${property.id}`,
              image: property.image,
            })),
            { name: "Estates for sale on 9bhk", path: "/buy" },
          ),
        )}
      />

      {/* Setting & Garage Filters */}
      <section className="pad mt">
        <p className="eyebrow" style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--moss)", marginBottom: 8 }}>
          {t("buy.filterEyebrow")}
        </p>
        <div className="chips" role="list">
          <button
            className={`chip${selectedSetting === "all" ? " is-active" : ""}`}
            type="button"
            onClick={() => setSelectedSetting("all")}
          >
            {t("buy.filterAll")}
          </button>
          {(["seaside", "hill_station", "city", "countryside"] as Setting[]).map((s) => (
            <button
              key={s}
              className={`chip${selectedSetting === s ? " is-active" : ""}`}
              type="button"
              onClick={() => setSelectedSetting(selectedSetting === s ? "all" : s)}
            >
              <Icon name={settingIcon(s)} />
              {settingLabel(t, s)}
            </button>
          ))}
        </div>
        <div className="chips mt" role="list">
          <button
            className={`chip${selectedGarage === "all" ? " is-active" : ""}`}
            type="button"
            onClick={() => setSelectedGarage("all")}
          >
            {t("buy.filterAnyGarage")}
          </button>
          <button
            className={`chip${selectedGarage === "collector_vault" ? " is-active" : ""}`}
            type="button"
            onClick={() => setSelectedGarage(selectedGarage === "collector_vault" ? "all" : "collector_vault")}
          >
            <Icon name="car" />
            {t("garage.collectorVault")}
          </button>
          <button
            className={`chip${selectedGarage === "marine_port" ? " is-active" : ""}`}
            type="button"
            onClick={() => setSelectedGarage(selectedGarage === "marine_port" ? "all" : "marine_port")}
          >
            <Icon name="waves" />
            {t("garage.marinePort")}
          </button>
          <button
            className={`chip${selectedGarage === "ev_pavilion" ? " is-active" : ""}`}
            type="button"
            onClick={() => setSelectedGarage(selectedGarage === "ev_pavilion" ? "all" : "ev_pavilion")}
          >
            <Icon name="bolt" />
            {t("garage.evPavilion")}
          </button>
          <button
            className={`chip${supercarOnly ? " is-active" : ""}`}
            type="button"
            onClick={() => setSupercarOnly(!supercarOnly)}
          >
            <Icon name="car" />
            {t("buy.filterSupercar")}
          </button>
        </div>
      </section>

      {/* Property Cards Listed For Sale */}
      <section className="section">
        <div className="section-head">
          <h2>{t("buy.availableHoldings", { n: salesProperties.length })}</h2>
          <span className="tiny" style={{ fontWeight: 600 }}>{t("buy.corridor")}</span>
        </div>
        <div className="stack-cards">
          {salesProperties.map((p) => (
            <article key={p.id} className="card" style={{ padding: 14 }}>
              <div className="media" style={{ aspectRatio: "16/10" }}>
                <Link href={`/property/${p.id}`}>
                  <img src={p.image} alt={p.alt} loading="lazy" decoding="async" width={400} height={300} />
                </Link>
                <span className="badge-sale">
                  {p.landArea || t("property.estate")}
                </span>
                <span className="badge-setting">
                  <Icon name={settingIcon(p.setting)} />
                  {settingLabel(t, p.setting)}
                </span>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="between">
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800 }}>{p.name}</h3>
                    <p className="p-loc">{p.settingName}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "var(--forest)", margin: 0 }}>
                      {formatInrCrores(p.salePrice || 0)}
                    </p>
                    <p className="tiny" style={{ margin: 0 }}>{t("buy.askingPrice")}</p>
                  </div>
                </div>

                <div className="row wrap mt" style={{ gap: 6, marginTop: 10 }}>
                  <span className="pill muted" style={{ fontSize: 11 }}>
                    {t("property.bedroomsShort", { n: p.bedrooms })}
                  </span>
                  {hasGarage(p) ? (
                    <div className="p-garage-pill" style={{ margin: 0 }}>
                      <Icon name="car" />
                      <span>{t("buy.garageCars", { garage: p.garage.name, n: p.garage.capacity })}</span>
                    </div>
                  ) : null}
                  {hasGarage(p) && p.garage.supercarFriendly ? (
                    <span className="pill ok" style={{ fontSize: 11 }}>{t("buy.supercarReady")}</span>
                  ) : null}
                  {hasGarage(p) && p.garage.evChargingKw >= 22 ? (
                    <span className="pill forest" style={{ fontSize: 11 }}>{t("property.evKw", { kw: p.garage.evChargingKw })}</span>
                  ) : null}
                  <span className="pill muted" style={{ fontSize: 11 }}>{p.settingDetail}</span>
                </div>

                <p className="mt" style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.4 }}>
                  {p.blurb}
                </p>

                <div className="between mt" style={{ paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                  <Link href={`/property/${p.id}`} className="btn outline sm">
                    {t("buy.inspectSpecs")}
                  </Link>
                  <button
                    className="btn accent sm"
                    type="button"
                    onClick={() => setInquiryProperty(p)}
                  >
                    {t("buy.scheduleWalkthrough")}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Realtor & Broker Callout */}
      <section className="section pad">
        <div className="card" style={{ background: "color-mix(in oklch, var(--primary) 8%, var(--surface))", border: "1px solid var(--moss)" }}>
          <div className="between">
            <p className="eyebrow" style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--forest)" }}>
              {t("cmdk.realtorPortal")}
            </p>
            <span className="pill forest">{t("buy.clientSovereignty")}</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 26, marginTop: 6 }}>
            {t("buy.brokerQuestion")}
          </h2>
          <p className="muted" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.45 }}>
            {t("buy.brokerBody")}
          </p>
          <div className="row mt">
            <Link href="/realtor" className="btn sm">
              {t("buy.openWorkspace")}
            </Link>
            <Link href="/host/new?mode=sale" className="btn outline sm">
              {t("buy.listForSale")}
            </Link>
          </div>
        </div>
      </section>

      {/* Private Walkthrough / Acquisition Modal */}
      <BaseSheet
        open={Boolean(inquiryProperty)}
        onOpenChange={(open) => !open && setInquiryProperty(null)}
        title={t("buy.scheduleWalkthrough")}
      >
        {submitted ? (
          <div className="stack center pad" style={{ padding: "20px 0" }}>
            <div className="pill ok" style={{ margin: "0 auto", padding: "8px 16px" }}>
              {t("buy.requestReceived")}
            </div>
            <h3 style={{ marginTop: 12 }}>{t("buy.advisorAssigned")}</h3>
            <p className="muted" style={{ fontSize: 13 }}>
              {t("buy.coordinateBody", { withAgency: isRealtor ? t("buy.coordinateAgency") : "" })}
            </p>
          </div>
        ) : (
          <form className="stack" onSubmit={handleInquiry}>
            <p className="muted" style={{ fontSize: 13 }}>
              {t("buy.inquiringFor", {
                name: inquiryProperty?.name ?? "",
                price: formatInrCrores(inquiryProperty?.salePrice || 0),
              })}
            </p>
            <label className="field">
              <span>{t("buy.fieldBuyerName")}</span>
              <input
                className="ctrl"
                type="text"
                placeholder={t("buy.namePlaceholder")}
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

            <div className="checkline" onClick={() => setIsRealtor(!isRealtor)} style={{ cursor: "pointer" }}>
              <div className="box" aria-checked={isRealtor}>
                {isRealtor ? <Icon name="check" style={{ color: "var(--on-primary)" }} /> : null}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t("buy.representingClient")}</span>
            </div>

            {isRealtor ? (
              <label className="field">
                <span>{t("buy.fieldAgency")}</span>
                <input
                  className="ctrl"
                  type="text"
                  placeholder={t("buy.agencyPlaceholder")}
                  value={buyerAgency}
                  onChange={(e) => setBuyerAgency(e.target.value)}
                />
              </label>
            ) : null}

            <div className="between mt">
              <span className="pill forest">{t("buy.discreet")}</span>
              <button className="btn accent" type="submit">
                {t("buy.submitInquiry")}
              </button>
            </div>
          </form>
        )}
      </BaseSheet>
    </Shell>
  );
}


/**
 * The direct answer for "/buy": how many estates are on the market, where
 * they are and what they are asking. Every value comes from the catalog the
 * page is already rendering, so the sentence cannot disagree with the cards
 * below it.
 */
function BuyAnswerBlock({ listings }: { listings: Property[] }) {
  const count = listings.length;
  if (!count) return null;
  const places = [...new Set(listings.map((property) => property.city || property.location).filter(Boolean))];
  const lowest = listings.reduce((best, property) => (property.salePrice! < best.salePrice! ? property : best));
  return (
    <div className="seo-answer" style={{ margin: "18px 0 0" }}>
      <h2 className="seo-answer-q" style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--moss)", margin: "0 0 8px" }}>
        What is for sale on 9bhk?
      </h2>
      <p style={{ fontFamily: "var(--font-display)", fontSize: 20, lineHeight: 1.42, color: "var(--forest-deep)", margin: 0 }}>
        {count} {count === 1 ? "estate is" : "estates are"} currently offered for
        purchase{places.length ? ` in ${places.slice(0, 3).join(", ")}` : ""}, from{" "}
        {inr(lowest.salePrice!)} at the lowest asking price. Each one can also be booked by the
        night.
      </p>
    </div>
  );
}
