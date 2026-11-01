"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { PortalAuthCard } from "@/components/portal-auth-card";
import { TwelveToolsBadge } from "@/components/seo/twelve-tools-badge";
import { CreatorAttribution } from "@/components/creator-attribution";
import { inr } from "@/lib/format";

type StretchPreset = {
  id: string;
  label: string;
  shortLabel: string;
  corridor: string;
  nightlyPerBedroomInr: number;
  weekendNightsPerYear: number;
  reservePerBedroomCr: number;
  typicalPlot: string;
  demandNote: string;
  heroImage: string;
  heroEstateTitle: string;
  heroSetting: string;
};

const STRETCH_PRESETS: StretchPreset[] = [
  {
    id: "ecr-coastal",
    label: "ECR Coastal Belt (Akkarai – Mahabalipuram)",
    shortLabel: "ECR Seafront",
    corridor: "Bay of Bengal Seafront & Backwater Stretch",
    nightlyPerBedroomInr: 18500,
    weekendNightsPerYear: 78,
    reservePerBedroomCr: 2.85,
    typicalPlot: "8,400 – 24,000 sq.ft CMDA / DTCP",
    demandNote:
      "Strong C-suite offsite buyouts, NRI family reunions, and Trial-Stay-to-Buy acquisition velocity.",
    heroImage: "/assets/prop-terracotta-courtyard.jpg",
    heroEstateTitle: "Terracotta Courtyard Compound · 7 BHK",
    heroSetting: "Walled Coastal Acreage · 8-Car Motor Court",
  },
  {
    id: "nilgiris-ridge",
    label: "Nilgiris Tea & Ridge Estates (Coonoor – Kotagiri)",
    shortLabel: "Nilgiris Ridge",
    corridor: "Western Ghats High-Altitude Sanctuary",
    nightlyPerBedroomInr: 16000,
    weekendNightsPerYear: 68,
    reservePerBedroomCr: 2.35,
    typicalPlot: "0.75 – 3.50 Acres Patta Land",
    demandNote:
      "Multi-week summer whole-estate buyouts and generational family trust acquisitions.",
    heroImage: "/assets/prop-verde-meadow.jpg",
    heroEstateTitle: "Verde Meadow Shola Estate · 5 BHK",
    heroSetting: "Private Tea & Shola Reserve · 6,100 ft ASL",
  },
  {
    id: "chennai-farmbelt",
    label: "Southern Orchard & Backwater Estates (Muttukadu – Alamparai)",
    shortLabel: "Orchard & Backwaters",
    corridor: "Private Waterfront & Organic Farmstead Corridor",
    nightlyPerBedroomInr: 20500,
    weekendNightsPerYear: 64,
    reservePerBedroomCr: 3.4,
    typicalPlot: "1.20 – 4.00 Acres Freehold",
    demandNote:
      "Whole-bungalow weekend retreats, private yacht/jetty access stays, and off-market freehold mandates.",
    heroImage: "/assets/prop-sunset-fields.jpg",
    heroEstateTitle: "Sunset Fields Waterfront Manor · 6 BHK",
    heroSetting: "Backwater Frontage · Private Lap Pool & Lawn",
  },
];

const OWNER_PORTFOLIO_SHOWCASE = [
  {
    id: "sunset-fields",
    title: "Sunset Fields Pavilion",
    location: "Muttukadu Backwater Reach, ECR",
    bedrooms: 6,
    specs: "1.8 Acres · 6-Car Garage · Private Pool",
    yieldMode: "Whole-Villa Stays + Quiet Sale",
    tariff: "₹92,000 / night buyout",
    reserve: "₹17.40 Cr Reserve",
    image: "/assets/prop-sunset-fields.jpg",
  },
  {
    id: "verde-meadow",
    title: "Verde Meadow Sanctuary",
    location: "Coonoor Ridge, Nilgiris",
    bedrooms: 5,
    specs: "2.4 Acres Tea Boundary · Heated Portico",
    yieldMode: "Seasonal Buyouts + Trial-to-Buy",
    tariff: "₹78,000 / night buyout",
    reserve: "₹13.50 Cr Reserve",
    image: "/assets/prop-verde-meadow.jpg",
  },
  {
    id: "palm-grove-owner",
    title: "Palm Grove Courtyard",
    location: "Panaiyur Beachside, Chennai",
    bedrooms: 5,
    specs: "16,800 sq.ft CMDA · 5-Car Collector Bay",
    yieldMode: "Direct UPI Host Stays",
    tariff: "₹85,000 / night buyout",
    reserve: "₹19.20 Cr Reserve",
    image: "/assets/prop-palm-grove.jpg",
  },
];

