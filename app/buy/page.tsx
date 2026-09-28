"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandBar, Shell } from "@/components/shell";
import { Icon } from "@/components/icon";
import { FeatureCard, Rating } from "@/components/cards";
import { formatInrCrores, type GarageType, type Property } from "@/lib/properties";
import { useCatalog } from "@/lib/catalog";
import { BaseSheet } from "@/components/base-sheet";
import { useStore } from "@/lib/store";

export default function BuyPage() {
  const router = useRouter();
  const { city, addViewingRequest, showToast } = useStore();
  const { properties } = useCatalog();

  const [selectedGarage, setSelectedGarage] = useState<string>("all");
  const [minFrontage, setMinFrontage] = useState<boolean>(false);
  const [supercarOnly, setSupercarOnly] = useState<boolean>(false);
  const [inquiryProperty, setInquiryProperty] = useState<Property | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerAgency, setBuyerAgency] = useState("");
  const [isRealtor, setIsRealtor] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Filter for properties listed for sale (or fallback to top beachfront estates if not yet flagged)
  const salesProperties = useMemo(() => {
    return properties.filter((p) => {
      const isForSale = p.isForSale || p.salePrice;
      if (!isForSale) return false;
      if (selectedGarage !== "all" && p.garage.type !== selectedGarage) return false;
      if (supercarOnly && !p.garage.supercarFriendly) return false;
      if (minFrontage) {
        const ft = parseInt(p.beachFrontage) || 0;
        if (ft < 150) return false;
      }
      return true;
    });
  }, [properties, selectedGarage, supercarOnly, minFrontage]);

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
          automotiveMandate: isRealtor ? `Broker Mandate: ${buyerAgency.trim()}` : undefined,
        });
      } catch {
        /* ignore if offline */
      }
    }
    showToast("Private acquisition walkthrough request recorded.");
    setTimeout(() => {
      setInquiryProperty(null);
      setSubmitted(false);
      setBuyerName("");
      setBuyerPhone("");
      setBuyerAgency("");
    }, 2200);
  }

  return (
    <Shell nav="buy">
      <BrandBar onLocation={() => {}} />

      {/* Header / Mode Switcher */}
      <section className="greet">
        <div className="between" style={{ alignItems: "center" }}>
          <p className="hello" style={{ margin: 0 }}>Acquisitions & Estates</p>
          <div className="row" style={{ gap: 6 }}>
            <Link
              href="/"
              className="chip"
              style={{ minHeight: 32, padding: "0 10px", fontSize: 12 }}
            >
              Stays
            </Link>
            <span
              className="chip is-active"
              style={{ minHeight: 32, padding: "0 10px", fontSize: 12 }}
            >
              Buy
            </span>
          </div>
        </div>
        <h1 style={{ fontSize: 32, marginTop: 10 }}>
          Direct Oceanfront Estates
        </h1>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 4, lineHeight: 1.4 }}>
          Private freehold beach houses with certified coastal clearance, uninterrupted high-tide boundaries, and climate-controlled automotive accommodations.
        </p>
      </section>

      {/* Tactical Garage & Shoreline Filters */}
      <section className="pad mt">
        <p className="eyebrow" style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--moss)", marginBottom: 8 }}>
          Automotive & Coastal Filter
        </p>
        <div className="chips" role="list">
          <button
            className={`chip${selectedGarage === "all" ? " is-active" : ""}`}
            type="button"
            onClick={() => setSelectedGarage("all")}
          >
            All Estates
          </button>
          <button
            className={`chip${selectedGarage === "collector_vault" ? " is-active" : ""}`}
            type="button"
            onClick={() => setSelectedGarage(selectedGarage === "collector_vault" ? "all" : "collector_vault")}
          >
            <Icon name="car" />
            Collector Vault
          </button>
          <button
            className={`chip${selectedGarage === "marine_port" ? " is-active" : ""}`}
            type="button"
            onClick={() => setSelectedGarage(selectedGarage === "marine_port" ? "all" : "marine_port")}
          >
            <Icon name="waves" />
            Marine Port
          </button>
          <button
            className={`chip${selectedGarage === "ev_pavilion" ? " is-active" : ""}`}
            type="button"
            onClick={() => setSelectedGarage(selectedGarage === "ev_pavilion" ? "all" : "ev_pavilion")}
          >
            <Icon name="bolt" />
            EV Pavilion
          </button>
          <button
            className={`chip${supercarOnly ? " is-active" : ""}`}
            type="button"
            onClick={() => setSupercarOnly(!supercarOnly)}
          >
            <Icon name="car" />
            Supercar Low-Ramp (&lt;7°)
          </button>
          <button
            className={`chip${minFrontage ? " is-active" : ""}`}
            type="button"
            onClick={() => setMinFrontage(!minFrontage)}
          >
            <Icon name="waves" />
            &gt;150 ft Frontage
          </button>
        </div>
      </section>

      {/* Property Cards Listed For Sale */}
      <section className="section">
        <div className="section-head">
          <h2>Available Coastal Holdings ({salesProperties.length})</h2>
          <span className="tiny" style={{ fontWeight: 600 }}>Bay of Bengal Corridor</span>
        </div>
        <div className="stack-cards">
          {salesProperties.map((p) => (
            <article key={p.id} className="card" style={{ padding: 14 }}>
              <div className="media" style={{ aspectRatio: "16/10" }}>
                <Link href={`/property/${p.id}`}>
                  <img src={p.image} alt={p.alt} />
                </Link>
                <span className="badge-sale">
                  {p.landArea || "Coastal Estate"}
                </span>
                <span className="badge-coastal">
                  <Icon name="waves" />
                  {p.beachFrontage}
                </span>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="between">
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800 }}>{p.name}</h3>
                    <p className="p-loc">{p.location}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "var(--forest)", margin: 0 }}>
                      {formatInrCrores(p.salePrice || 0)}
                    </p>
                    <p className="tiny" style={{ margin: 0 }}>Asking Price</p>
                  </div>
                </div>

                {/* Garage Spec Breakdown */}
                <div className="row wrap mt" style={{ gap: 6, marginTop: 10 }}>
                  <div className="p-garage-pill" style={{ margin: 0 }}>
                    <Icon name="car" />
                    <span>{p.garage.name} ({p.garage.capacity} Cars)</span>
                  </div>
                  {p.garage.supercarFriendly ? (
                    <span className="pill ok" style={{ fontSize: 11 }}>Supercar Ready</span>
                  ) : null}
                  {p.garage.evChargingKw >= 22 ? (
                    <span className="pill forest" style={{ fontSize: 11 }}>{p.garage.evChargingKw}kW DC</span>
                  ) : null}
                  <span className="pill muted" style={{ fontSize: 11 }}>Tide Line: {p.tideDistanceMeters}m</span>
                </div>

                <p className="mt" style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.4 }}>
                  {p.blurb}
                </p>

                <div className="between mt" style={{ paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                  <Link href={`/property/${p.id}`} className="btn outline sm">
                    Inspect Specs
                  </Link>
                  <button
                    className="btn accent sm"
                    type="button"
                    onClick={() => setInquiryProperty(p)}
                  >
                    Schedule Private Walkthrough
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
              Realtor & Broker Portal
            </p>
            <span className="pill forest">Client Sovereignty</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 26, marginTop: 6 }}>
            Representing high-net-worth coastal buyers?
          </h2>
          <p className="muted" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.45 }}>
            Onboard your clients to lock in co-broking commission splits, protect private buyer contact information, and enable Presentation Mode with your agency credentials.
          </p>
          <div className="row mt">
            <Link href="/realtor" className="btn sm">
              Open Realtor Workspace
            </Link>
            <Link href="/host/new?mode=sale" className="btn outline sm">
              List Beach House For Sale
            </Link>
          </div>
        </div>
      </section>

      {/* Private Walkthrough / Acquisition Modal */}
      <BaseSheet
        open={Boolean(inquiryProperty)}
        onOpenChange={(open) => !open && setInquiryProperty(null)}
        title="Schedule Private Walkthrough"
      >
        {submitted ? (
          <div className="stack center pad" style={{ padding: "20px 0" }}>
            <div className="pill ok" style={{ margin: "0 auto", padding: "8px 16px" }}>
              Request Received
            </div>
            <h3 style={{ marginTop: 12 }}>Confidential advisor assigned.</h3>
            <p className="muted" style={{ fontSize: 13 }}>
              We will coordinate directly with you {isRealtor ? "and your agency" : ""} to schedule an on-site architectural walkthrough.
            </p>
          </div>
        ) : (
          <form className="stack" onSubmit={handleInquiry}>
            <p className="muted" style={{ fontSize: 13 }}>
              Inquiring for <strong>{inquiryProperty?.name}</strong> ({formatInrCrores(inquiryProperty?.salePrice || 0)}).
            </p>
            <label className="field">
              <span>Full Name</span>
              <input
                className="ctrl"
                type="text"
                placeholder="Buyer or Principal Name"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Direct Phone</span>
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
              <span style={{ fontSize: 13, fontWeight: 600 }}>I am representing a client as a realtor / broker</span>
            </div>

            {isRealtor ? (
              <label className="field">
                <span>Brokerage / Agency Name</span>
                <input
                  className="ctrl"
                  type="text"
                  placeholder="e.g. Sotheby's Realty / Knight Frank / Independent RERA"
                  value={buyerAgency}
                  onChange={(e) => setBuyerAgency(e.target.value)}
                />
              </label>
            ) : null}

            <div className="between mt">
              <span className="pill forest">Discreet & Direct</span>
              <button className="btn accent" type="submit">
                Submit Acquisition Inquiry
              </button>
            </div>
          </form>
        )}
      </BaseSheet>
    </Shell>
  );
}
