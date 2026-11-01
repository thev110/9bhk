"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { PortalAuthCard } from "@/components/portal-auth-card";
import { inr } from "@/lib/format";

type StretchPreset = {
  id: string;
  label: string;
  corridor: string;
  nightlyPerBedroomInr: number;
  weekendNightsPerYear: number;
  reservePerBedroomCr: number;
  typicalPlot: string;
  demandNote: string;
};

const STRETCH_PRESETS: StretchPreset[] = [
  {
    id: "ecr-coastal",
    label: "ECR Coastal Belt (Akkarai – Mahabalipuram)",
    corridor: "Bay of Bengal Seafront & Backwater Stretch",
    nightlyPerBedroomInr: 18500,
    weekendNightsPerYear: 78,
    reservePerBedroomCr: 2.85,
    typicalPlot: "8,400 – 24,000 sq.ft CMDA / DTCP",
    demandNote: "High C-suite offsite, NRI family reunion, and Trial-Stay-to-Buy acquisition velocity.",
  },
  {
    id: "nilgiris-ridge",
    label: "Nilgiris Tea & Ridge Estates (Coonoor – Kotagiri)",
    corridor: "Western Ghats High-Altitude Sanctuary",
    nightlyPerBedroomInr: 16000,
    weekendNightsPerYear: 68,
    reservePerBedroomCr: 2.35,
    typicalPlot: "0.75 – 3.50 Acres Patta Land",
    demandNote: "Strong multi-week summer buyouts and legacy family trust acquisitions.",
  },
  {
    id: "chennai-core",
    label: "Chennai Sovereign Zones (Boat Club – Poes Garden – Adyar)",
    corridor: "Metropolitan Diplomatic & UHNWI Enclave",
    nightlyPerBedroomInr: 22000,
    weekendNightsPerYear: 62,
    reservePerBedroomCr: 4.9,
    typicalPlot: "4,800 – 14,400 sq.ft Freehold",
    demandNote: "Primarily private whole-bungalow corporate delegation stays and off-market freehold mandates.",
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
    accessRule: "Requires verified buyer Aadhaar/PAN & Proof of Funds",
  },
  {
    code: "DOC-03",
    title: "30-Year Sub-Registrar Encumbrance Certificate (EC)",
    protection: "Auto-redacted personal phone/address fields",
    accessRule: "Accessible to RERA-verified mandate realtors you authorize",
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
    <div
      style={{
        minHeight: "100vh",
        background: "#F9F6F0",
        color: "#141311",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Architectural Registry Bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(249, 246, 240, 0.94)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #E2DDD3",
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            padding: "14px clamp(20px, 4vw, 56px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <a
              href="https://www.9bhk.app"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                color: "#141311",
              }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 6,
                  background: "#1A4D3E",
                  color: "#F9F6F0",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--font-serif)",
                  fontWeight: 600,
                  fontSize: 18,
                }}
              >
                9
              </span>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                }}
              >
                9bhk
              </span>
            </a>
            <span style={{ color: "#C5BEB0" }}>/</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "#1A4D3E",
                background: "rgba(26, 77, 62, 0.08)",
                border: "1px solid rgba(26, 77, 62, 0.22)",
                padding: "4px 10px",
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              owners.9bhk.app
            </span>
            <span
              style={{
                fontSize: 13,
                color: "#57534E",
                fontWeight: 500,
              }}
            >
              3+ BHK Estate Owners &amp; Freehold Sellers Vault
            </span>
          </div>

          <nav
            aria-label="Owner landing sections"
            style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}
          >
            <a
              href="#yield-estimator"
              style={{ fontSize: 13.5, color: "#57534E", textDecoration: "none", fontWeight: 500 }}
            >
              Buyout &amp; Reserve Estimator
            </a>
            <a
              href="#watermarked-vault"
              style={{ fontSize: 13.5, color: "#57534E", textDecoration: "none", fontWeight: 500 }}
            >
              Watermarked Title Vault
            </a>
            <a
              href="https://realtor.9bhk.app"
              style={{ fontSize: 13.5, color: "#57534E", textDecoration: "none", fontWeight: 500 }}
            >
              RERA Realtor Desk
            </a>

            {signedInUser ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={onEnterWorkspace}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 6,
                    background: "#1A4D3E",
                    color: "#F9F6F0",
                    border: "1px solid #1A4D3E",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Open Owner Workspace ({signedInUser.name || signedInUser.email}) →
                </button>
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    style={{
                      padding: "9px 12px",
                      borderRadius: 6,
                      background: "transparent",
                      color: "#57534E",
                      border: "1px solid #D8D2C5",
                      fontSize: 12.5,
                      cursor: "pointer",
                    }}
                  >
                    Sign Out
                  </button>
                )}
              </div>
            ) : (
              <a
                href="#owner-credentials-panel"
                style={{
                  padding: "9px 16px",
                  borderRadius: 6,
                  background: "#9E3B24",
                  color: "#F9F6F0",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Onboard Your 3+ BHK Estate
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Main Editorial Canvas */}
      <main style={{ flex: 1 }}>
        {/* First Viewport: Editorial Statement + Interactive Yield/Reserve Preview + Auth Panel */}
        <section
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            padding: "clamp(36px, 5vw, 72px) clamp(20px, 4vw, 56px)",
            borderBottom: "1px solid #E2DDD3",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))",
              gap: "clamp(28px, 4vw, 56px)",
              alignItems: "start",
            }}
          >
            {/* Left Column: Editorial Headline + Interactive Yield & Reserve Estimator */}
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <div>
                <h1
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(2.35rem, 4.1vw, 3.85rem)",
                    fontWeight: 500,
                    lineHeight: 1.07,
                    letterSpacing: "-0.025em",
                    color: "#141311",
                    margin: "0 0 18px 0",
                  }}
                >
                  Monetize and sell your three-to-nine bedroom estate without public listing noise.
                </h1>
                <p
                  style={{
                    fontSize: "clamp(1rem, 1.15vw, 1.125rem)",
                    lineHeight: 1.65,
                    color: "#57534E",
                    maxWidth: "64ch",
                    margin: 0,
                  }}
                >
                  Single rooms and 1–2 BHK flats are excluded by design. <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.92em", color: "#1A4D3E" }}>owners.9bhk.app</code> gives villa, bungalow, and farmhouse owners a single sovereign desk for whole-property buyout stays, watermarked Mother Deed &amp; EC data rooms, and Proof-of-Funds backed acquisition offers.
                </p>
              </div>

              {/* Interactive 3+ BHK Buyout & Freehold Reserve Estimator */}
              <div
                id="yield-estimator"
                style={{
                  background: "#F1ECE1",
                  border: "1px solid #D8D2C5",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid #D8D2C5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                    background: "#EAE3D5",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#1A4D3E",
                        display: "inline-block",
                      }}
                    />
                    <strong style={{ fontSize: 13.5, color: "#141311" }}>
                      Interactive 3+ BHK Whole-Estate Buyout &amp; Reserve Estimator
                    </strong>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[
                      { id: "both", label: "Stays + Freehold Sale" },
                      { id: "stays", label: "Private Buyout Stays Only" },
                      { id: "sale", label: "Quiet Freehold Sale Only" },
                    ].map((mode) => {
                      const active = listingIntent === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setListingIntent(mode.id as "both" | "stays" | "sale")}
                          style={{
                            padding: "5px 10px",
                            borderRadius: 4,
                            fontSize: 12,
                            fontFamily: "var(--font-mono)",
                            border: active ? "1px solid #1A4D3E" : "1px solid #C8C1B2",
                            background: active ? "#1A4D3E" : "#F9F6F0",
                            color: active ? "#F9F6F0" : "#57534E",
                            cursor: "pointer",
                            fontWeight: active ? 600 : 500,
                          }}
                        >
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Stretch Selector */}
                  <div>
                    <label
                      htmlFor="owner-stretch-select"
                      style={{
                        display: "block",
                        fontSize: 12.5,
                        color: "#57534E",
                        marginBottom: 8,
                        fontWeight: 600,
                      }}
                    >
                      Select Your Micro-Market Corridor
                    </label>
                    <div
                      id="owner-stretch-select"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 8,
                      }}
                    >
                      {STRETCH_PRESETS.map((stretch) => {
                        const active = stretch.id === activeStretch.id;
                        return (
                          <button
                            key={stretch.id}
                            type="button"
                            onClick={() => setSelectedStretchId(stretch.id)}
                            style={{
                              textAlign: "left",
                              padding: "11px 13px",
                              borderRadius: 6,
                              border: active ? "1.5px solid #1A4D3E" : "1px solid #D8D2C5",
                              background: active ? "#F9F6F0" : "rgba(249, 246, 240, 0.55)",
                              cursor: "pointer",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: active ? "#1A4D3E" : "#141311",
                                marginBottom: 3,
                              }}
                            >
                              {stretch.label}
                            </div>
                            <div style={{ fontSize: 11.5, color: "#78716C" }}>{stretch.typicalPlot}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bedroom Slider (Strictly 3 BHK to 9 BHK) */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 6,
                      }}
                    >
                      <label htmlFor="owner-bhk-slider" style={{ fontSize: 13, color: "#57534E", fontWeight: 600 }}>
                        Whole-Property Bedroom Configuration (Minimum 3 BHK)
                      </label>
                      <span
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: 24,
                          fontWeight: 600,
                          color: "#141311",
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
                      style={{ width: "100%", accentColor: "#9E3B24", cursor: "pointer" }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 11.5,
                        fontFamily: "var(--font-mono)",
                        color: "#78716C",
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
                      paddingTop: 14,
                      borderTop: "1px solid #D8D2C5",
                    }}
                  >
                    {listingIntent !== "sale" && (
                      <div
                        style={{
                          background: "#F9F6F0",
                          padding: "13px 15px",
                          borderRadius: 6,
                          border: "1px solid #E2DDD3",
                        }}
                      >
                        <div style={{ fontSize: 11.5, color: "#78716C", marginBottom: 4 }}>
                          Whole-Villa Nightly Tariff
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 18,
                            fontWeight: 600,
                            color: "#141311",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {inr(wholeVillaNightlyInr)} / night
                        </div>
                        <div style={{ fontSize: 11.5, color: "#57534E", marginTop: 3 }}>
                          Entire {bedrooms}-bedroom compound buyout
                        </div>
                      </div>
                    )}

                    {listingIntent !== "sale" && (
                      <div
                        style={{
                          background: "#F9F6F0",
                          padding: "13px 15px",
                          borderRadius: 6,
                          border: "1px solid #E2DDD3",
                        }}
                      >
                        <div style={{ fontSize: 11.5, color: "#78716C", marginBottom: 4 }}>
                          Projected Annual Stays Gross
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 18,
                            fontWeight: 600,
                            color: "#1A4D3E",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {inr(grossAnnualBuyoutsInr)} / yr
                        </div>
                        <div style={{ fontSize: 11.5, color: "#57534E", marginTop: 3 }}>
                          Based on {activeStretch.weekendNightsPerYear} contracted buyout nights
                        </div>
                      </div>
                    )}

                    {listingIntent !== "stays" && (
                      <div
                        style={{
                          background: "#F9F6F0",
                          padding: "13px 15px",
                          borderRadius: 6,
                          border: "1px solid #E2DDD3",
                        }}
                      >
                        <div style={{ fontSize: 11.5, color: "#78716C", marginBottom: 4 }}>
                          Indicative Freehold Reserve
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 18,
                            fontWeight: 600,
                            color: "#9E3B24",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          ₹{estimatedReserveCr} Cr
                        </div>
                        <div style={{ fontSize: 11.5, color: "#57534E", marginTop: 3 }}>
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
                      fontSize: 12.5,
                      color: "#57534E",
                    }}
                  >
                    <span>{activeStretch.demandNote}</span>
                    <Link
                      href="/host/new"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#1A4D3E",
                        textDecoration: "underline",
                      }}
                    >
                      Launch 3+ BHK Onboarding Wizard →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Owner Credentials Card or Signed-In Command Desk */}
            <div id="owner-credentials-panel" style={{ position: "sticky", top: 88 }}>
              {signedInUser ? (
                <div
                  className="card stack"
                  style={{
                    padding: 28,
                    background: "#F1ECE1",
                    border: "1px solid #D8D2C5",
                    borderRadius: 10,
                    gap: 18,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <span className="pill ok">Authenticated Owner Session</span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "#57534E",
                      }}
                    >
                      owners.9bhk.app
                    </span>
                  </div>

                  <div>
                    <h2
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 26,
                        fontWeight: 600,
                        margin: "0 0 6px 0",
                        color: "#141311",
                      }}
                    >
                      Welcome back, {signedInUser.name || signedInUser.email}
                    </h2>
                    <p style={{ fontSize: 13.5, color: "#57534E", margin: 0, lineHeight: 1.55 }}>
                      Your estate owner session is active. Enter your Owner Workspace to manage your 3+ BHK listings, approve watermarked Title Vault requests, and review Proof-of-Funds offers.
                    </p>
                  </div>

                  <div
                    style={{
                      padding: 14,
                      borderRadius: 8,
                      background: "#F9F6F0",
                      border: "1px solid #E2DDD3",
                      display: "grid",
                      gap: 8,
                      fontSize: 12.5,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#78716C" }}>Owner Account</span>
                      <strong>{signedInUser.email}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#78716C" }}>Direct UPI Payout Handle</span>
                      <strong style={{ fontFamily: "var(--font-mono)" }}>
                        {signedInUser.upiId || "Configure in Workspace"}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onEnterWorkspace}
                    className="btn block"
                    style={{
                      padding: "13px 18px",
                      fontSize: 14,
                      fontWeight: 600,
                      background: "#1A4D3E",
                      color: "#F9F6F0",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    Enter Estate Owner Workspace →
                  </button>

                  <div style={{ display: "flex", gap: 10 }}>
                    <Link
                      href="/host/new"
                      className="btn outline"
                      style={{ flex: 1, textAlign: "center", fontSize: 12.5 }}
                    >
                      + Publish 3+ BHK Estate
                    </Link>
                    <Link
                      href="/host/bookings"
                      className="btn outline"
                      style={{ flex: 1, textAlign: "center", fontSize: 12.5 }}
                    >
                      Bookings &amp; Payouts
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
            </div>
          </div>
        </section>

        {/* Committed Dark Band: Watermarked Legal Document Vault & Acquisition Governance */}
        <section
          id="watermarked-vault"
          style={{
            background: "#13201C",
            color: "#F5F2EB",
            padding: "clamp(48px, 6vw, 88px) clamp(20px, 4vw, 56px)",
            borderBottom: "1px solid #263832",
          }}
        >
          <div style={{ maxWidth: 1440, margin: "0 auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))",
                gap: "clamp(32px, 4vw, 64px)",
                alignItems: "start",
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(1.85rem, 3vw, 2.75rem)",
                    fontWeight: 500,
                    lineHeight: 1.12,
                    margin: "0 0 14px 0",
                    color: "#F5F2EB",
                  }}
                >
                  Your Mother Deed, Patta, and EC never circulate on WhatsApp forwards.
                </h2>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: "#B8C4BE",
                    margin: "0 0 24px 0",
                    maxWidth: "58ch",
                  }}
                >
                  Traditional luxury brokerage exposes sensitive title papers to unvetted intermediaries. On <code style={{ fontFamily: "var(--font-mono)", color: "#E6C786" }}>owners.9bhk.app</code>, every legal document resides in an encrypted locker and renders with a dynamic watermark bearing the requesting buyer&apos;s PAN, RERA broker ID, and timestamp.
                </p>

                <div
                  style={{
                    padding: 20,
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 8,
                    display: "grid",
                    gap: 14,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: 13.5, color: "#E6C786" }}>
                      Trial-Stay-to-Buy Escrow Mechanism
                    </strong>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11.5,
                        color: "#A3B1AA",
                      }}
                    >
                      100% Stay Credit on Sale Close
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "#B8C4BE", margin: 0, lineHeight: 1.55 }}>
                    Prospective UHNW buyers can book a paid 2-to-5 night whole-estate trial stay at your full tariff. If they submit a formal acquisition offer that closes within 90 days, the trial stay payout is credited toward the freehold settlement while you retain 100% of the stay proceeds if they do not proceed.
                  </p>
                </div>
              </div>

              {/* Structured Vault Schedule Table */}
              <div
                style={{
                  background: "#192A25",
                  border: "1px solid #2C443C",
                  borderRadius: 10,
                  padding: "clamp(20px, 3vw, 28px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: 12,
                    borderBottom: "1px solid #2C443C",
                  }}
                >
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "#F5F2EB" }}>
                    Watermarked Legal Locker Protocol
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11.5,
                      color: "#E6C786",
                    }}
                  >
                    4 Protected Title Tiers
                  </span>
                </div>

                {VAULT_DOCUMENTS.map((doc) => (
                  <div
                    key={doc.code}
                    style={{
                      padding: "13px 15px",
                      borderRadius: 6,
                      background: "#13201C",
                      border: "1px solid #263832",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <strong style={{ fontSize: 13.5, color: "#F5F2EB" }}>{doc.title}</strong>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "#E6C786",
                          flexShrink: 0,
                        }}
                      >
                        {doc.code}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#A3B1AA" }}>{doc.protection}</div>
                    <div style={{ fontSize: 11.5, color: "#7E948C", fontFamily: "var(--font-mono)" }}>
                      Gate: {doc.accessRule}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Architectural Footer */}
      <footer
        style={{
          background: "#F1ECE1",
          borderTop: "1px solid #D8D2C5",
          padding: "24px clamp(20px, 4vw, 56px)",
          fontSize: 12.5,
          color: "#57534E",
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <strong style={{ color: "#141311" }}>owners.9bhk.app</strong> · Dedicated 3+ BHK Whole-Estate Owner &amp; Seller Vault
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <a href="https://www.9bhk.app" style={{ color: "#57534E", textDecoration: "none" }}>
              www.9bhk.app (Public Showcase)
            </a>
            <a href="https://realtor.9bhk.app" style={{ color: "#57534E", textDecoration: "none" }}>
              realtor.9bhk.app (RERA Broker Portal)
            </a>
            <a href="https://admin.9bhk.app" style={{ color: "#57534E", textDecoration: "none" }}>
              admin.9bhk.app (Compliance Desk)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
