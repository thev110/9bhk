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

export default function PropertyPage() {
  const params = useParams<{ slug: string }>();
  const { properties } = useCatalog();
  const property = properties.find((item) => item.id === params.slug);
  const { user, isSaved, toggleSaved, showToast, presentationMode, setPresentationMode, addViewingRequest } = useStore();

  const [viewingModalOpen, setViewingModalOpen] = useState(false);
  const [buyerName, setBuyerName] = useState(user?.name || "");
  const [buyerPhone, setBuyerPhone] = useState(user?.phone || "");
  const [buyerNote, setBuyerNote] = useState("");
  const [submittedViewing, setSubmittedViewing] = useState(false);

  if (!property) {
    return (
      <Shell>
        <PageBar title="Beachfront Estate" backHref="/" />
        <div className="empty">
          <h3>This coastal sanctuary is no longer listed.</h3>
          <Link className="btn" href="/search">
            Explore beachfront stays
          </Link>
        </div>
      </Shell>
    );
  }

  async function handleRequestViewing(e: React.FormEvent) {
    e.preventDefault();
    if (!property) return;
    if (!buyerName.trim() || !buyerPhone.trim()) {
      showToast("Please provide your name and phone number.");
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
    showToast("Private viewing request received. A confidential advisor will contact you.");
    setTimeout(() => {
      setViewingModalOpen(false);
      setSubmittedViewing(false);
    }, 2000);
  }

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
            aria-label={`Save ${property.name}`}
            onClick={() => {
              toggleSaved(property.id);
              showToast(isSaved(property.id) ? `Removed ${property.name}` : `Saved ${property.name}`);
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
              Presentation Mode
            </span>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
              Unbranded client view · direct host info hidden
            </span>
          </div>
          <button
            type="button"
            className="btn ghost sm"
            style={{ fontSize: 11, padding: "4px 8px", height: "auto" }}
            onClick={() => {
              setPresentationMode(false);
              showToast("Exited Client Presentation Mode");
            }}
          >
            Exit
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
        + 18 curated architectural photos
      </p>

      <div className="pad mt stack">
        <div>
          <div className="between">
            <p className="muted" style={{ fontSize: 13, fontWeight: 700 }}>
              {property.type} · {property.coastalZone}
            </p>
            {property.isForSale ? (
              <span className="pill info" style={{ fontWeight: 800 }}>
                Listed for Sale
              </span>
            ) : null}
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 32, lineHeight: 1.1, marginTop: 4 }}>
            {property.name}
          </h2>
          <p className="p-loc">{property.location}</p>
          <div className="row mt" style={{ marginTop: 8 }}>
            <Rating rating={property.rating} reviews={property.reviews} />
            {property.guestFavourite ? <span className="pill ok">Guest favourite</span> : null}
            <span className="pill forest">Direct High-Tide Boundary: {property.tideDistanceMeters}m</span>
          </div>
        </div>

        {/* Coastal Acquisition Showcase (If Listed For Sale) */}
        {property.isForSale && property.salePrice ? (
          <div className="card" style={{ border: "1.5px solid var(--terracotta)", background: "var(--surface)" }}>
            <div className="between">
              <span className="p-sale-tag" style={{ margin: 0, textTransform: "uppercase", fontSize: 12, letterSpacing: ".08em" }}>
                Acquisition Opportunity
              </span>
              <span className="pill forest" style={{ fontSize: 11 }}>Clean CRZ Title</span>
            </div>
            <div className="between mt" style={{ alignItems: "baseline" }}>
              <div>
                <p className="nb" style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "var(--forest)" }}>
                  {formatInrCrores(property.salePrice)}
                </p>
                <p className="sub" style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                  {property.landArea || "Coastal Estate Ground"} · Unrestricted Sea Rights
                </p>
              </div>
              <button
                className="btn accent sm"
                type="button"
                onClick={() => setViewingModalOpen(true)}
              >
                Schedule Walkthrough
              </button>
            </div>
          </div>
        ) : null}

        {/* Space Stats */}
        <div className="stats">
          {[
            [`${property.guests} guests capacity`, "users"],
            [`${property.bedrooms} ocean suites`, "home"],
            [`${property.beds} master beds`, "home"],
            [`${property.bathrooms} ensuite baths`, "home"],
          ].map(([label]) => (
            <div key={label} className="stat">
              <p className="nb" style={{ fontSize: 15, fontWeight: 700 }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Coastal Boundary Section */}
        <div>
          <h3 className="sec-title">Coastal Shoreline & Privacy Boundary</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            Strict oceanfront geometry. Every foot of this estate touches coastal sand without public roads intervening.
          </p>
          <div className="spec-grid">
            <div className="spec-box">
              <span className="k">Beach Frontage</span>
              <span className="v">
                <Icon name="waves" style={{ width: 14, height: 14, color: "var(--moss)" }} />
                {property.beachFrontage}
              </span>
              <span className="sub">Uninterrupted shoreline</span>
            </div>
            <div className="spec-box">
              <span className="k">High-Tide Line</span>
              <span className="v">{property.tideDistanceMeters} Meters</span>
              <span className="sub">Direct ocean view</span>
            </div>
            <div className="spec-box">
              <span className="k">Sand Access</span>
              <span className="v">Private Boardwalk</span>
              <span className="sub">Direct gate to dune</span>
            </div>
            <div className="spec-box">
              <span className="k">Coastal Zone</span>
              <span className="v">{property.coastalZone}</span>
              <span className="sub">Verified clearance</span>
            </div>
          </div>
        </div>

        {/* Automotive Sanctuary & Garage Showcase */}
        <div>
          <div className="between">
            <h3 className="sec-title">Automotive Sanctuary & Garage</h3>
            <span className="pill forest">
              <Icon name="car" style={{ width: 13, height: 13 }} />
              {property.garage.capacity}-Vehicle Capacity
            </span>
          </div>
          <p className="mt" style={{ fontSize: 13.5, color: "var(--fg)", lineHeight: 1.5 }}>
            {property.garage.description}
          </p>
          <div className="spec-grid">
            <div className="spec-box">
              <span className="k">Garage Architecture</span>
              <span className="v">{property.garage.name}</span>
              <span className="sub">Salt-spray insulated</span>
            </div>
            <div className="spec-box">
              <span className="k">Supercar Low-Ramp</span>
              <span className="v">
                {property.garage.supercarFriendly ? "Ready (<7° Angle)" : "Standard Incline"}
              </span>
              <span className="sub">{property.garage.supercarFriendly ? "Zero frame scrape" : "SUV & Cruiser"}</span>
            </div>
            <div className="spec-box">
              <span className="k">EV High-Output</span>
              <span className="v">
                <Icon name="bolt" style={{ width: 14, height: 14, color: "var(--primary)" }} />
                {property.garage.evChargingKw}kW Output
              </span>
              <span className="sub">Intelligent load balancer</span>
            </div>
            <div className="spec-box">
              <span className="k">Marine Washdown</span>
              <span className="v">
                {property.garage.washdownStation ? "Deionized Fresh Water" : "Standard Wash"}
              </span>
              <span className="sub">Strips ocean mist</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="sec-title">About this coastal estate</h3>
          <p className="mt" style={{ lineHeight: 1.6 }}>{property.blurb}</p>
        </div>

        <div>
          <h3 className="sec-title">Curated amenities</h3>
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
          <h3 className="sec-title">Where you&apos;ll be</h3>
          <p className="muted">Direct ocean shoreline. Confidential coordinates and private gate entry code provided upon reservation.</p>
          <div className="card mt" style={{ minHeight: 140, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>
              {property.location} · {property.coastalZone}
            </span>
          </div>
        </div>

        <div>
          <h3 className="sec-title">Estate covenants</h3>
          <ul className="stack sm" style={{ paddingLeft: 18, marginTop: 10 }}>
            <li>Private coastal arrival and garage check-in after 2:00 PM</li>
            <li>Check-out before 11:00 AM</li>
            <li>Enclosed garage bays restricted to registered guest vehicles</li>
            <li>Direct beach quiet hours after 11:00 PM</li>
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
                Asking · or ₹{property.price.toLocaleString("en-IN")}/night stay
              </p>
            </div>
          ) : (
            <div>
              <p className="p-price num" style={{ margin: 0 }}>
                <NumberFlow value={property.price} prefix="₹" /> <span className="per">/ night</span>
              </p>
              <p className="muted" style={{ fontSize: 12 }}>
                Exclusive coastal stay
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
                    showToast("Unbranded client link copied");
                  }
                }}
              >
                Copy Link
              </button>
              <button
                className="btn accent sm"
                type="button"
                onClick={() => setViewingModalOpen(true)}
              >
                Schedule Walkthrough
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
                  Private Viewing
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
                Reserve Stay
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Private Walkthrough / Acquisition Modal */}
      <BaseSheet
        open={viewingModalOpen}
        onOpenChange={setViewingModalOpen}
        title="Schedule Private Walkthrough"
      >
        {submittedViewing ? (
          <div className="stack center pad" style={{ padding: "20px 0" }}>
            <div className="pill ok" style={{ margin: "0 auto", padding: "8px 16px" }}>
              Request Received
            </div>
            <h3 style={{ marginTop: 12 }}>Confidential advisor assigned.</h3>
            <p className="muted" style={{ fontSize: 13 }}>
              We will contact you directly to arrange an on-site architectural tour and coordinate garage access.
            </p>
          </div>
        ) : (
          <form className="stack" onSubmit={handleRequestViewing}>
            <p className="muted" style={{ fontSize: 13 }}>
              Arrange a private on-site inspection for <strong>{property.name}</strong> ({property.beachFrontage}).
            </p>
            <label className="field">
              <span>Full Name</span>
              <input
                className="ctrl"
                type="text"
                placeholder="Investor or Buyer Name"
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
            <label className="field">
              <span>Automotive & Timeline Mandate (Optional)</span>
              <textarea
                className="ctrl"
                rows={2}
                placeholder="Specific vehicle dimensions, garage inspection needs, or target acquisition date..."
                value={buyerNote}
                onChange={(e) => setBuyerNote(e.target.value)}
              />
            </label>
            <div className="between mt">
              <span className="pill forest">Confidential & Direct</span>
              <button className="btn accent" type="submit">
                Confirm Walkthrough
              </button>
            </div>
          </form>
        )}
      </BaseSheet>
    </Shell>
  );
}
