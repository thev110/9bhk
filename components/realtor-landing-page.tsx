"use client";

import React, { useState } from "react";
import { PortalAuthCard } from "@/components/portal-auth-card";
import { Icon } from "@/components/icon";

type ShowcaseMandate = {
  id: string;
  title: string;
  corridor: string;
  setting: string;
  bedrooms: number;
  bathrooms: number;
  landExtent: string;
  garageSpec: string;
  reserveCr: number;
  nightlyInr: number;
  listingBrokerBps: number;
  buyerBrokerBps: number;
  image: string;
  architecturalNote: string;
};

const ACTIVE_MANDATES: ShowcaseMandate[] = [
  {
    id: "bay-breakers-vault",
    title: "Bay Breakers Vault",
    corridor: "Kovalam Kunnu, East Coast Road",
    setting: "Direct Oceanfront · 220 ft Shoreline",
    bedrooms: 5,
    bathrooms: 6,
    landExtent: "1.4 Acres (Patta + CRZ-III Cleared)",
    garageSpec: "Dehumidified Collector Vault · 6 Vehicles · 22 kW EV",
    reserveCr: 18.5,
    nightlyInr: 95000,
    listingBrokerBps: 100,
    buyerBrokerBps: 100,
    image: "/assets/prop-bay-breakers.jpg",
    architecturalNote:
      "Poured board-formed concrete residence with private dune access, acoustic courtyard, and zero-gradient supercar ramp.",
  },
  {
    id: "nilgiri-glasshouse",
    title: "The Nilgiri Glasshouse",
    corridor: "Coonoor Ridge, Nilgiris",
    setting: "High-Altitude Tea Estate · 6,100 ft ASL",
    bedrooms: 4,
    bathrooms: 5,
    landExtent: "2.8 Acres Private Shola Reserve",
    garageSpec: "Heated Teak Portico · 4 Vehicles · Dual 22 kW Chargers",
    reserveCr: 14.2,
    nightlyInr: 72000,
    listingBrokerBps: 125,
    buyerBrokerBps: 100,
    image: "/assets/prop-nilgiri-glasshouse.jpg",
    architecturalNote:
      "Cantilevered structural steel and double-glazed thermal pavilion overlooking Ketti valley with staff quarters.",
  },
  {
    id: "casuarina-ridge",
    title: "Casuarina Ridge Pavilion",
    corridor: "Mahabalipuram Shore, ECR",
    setting: "Coastal Casuarina Grove · 140 ft Frontage",
    bedrooms: 6,
    bathrooms: 7,
    landExtent: "1.9 Acres Walled Compound",
    garageSpec: "Enclosed Motor Court · 8 Vehicles · Washdown Bay",
    reserveCr: 24.0,
    nightlyInr: 115000,
    listingBrokerBps: 100,
    buyerBrokerBps: 125,
    image: "/assets/prop-casuarina-ridge.jpg",
    architecturalNote:
      "Six-suite whole-family compound designed for multi-generational stays, private buyouts, and corporate retreats.",
  },
];

const SPLIT_PRESETS = [
  { label: "Balanced Co-Brokerage (100 bps + 100 bps)", listingBps: 100, buyerBps: 100 },
  { label: "Exclusive Mandate Lead (125 bps + 75 bps)", listingBps: 125, buyerBps: 75 },
  { label: "Outstation Buyer Introducer (100 bps + 150 bps)", listingBps: 100, buyerBps: 150 },
] as const;

function formatLakhsAndCrores(rupees: number): string {
  if (rupees >= 10000000) {
    return `₹${(rupees / 10000000).toFixed(2)} Cr`;
  }
  if (rupees >= 100000) {
    return `₹${(rupees / 100000).toFixed(2)} Lakh`;
  }
  return `₹${Math.round(rupees).toLocaleString("en-IN")}`;
}