const VAULT_DOCUMENTS = [
  {
    code: "DOC-01",
    title: "Mother Deed & Link Deeds (30-Year Chain)",
    protection: "Dynamic buyer PAN + timestamp watermark",
    accessRule: "Released only after Owner one-click approval",
  },
  {
    code: "DOC-02",
    title: "Computerized Patta, Chitta & TSLR Extract",
    protection: "View-only encrypted browser stream (no raw PDF download)",
    accessRule: "Requires buyer Aadhaar/PAN & Proof of Funds",
  },
  {
    code: "DOC-03",
    title: "30-Year Sub-Registrar Encumbrance Certificate (EC)",
    protection: "Auto-redacted personal phone/address fields",
    accessRule: "Accessible to RERA mandate realtors you authorize",
  },
  {
    code: "DOC-04",
    title: "FMB Survey Sketch, CMDA/DTCP Approval & CRZ Clearance",
    protection: "Session-bound audit log with IP + RERA ID trace",
    accessRule: "Revocable at any moment from your Owner Vault desk",
  },
];

interface OwnersLandingPageProps {
  signedInUser?: { name?: string; email?: string; upiId?: string } | null;
  onEnterWorkspace?: () => void;
  onSignOut?: () => void;
}

export function OwnersLandingPage({
  signedInUser,
  onEnterWorkspace,
  onSignOut,
}: OwnersLandingPageProps) {
  const [selectedStretchId, setSelectedStretchId] = useState<string>(STRETCH_PRESETS[0].id);
  const [bedrooms, setBedrooms] = useState<number>(5);
  const [listingIntent, setListingIntent] = useState<"both" | "stays" | "sale">("both");

  const activeStretch =
    STRETCH_PRESETS.find((s) => s.id === selectedStretchId) ?? STRETCH_PRESETS[0];

  const wholeVillaNightlyInr = bedrooms * activeStretch.nightlyPerBedroomInr;
  const grossAnnualBuyoutsInr = wholeVillaNightlyInr * activeStretch.weekendNightsPerYear;
  const estimatedReserveCr = Number((bedrooms * activeStretch.reservePerBedroomCr).toFixed(2));

  return (
    <div className="seo-shell">
      {/* Native 9bhk Header */}
      <header className="seo-header">
        <div className="seo-header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Link href="/" className="seo-brand" aria-label="9bhk home">
              <Image
                src="/logo-mark.png"
                alt="9bhk"
                width={32}
                height={32}
                className="seo-brand-mark"
                priority
              />
              <span className="seo-brand-title">9bhk</span>
              <span className="seo-brand-sub">owners.9bhk.app</span>
            </Link>
            <span className="badge badge-verify" style={{ fontSize: 11 }}>
              3+ BHK Estate Owners &amp; Freehold Vault
            </span>
          </div>

          <nav className="seo-nav" aria-label="Owner portal navigation">
            <a href="#yield-estimator" className="seo-nav-link">
              Buyout &amp; Reserve Estimator
            </a>
            <a href="#owner-estates" className="seo-nav-link">
              Hosted Estates
            </a>
            <a href="#watermarked-vault" className="seo-nav-link">
              Watermarked Legal Vault
            </a>
            <Link href="/realtor" className="seo-nav-link">
              RERA Realtor Desk
            </Link>

            {signedInUser ? (
              <>
                {onEnterWorkspace && (
                  <button type="button" onClick={onEnterWorkspace} className="seo-nav-cta">
                    Open Owner Workspace ({signedInUser.name || signedInUser.email})
                  </button>
                )}
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="btn btn-outline btn-sm"
                    style={{ marginLeft: 4 }}
                  >
                    Sign Out
                  </button>
                )}
              </>
            ) : (
              <a href="#owner-credentials-panel" className="seo-nav-cta">
                Onboard Your 3+ BHK Estate
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="seo-main" style={{ maxWidth: 1320 }}>
        {/* Breadcrumb */}
        <nav className="seo-breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href="/">9bhk.app</Link>
            </li>
            <li className="seo-breadcrumb-sep" aria-hidden="true">
              /
            </li>
            <li aria-current="page">owners.9bhk.app · Estate Owner &amp; Freehold Seller Registry</li>
          </ol>
        </nav>

        {/* Hero Grid: Left Editorial + Photo Showcase + Estimator | Right Sticky Auth Desk */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))",
            gap: 32,
            alignItems: "start",
            padding: "16px 0 36px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div>
              <span className="seo-eyebrow">
                Private Estate Treasury · Strictly 3 to 9 BHK Villas, Farmhouses &amp; Bungalows
              </span>
              <h1
                className="seo-h1"
                style={{
                  fontSize: "clamp(32px, 4.2vw, 52px)",
                  maxWidth: "22ch",
                  marginTop: 8,
                }}
              >
                Monetize and sell your 3+ BHK estate without public listing noise.
              </h1>
              <p className="seo-lede" style={{ marginTop: 12 }}>
                Single rooms and 1–2 BHK apartments are excluded by design.{" "}
                <code>owners.9bhk.app</code> gives villa, coastal bungalow, and farmhouse owners a single sovereign desk for whole-property buyout stays, watermarked Mother Deed &amp; EC data rooms, and Proof-of-Funds backed acquisition offers.
              </p>
            </div>

            {/* 4-Cell Architectural Stat Strip */}
            <div className="seo-stats" style={{ margin: 0 }}>
              <div className="seo-stat">
                <div className="seo-stat-val">100%</div>
                <div className="seo-stat-lbl">Whole-Estate Buyouts · Zero Single Rooms</div>
              </div>
              <div className="seo-stat">
                <div className="seo-stat-val">DOC-01–04</div>
                <div className="seo-stat-lbl">PAN-Watermarked Mother Deed &amp; EC Vault</div>
              </div>
              <div className="seo-stat">
                <div className="seo-stat-val">Direct UPI</div>
                <div className="seo-stat-lbl">Split Escrow &amp; Security Deposit Holds</div>
              </div>
              <div className="seo-stat">
                <div className="seo-stat-val">Stay-to-Buy</div>
                <div className="seo-stat-lbl">Paid Trial Stays Credited Toward Sale</div>
              </div>
            </div>

            {/* Interactive Villa Photo Banner + Buyout & Reserve Estimator */}
            <div
              id="yield-estimator"
              className="p-card"
              style={{
                borderRadius: "var(--r-lg)",
                border: "1px solid var(--border-strong)",
                boxShadow: "var(--sh-md)",
                background: "var(--surface)",
              }}
            >
              {/* Real Villa Photography Header with Corridor Switcher */}
              <div
                style={{
                  position: "relative",
                  aspectRatio: "16 / 8.5",
                  width: "100%",
                  overflow: "hidden",
                  background: "var(--forest-deep)",
                }}
              >
                <Image
                  src={activeStretch.heroImage}
                  alt={activeStretch.heroEstateTitle}
                  fill
                  sizes="(max-width: 900px) 100vw, 680px"
                  style={{ objectFit: "cover" }}
                  priority
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(16,37,30,0.36) 0%, rgba(16,37,30,0.08) 45%, rgba(16,37,30,0.86) 100%)",
                  }}
                />

                {/* Top Corridor Pills */}
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    left: 14,
                    right: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span className="badge badge-setting">{activeStretch.heroSetting}</span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {STRETCH_PRESETS.map((stretch) => {
                      const active = stretch.id === activeStretch.id;
                      return (
                        <button
                          key={stretch.id}
                          type="button"
                          onClick={() => setSelectedStretchId(stretch.id)}
                          style={{
                            padding: "5px 11px",
                            borderRadius: "var(--r-pill)",
                            border: active
                              ? "1.5px solid var(--warm-white)"
                              : "1px solid rgba(252,251,248,0.35)",
                            background: active
                              ? "var(--warm-white)"
                              : "rgba(16, 37, 30, 0.72)",
                            color: active ? "var(--forest-deep)" : "var(--warm-white)",
                            fontSize: 11.5,
                            fontWeight: 700,
                            backdropFilter: "blur(8px)",
                          }}
                        >
                          {stretch.shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Overlay Title */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 14,
                    left: 16,
                    right: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    gap: 12,
                    flexWrap: "wrap",
                    color: "var(--warm-white)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "clamp(22px, 2.5vw, 28px)",
                        fontWeight: 400,
                        lineHeight: 1.1,
                      }}
                    >
                      {activeStretch.label}
                    </div>
                    <div style={{ fontSize: 12.5, opacity: 0.9, marginTop: 2 }}>
                      {activeStretch.corridor} · Typical Plot: {activeStretch.typicalPlot}
                    </div>
                  </div>
                </div>
              </div>

              {/* Estimator Controls */}
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <strong style={{ fontSize: 13.5, color: "var(--forest-deep)" }}>
                    Interactive 3+ BHK Whole-Estate Buyout &amp; Freehold Reserve Estimator
                  </strong>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[
                      { id: "both", label: "Stays + Freehold Sale" },
                      { id: "stays", label: "Buyout Stays Only" },
                      { id: "sale", label: "Quiet Sale Only" },
                    ].map((mode) => {
                      const active = listingIntent === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setListingIntent(mode.id as "both" | "stays" | "sale")}
                          className={active ? "chip is-on" : "chip"}
                          style={{ padding: "5px 11px", fontSize: 11.5, minHeight: 28 }}
                        >
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bedroom Slider */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 6,
                    }}
                  >
                    <label
                      htmlFor="owner-bhk-slider"
                      style={{ fontSize: 13, color: "var(--moss)", fontWeight: 700 }}
                    >
                      Whole-Property Bedroom Configuration (Minimum 3 BHK)
                    </label>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 26,
                        fontWeight: 400,
                        color: "var(--forest-deep)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {bedrooms} BHK Whole Estate
                    </span>
                  </div>
                  <input
                    id="owner-bhk-slider"
                    type="range"
                    min={3}
                    max={9}
                    step={1}
                    value={bedrooms}
                    onChange={(e) => setBedrooms(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--forest)", cursor: "pointer" }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                      color: "var(--muted)",
                      marginTop: 4,
                    }}
                  >
                    <span>3 BHK Villa</span>
                    <span>5 BHK Seafront</span>
                    <span>7 BHK Compound</span>
                    <span>9 BHK Sovereign Estate</span>
                  </div>
                </div>

                {/* Tabular Financial Readout */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
                    gap: 12,
                  }}
                >
                  {listingIntent !== "sale" && (
                    <div
                      style={{
                        background: "var(--surface-2)",
                        padding: "14px 16px",
                        borderRadius: "var(--r-md)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                        Whole-Villa Nightly Tariff
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 26,
                          fontWeight: 400,
                          color: "var(--fg)",
                          marginTop: 4,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {inr(wholeVillaNightlyInr)} <span style={{ fontSize: 13, fontFamily: "var(--font-ui)" }}>/ night</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--moss)", marginTop: 2 }}>
                        Entire {bedrooms}-bedroom compound buyout
                      </div>
                    </div>
                  )}

                  {listingIntent !== "sale" && (
                    <div
                      style={{
                        background: "var(--surface-2)",
                        padding: "14px 16px",
                        borderRadius: "var(--r-md)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                        Projected Annual Stays Gross
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 26,
                          fontWeight: 400,
                          color: "var(--forest)",
                          marginTop: 4,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {inr(grossAnnualBuyoutsInr)} <span style={{ fontSize: 13, fontFamily: "var(--font-ui)" }}>/ yr</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--moss)", marginTop: 2 }}>
                        Based on {activeStretch.weekendNightsPerYear} buyout nights/yr
                      </div>
                    </div>
                  )}

                  {listingIntent !== "stays" && (
                    <div
                      style={{
                        background: "var(--surface-2)",
                        padding: "14px 16px",
                        borderRadius: "var(--r-md)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                        Indicative Freehold Reserve
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 26,
                          fontWeight: 400,
                          color: "var(--terracotta)",
                          marginTop: 4,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        ₹{estimatedReserveCr} Cr
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--moss)", marginTop: 2 }}>
                        Trial-Stay-to-Buy credit eligible
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                    paddingTop: 12,
                    borderTop: "1px solid var(--border)",
                    fontSize: 12.5,
                    color: "var(--moss)",
                  }}
                >
                  <span>{activeStretch.demandNote}</span>
                  <Link href="/host/new" className="btn btn-primary btn-sm">
                    Launch 3+ BHK Onboarding Wizard →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Owner Auth or Signed-In Command Card */}
          <div id="owner-credentials-panel" style={{ position: "sticky", top: 86 }}>
            {signedInUser ? (
              <div
                className="info-card"
                style={{
                  padding: 28,
                  borderRadius: "var(--r-lg)",
                  border: "1px solid var(--border-strong)",
                  boxShadow: "var(--sh-float)",
                  background: "var(--surface)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <span className="badge badge-verify">Authenticated Owner Session</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>
                    owners.9bhk.app
                  </span>
                </div>

                <div>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 28,
                      fontWeight: 400,
                      margin: "0 0 6px",
                      color: "var(--forest-deep)",
                    }}
                  >
                    Welcome back, {signedInUser.name || signedInUser.email}
                  </h2>
                  <p style={{ fontSize: 13.5, color: "var(--moss)", margin: 0, lineHeight: 1.55 }}>
                    Open your Estate Owner Workspace to manage your 3+ BHK villas, approve watermarked Title Vault requests, and inspect direct UPI payouts.
                  </p>
                </div>

                <div
                  style={{
                    padding: 14,
                    borderRadius: "var(--r-md)",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    display: "grid",
                    gap: 8,
                    fontSize: 12.5,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted)" }}>Owner Account</span>
                    <strong>{signedInUser.email}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted)" }}>Direct UPI Handle</span>
                    <strong style={{ fontFamily: "var(--font-mono)" }}>
                      {signedInUser.upiId || "Configure in Workspace"}
                    </strong>
                  </div>
                </div>

                <button type="button" onClick={onEnterWorkspace} className="btn btn-primary btn-block">
                  Enter Estate Owner Workspace →
                </button>

                <div style={{ display: "flex", gap: 10 }}>
                  <Link href="/host/new" className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                    + Add 3+ BHK Estate
                  </Link>
                  <Link href="/host/bookings" className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                    Bookings &amp; Ledger
                  </Link>
                </div>
              </div>
            ) : (
              <PortalAuthCard
                portal="owners"
                defaultNext="/host"
                onAuthenticated={onEnterWorkspace}
              />
            )}

            <div
              className="info-card"
              style={{
                marginTop: 14,
                padding: "16px 18px",
                background: "var(--surface-2)",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <Icon name="verified" style={{ width: 18, height: 18, color: "var(--forest)", flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12.5, color: "var(--moss)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--fg)", display: "block", marginBottom: 2 }}>
                  Owner Sovereignty Over Pricing &amp; Dates
                </strong>
                Blackout family dates anytime, approve or decline group stay profiles, and appoint RERA co-brokers with pre-agreed basis-point terms.
              </div>
            </div>
          </div>
        </section>

        {/* Representative Owner Estates Showcase Grid with Real Photography */}
        <section id="owner-estates" className="seo-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            <div>
              <span className="seo-eyebrow">Dual-Yield Estate Models</span>
              <h2 className="seo-h2" style={{ margin: "6px 0 0" }}>
                How 3+ BHK Owners Combine Buyout Stays with Quiet Freehold Sales
              </h2>
            </div>
            <Link href="/host/new" className="btn btn-outline btn-sm">
              List Your 3+ BHK Property →
            </Link>
          </div>

          <div className="seo-grid">
            {OWNER_PORTFOLIO_SHOWCASE.map((estate) => (
              <article key={estate.id} className="seo-card">
                <div className="seo-card-media">
                  <Image
                    src={estate.image}
                    alt={estate.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 380px"
                    className="seo-card-img"
                  />
                  <span className="seo-card-tag">{estate.yieldMode}</span>
                  <span className="seo-card-BHK">{estate.bedrooms} BHK</span>
                </div>
                <div className="seo-card-body">
                  <div className="seo-card-loc">
                    <Icon name="pin" style={{ width: 13, height: 13 }} />
                    <span>{estate.location}</span>
                  </div>
                  <h3 className="seo-card-title">{estate.title}</h3>
                  <div className="seo-card-facts">
                    <span>{estate.specs}</span>
                  </div>
                  <div className="seo-card-foot">
                    <div>
                      <div className="seo-card-price">{estate.tariff}</div>
                      <span className="seo-card-price-sub">Whole-Estate Buyout</span>
                    </div>
                    <span className="badge badge-sale">{estate.reserve}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Forest Architectural Banner: Watermarked Legal Document Vault */}
        <section
          id="watermarked-vault"
          className="seo-cta"
          style={{
            margin: "36px 0",
            padding: "clamp(28px, 4vw, 44px)",
            display: "block",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))",
              gap: 32,
              alignItems: "start",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--sand)",
                }}
              >
                Zero WhatsApp Title Leakage
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(28px, 3.2vw, 40px)",
                  fontWeight: 400,
                  lineHeight: 1.1,
                  margin: "8px 0 12px",
                  color: "var(--warm-white)",
                }}
              >
                Your Mother Deed, Patta, and 30-Year EC stay inside a watermarked legal vault.
              </h2>
              <p style={{ color: "rgba(252,251,248,0.82)", fontSize: 14.5, lineHeight: 1.6, margin: "0 0 20px" }}>
                Conventional luxury brokerage circulates raw PDFs of your title deeds across unvetted WhatsApp groups. On <code>owners.9bhk.app</code>, every legal document is rendered in an encrypted browser stream stamped with the requesting buyer&apos;s PAN, RERA broker ID, and UTC timestamp.
              </p>

              <div
                style={{
                  padding: 18,
                  borderRadius: "var(--r-md)",
                  background: "rgba(16, 37, 30, 0.55)",
                  border: "1px solid rgba(252, 251, 248, 0.16)",
                }}
              >
                <strong style={{ display: "block", color: "var(--sand)", fontSize: 13, marginBottom: 4 }}>
                  Paid Trial-Stay-to-Buy Protocol
                </strong>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(252,251,248,0.84)", lineHeight: 1.55 }}>
                  Instead of disruptive unpaid Sunday walkthroughs, qualified acquisition prospects book a paid 2-night whole-estate trial stay. If they proceed to purchase within 60 days, the trial stay tariff is credited toward the freehold closing ledger.
                </p>
              </div>
            </div>

            {/* Right Vault Document Register */}
            <div
              style={{
                background: "var(--warm-white)",
                color: "var(--fg)",
                borderRadius: "var(--r-lg)",
                padding: 24,
                boxShadow: "var(--sh-float)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="badge badge-verify">Owner Data Room Register</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--muted)" }}>
                  AES-256 + Dynamic Watermark
                </span>
              </div>

              {VAULT_DOCUMENTS.map((doc) => (
                <div
                  key={doc.code}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "var(--r-md)",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <strong style={{ fontSize: 13.5, color: "var(--forest-deep)" }}>{doc.title}</strong>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: "var(--r-pill)",
                        background: "var(--surface)",
                        border: "1px solid var(--border-strong)",
                      }}
                    >
                      {doc.code}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--moss)", marginTop: 4 }}>
                    {doc.protection} · <strong style={{ color: "var(--forest)" }}>{doc.accessRule}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Owner FAQ */}
        <section className="seo-section">
          <span className="seo-eyebrow">Owner Governance &amp; Payouts</span>
          <h2 className="seo-h2" style={{ marginTop: 6 }}>
            Frequently Asked Questions from 3+ BHK Estate Owners
          </h2>
          <div className="seo-faq" style={{ marginTop: 18 }}>
            <details open>
              <summary>Can I list a 1 BHK or 2 BHK apartment on owners.9bhk.app?</summary>
              <p>
                No. 9bhk is strictly architected for 3 to 9+ BHK whole properties—private villas, coastal bungalows, heritage manors, and farmhouses booked or acquired as a single compound.
              </p>
            </details>
            <details>
              <summary>Can I list my estate for private freehold sale without offering short-term stays?</summary>
              <p>
                Yes. In your Owner Workspace, you can configure your estate for Whole-Villa Stays Only, Quiet Freehold Sale Only (with optional paid Trial-Stays for pre-vetted buyers), or a Dual-Yield Mandate combining weekend buyouts with an active sale reserve.
              </p>
            </details>
            <details>
              <summary>How do security deposits and payouts settle?</summary>
              <p>
                Stay payouts and refundable security deposit holds are tracked in integer minor units (paise) and settled directly to your verified bank account or UPI handle after check-in confirmation.
              </p>
            </details>
          </div>
        </section>
      </main>

      {/* Native 9bhk Footer */}
      <footer className="seo-footer">
        <div className="seo-footer-inner">
          <div>
            <strong>owners.9bhk.app</strong> · 3+ BHK Estate Owners &amp; Freehold Sellers Vault · Strictly Whole Properties
          </div>
          <div className="seo-footer-links">
            <Link href="/">Guest Catalog (www)</Link>
            <Link href="/realtor">RERA Brokers (realtor)</Link>
            <Link href="/admin">Compliance Gate (admin)</Link>
            <Link href="/host/new">Onboard 3+ BHK Estate</Link>
          </div>
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              paddingTop: 10,
              borderTop: "1px solid var(--border)",
            }}
          >
            <CreatorAttribution variant="footer" />
            <TwelveToolsBadge />
          </div>
        </div>
      </footer>
    </div>
  );
}