export function RealtorLandingPage({
  signedInUser,
  onEnterWorkspace,
  onSignOut,
}: {
  signedInUser?: { name?: string; email?: string; role?: string; verifiedBroker?: boolean } | null;
  onEnterWorkspace?: () => void;
  onSignOut?: () => void;
}) {
  const [selectedMandateIdx, setSelectedMandateIdx] = useState(0);
  const [dealValueCr, setDealValueCr] = useState<number>(18.5);
  const [splitPresetIdx, setSplitPresetIdx] = useState<number>(0);

  const activeMandate = ACTIVE_MANDATES[selectedMandateIdx];
  const activeSplit = SPLIT_PRESETS[splitPresetIdx];

  const dealRupees = dealValueCr * 10000000;
  const listingShareInr = Math.round((dealRupees * activeSplit.listingBps) / 10000);
  const buyerShareInr = Math.round((dealRupees * activeSplit.buyerBps) / 10000);
  const totalAllocationInr = listingShareInr + buyerShareInr;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F6F3EC",
        color: "#171614",
        fontFamily: "var(--font-sans), system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Top Architectural Registry Bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(246, 243, 236, 0.94)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #D8D1C2",
        }}
      >
        <div
          style={{
            maxWidth: 1380,
            margin: "0 auto",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: "#13201C",
                color: "#F6F3EC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: 16,
              }}
            >
              9R
            </div>
            <div>
              <strong style={{ fontSize: 15, display: "block", letterSpacing: "-0.01em" }}>
                realtor.9bhk.app
              </strong>
              <span style={{ fontSize: 12, color: "#4E4A43" }}>
                RERA Co-Broking &amp; Private Estate Mandate Registry
              </span>
            </div>
          </div>

          <nav
            aria-label="Realtor landing sections"
            style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}
          >
            <a
              href="#active-mandates"
              style={{ fontSize: 13.5, fontWeight: 500, color: "#171614", textDecoration: "none" }}
            >
              Active 3+ BHK Dossiers
            </a>
            <a
              href="#bps-ledger"
              style={{ fontSize: 13.5, fontWeight: 500, color: "#171614", textDecoration: "none" }}
            >
              Basis-Point Split Ledger
            </a>
            <a
              href="#protocol-schedule"
              style={{ fontSize: 13.5, fontWeight: 500, color: "#171614", textDecoration: "none" }}
            >
              Co-Broking Schedule
            </a>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {signedInUser ? (
              <>
                <span style={{ fontSize: 12.5, color: "#4E4A43" }}>
                  {signedInUser.email || signedInUser.name}
                </span>
                {onEnterWorkspace && (
                  <button
                    type="button"
                    onClick={onEnterWorkspace}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 8,
                      border: "1px solid #13201C",
                      background: "#13201C",
                      color: "#F6F3EC",
                      fontSize: 13.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Open Broker Terminal
                  </button>
                )}
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    style={{
                      padding: "9px 14px",
                      borderRadius: 8,
                      border: "1px solid #C8C0B0",
                      background: "transparent",
                      color: "#171614",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Sign Out
                  </button>
                )}
              </>
            ) : (
              <a
                href="#broker-auth-desk"
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  background: "#13201C",
                  color: "#F6F3EC",
                  fontSize: 13.5,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Register or Sign In
              </a>
            )}
          </div>
        </div>
      </header>

      {/* First Viewport: Editorial Headline + Live Architectural Mandate Plate + Broker Auth Desk */}
      <main>
        <section
          id="active-mandates"
          style={{
            maxWidth: 1380,
            margin: "0 auto",
            padding: "44px 24px 56px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 36,
              alignItems: "start",
            }}
          >
            {/* Left Column: Editorial Thesis + Interactive Estate Mandate Plate */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <h1
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: "clamp(2.1rem, 3.6vw, 3.35rem)",
                    lineHeight: 1.08,
                    letterSpacing: "-0.025em",
                    fontWeight: 600,
                    margin: "0 0 16px",
                    color: "#13201C",
                    maxWidth: "24ch",
                  }}
                >
                  Co-broker three-to-nine bedroom estates across ECR, the Nilgiris, and Chennai with registered RERA protection.
                </h1>
                <p
                  style={{
                    fontSize: 16,
                    lineHeight: 1.65,
                    color: "#3F3B35",
                    maxWidth: "66ch",
                    margin: 0,
                  }}
                >
                  A standalone brokerage terminal for licensed real estate advisors, family-office representatives, and wealth managers. Present unbranded three-plus bedroom residences to your clients, lock ninety-day accompanied site-visit attribution, and settle co-broking allocations in integer basis points.
                </p>

                {signedInUser && onEnterWorkspace && (
                  <div
                    style={{
                      marginTop: 20,
                      padding: "16px 20px",
                      background: "#E8EFEA",
                      border: "1px solid #9BB5A6",
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 14, color: "#13201C", display: "block" }}>
                        Active session detected ({signedInUser.email || signedInUser.name})
                      </strong>
                      <span style={{ fontSize: 13, color: "#2D473B" }}>
                        Switch directly into your 3+ BHK Catalog, CRM Client Mandates, Co-Broker Tie-Ups, and RERA KYC Locker.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onEnterWorkspace}
                      style={{
                        padding: "11px 20px",
                        borderRadius: 8,
                        border: "none",
                        background: "#13201C",
                        color: "#F6F3EC",
                        fontSize: 13.5,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Launch Broker Workspace
                    </button>
                  </div>
                )}
              </div>

              {/* Interactive Architectural Mandate Dossier */}
              <div
                style={{
                  background: "#FCFBF7",
                  border: "1px solid #D5CEC0",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 14px 34px rgba(19, 32, 28, 0.07)",
                }}
              >
                <div
                  style={{
                    padding: "12px 18px",
                    borderBottom: "1px solid #E5DFD3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                    background: "#F2EDE2",
                  }}
                >
                  <strong style={{ fontSize: 13, color: "#13201C" }}>
                    Live 3+ BHK Co-Broking Mandate Dossier
                  </strong>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {ACTIVE_MANDATES.map((m, idx) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedMandateIdx(idx);
                          setDealValueCr(m.reserveCr);
                        }}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          border:
                            idx === selectedMandateIdx
                              ? "1px solid #13201C"
                              : "1px solid #C8C0B0",
                          background: idx === selectedMandateIdx ? "#13201C" : "#FCFBF7",
                          color: idx === selectedMandateIdx ? "#F6F3EC" : "#171614",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {m.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  }}
                >
                  <div style={{ position: "relative", minHeight: 270, background: "#13201C" }}>
                    <img
                      src={activeMandate.image}
                      alt={activeMandate.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        minHeight: 270,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 12,
                        left: 12,
                        right: 12,
                        padding: "10px 12px",
                        borderRadius: 8,
                        background: "rgba(19, 32, 28, 0.88)",
                        color: "#F6F3EC",
                        fontSize: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span>{activeMandate.setting}</span>
                      <strong style={{ fontVariantNumeric: "tabular-nums" }}>
                        {activeMandate.bedrooms} BHK
                      </strong>
                    </div>
                  </div>

                  <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <h2
                        style={{
                          fontFamily: "var(--font-serif), Georgia, serif",
                          fontSize: 22,
                          margin: "0 0 4px",
                          color: "#13201C",
                        }}
                      >
                        {activeMandate.title}
                      </h2>
                      <p style={{ fontSize: 13, color: "#4E4A43", margin: 0 }}>
                        {activeMandate.corridor}
                      </p>
                    </div>

                    <p style={{ fontSize: 13, lineHeight: 1.55, color: "#3F3B35", margin: 0 }}>
                      {activeMandate.architecturalNote}
                    </p>

                    <dl
                      style={{
                        margin: 0,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px 14px",
                        paddingTop: 10,
                        borderTop: "1px solid #E5DFD3",
                        fontSize: 12.5,
                      }}
                    >
                      <div>
                        <dt style={{ color: "#4E4A43" }}>Acquisition Guide</dt>
                        <dd
                          style={{
                            margin: "2px 0 0",
                            fontWeight: 700,
                            fontSize: 15,
                            color: "#13201C",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          ₹{activeMandate.reserveCr.toFixed(2)} Cr
                        </dd>
                      </div>
                      <div>
                        <dt style={{ color: "#4E4A43" }}>Co-Broker Allocation</dt>
                        <dd
                          style={{
                            margin: "2px 0 0",
                            fontWeight: 700,
                            fontSize: 15,
                            color: "#1E4D3B",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {activeMandate.listingBrokerBps} bps + {activeMandate.buyerBrokerBps} bps
                        </dd>
                      </div>
                      <div>
                        <dt style={{ color: "#4E4A43" }}>Land &amp; Title</dt>
                        <dd style={{ margin: "2px 0 0", fontWeight: 600, color: "#171614" }}>
                          {activeMandate.landExtent}
                        </dd>
                      </div>
                      <div>
                        <dt style={{ color: "#4E4A43" }}>Motor Vault</dt>
                        <dd style={{ margin: "2px 0 0", fontWeight: 600, color: "#171614" }}>
                          {activeMandate.garageSpec}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Inline Realtor Registration & Sign-In Desk */}
            <div id="broker-auth-desk" style={{ position: "sticky", top: 84 }}>
              <PortalAuthCard
                portal="realtor"
                defaultNext="/realtor"
                onAuthenticated={onEnterWorkspace}
              />
            </div>
          </div>
        </section>

        {/* Committed Full-Bleed Dark Cypress Band: Interactive Basis-Point (bps) Co-Broking Split Ledger */}
        <section
          id="bps-ledger"
          style={{
            background: "#13201C",
            color: "#F6F3EC",
            padding: "56px 24px",
            borderTop: "1px solid #263B34",
            borderBottom: "1px solid #263B34",
          }}
        >
          <div style={{ maxWidth: 1380, margin: "0 auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 36,
                alignItems: "center",
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: "clamp(1.75rem, 2.6vw, 2.4rem)",
                    lineHeight: 1.15,
                    margin: "0 0 14px",
                    color: "#F6F3EC",
                  }}
                >
                  Simulate your integer basis-point allocation before proposing a broker tie-up.
                </h2>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: "#C9D4CE",
                    maxWidth: "60ch",
                    margin: "0 0 24px",
                  }}
                >
                  Every co-broking agreement on realtor.9bhk.app is recorded in integer basis points (100 bps equals one hundredth of the mandate value) and locked in the database before buyer identity disclosure. Adjust the estate value and split structure to inspect the exact Rupee settlement.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <label style={{ display: "block" }}>
                    <span
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "#E5ECE8",
                        marginBottom: 8,
                      }}
                    >
                      <span>Estate Sale Mandate Value</span>
                      <strong style={{ fontVariantNumeric: "tabular-nums", color: "#E6B872" }}>
                        ₹{dealValueCr.toFixed(1)} Crore
                      </strong>
                    </span>
                    <input
                      type="range"
                      min={5}
                      max={45}
                      step={0.5}
                      value={dealValueCr}
                      onChange={(e) => setDealValueCr(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#E6B872", cursor: "pointer" }}
                    />
                  </label>

                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "#E5ECE8",
                        marginBottom: 8,
                      }}
                    >
                      Tripartite Basis-Point Split Structure
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {SPLIT_PRESETS.map((preset, idx) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setSplitPresetIdx(idx)}
                          style={{
                            textAlign: "left",
                            padding: "11px 14px",
                            borderRadius: 8,
                            border:
                              idx === splitPresetIdx
                                ? "1px solid #E6B872"
                                : "1px solid #2B423A",
                            background: idx === splitPresetIdx ? "#1C302A" : "#162621",
                            color: "#F6F3EC",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>{preset.label}</span>
                          <strong
                            style={{
                              color: "#E6B872",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {preset.listingBps + preset.buyerBps} bps total
                          </strong>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Settlement Breakdown Sheet */}
              <div
                style={{
                  background: "#192B25",
                  border: "1px solid #314B42",
                  borderRadius: 12,
                  padding: 28,
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: 20,
                    margin: "0 0 18px",
                    color: "#F6F3EC",
                  }}
                >
                  Escrow Co-Broking Allocation Sheet
                </h3>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingBottom: 12,
                      borderBottom: "1px solid #2B423A",
                      fontSize: 14,
                    }}
                  >
                    <span style={{ color: "#C9D4CE" }}>Gross Estate Consideration</span>
                    <strong>₹{dealValueCr.toFixed(2)} Cr</strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingBottom: 12,
                      borderBottom: "1px solid #2B423A",
                      fontSize: 14,
                    }}
                  >
                    <span style={{ color: "#C9D4CE" }}>
                      Listing Mandate Holder ({activeSplit.listingBps} bps)
                    </span>
                    <strong style={{ color: "#9CE2B9" }}>
                      {formatLakhsAndCrores(listingShareInr)}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingBottom: 12,
                      borderBottom: "1px solid #2B423A",
                      fontSize: 14,
                    }}
                  >
                    <span style={{ color: "#C9D4CE" }}>
                      Buyer Introducer Broker ({activeSplit.buyerBps} bps)
                    </span>
                    <strong style={{ color: "#E6B872" }}>
                      {formatLakhsAndCrores(buyerShareInr)}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: 4,
                      fontSize: 16,
                    }}
                  >
                    <span>Total Co-Broking Pool ({activeSplit.listingBps + activeSplit.buyerBps} bps)</span>
                    <strong style={{ color: "#F6F3EC" }}>
                      {formatLakhsAndCrores(totalAllocationInr)}
                    </strong>
                  </div>
                </div>

                <p
                  style={{
                    margin: "20px 0 0",
                    paddingTop: 14,
                    borderTop: "1px solid #2B423A",
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    color: "#B4C2BA",
                  }}
                >
                  Lead Sovereignty Guarantee: Once a buyer requirement is matched and a tie-up is accepted in the ledger, the introducing broker&apos;s attribution is cryptographically bound to the property for 90 calendar days.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Architectural Schedule Table (No SaaS Card Grid) */}
        <section
          id="protocol-schedule"
          style={{
            maxWidth: 1380,
            margin: "0 auto",
            padding: "56px 24px 72px",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "clamp(1.65rem, 2.4vw, 2.2rem)",
              margin: "0 0 10px",
              color: "#13201C",
            }}
          >
            How the Realtor Registry separates broker operations from the public guest catalog
          </h2>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: "#4E4A43",
              maxWidth: "68ch",
              margin: "0 0 28px",
            }}
          >
            Each 9bhk subdomain operates with strict role boundaries and dedicated KYC verification. Here is what changes when you operate on realtor.9bhk.app.
          </p>

          <div
            style={{
              background: "#FCFBF7",
              border: "1px solid #D5CEC0",
              borderRadius: 12,
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: 13.5,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1.5px solid #13201C", background: "#F2EDE2" }}>
                  <th style={{ padding: "14px 18px", fontWeight: 700, color: "#13201C" }}>
                    Operational Capability
                  </th>
                  <th style={{ padding: "14px 18px", fontWeight: 700, color: "#4E4A43" }}>
                    Public Marketplace (www.9bhk.app)
                  </th>
                  <th style={{ padding: "14px 18px", fontWeight: 700, color: "#1E4D3B" }}>
                    RERA Broker Terminal (realtor.9bhk.app)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #E5DFD3" }}>
                  <td style={{ padding: "14px 18px", fontWeight: 600 }}>
                    3+ BHK Whole-Property Showcase Floor
                  </td>
                  <td style={{ padding: "14px 18px", color: "#4E4A43" }}>
                    Displays only staff-reviewed 3+ BHK villas, farmhouses &amp; coastal estates.
                  </td>
                  <td style={{ padding: "14px 18px", color: "#171614" }}>
                    Onboard 3+ BHK mandates to the marketplace, plus manage private under-3-BHK inventory via direct client links.
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #E5DFD3" }}>
                  <td style={{ padding: "14px 18px", fontWeight: 600 }}>
                    Client Presentation Mode
                  </td>
                  <td style={{ padding: "14px 18px", color: "#4E4A43" }}>
                    Shows direct platform checkout and public host details.
                  </td>
                  <td style={{ padding: "14px 18px", color: "#171614" }}>
                    Hides internal brokerage notes and displays your RERA agency masthead for live iPad or boardroom walkthroughs.
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #E5DFD3" }}>
                  <td style={{ padding: "14px 18px", fontWeight: 600 }}>
                    Realtor-to-Realtor Tie-Up Ledger
                  </td>
                  <td style={{ padding: "14px 18px", color: "#4E4A43" }}>
                    Not visible on consumer domain.
                  </td>
                  <td style={{ padding: "14px 18px", color: "#171614" }}>
                    Propose, counter, and accept integer basis-point splits (`bhk_realtor_tieups`) with other RERA-verified brokers.
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "14px 18px", fontWeight: 600 }}>
                    Mandatory KYC Verification Gate
                  </td>
                  <td style={{ padding: "14px 18px", color: "#4E4A43" }}>
                    Government Photo ID for arrival pass (`guest_id`).
                  </td>
                  <td style={{ padding: "14px 18px", color: "#171614" }}>
                    State RERA Registration Certificate (`rera_certificate`), Broker PAN (`realtor_pan`), and Agency Proof (`agency_proof`).
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
