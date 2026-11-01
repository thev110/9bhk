"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PortalAuthCard } from "@/components/portal-auth-card";
import { Icon } from "@/components/icon";
import { TwelveToolsBadge } from "@/components/seo/twelve-tools-badge";
import { CreatorAttribution } from "@/components/creator-attribution";

type ShowcaseMandate = {
  id: string;
  title: string;
  corridor: string;
  setting: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  landExtent: string;
  garageSpec: string;
  reserveCr: number;
  nightlyInr: number;
  listingBrokerBps: number;
  buyerBrokerBps: number;
  reraId: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  architecturalNote: string;
};

const ACTIVE_MANDATES: ShowcaseMandate[] = [
  {
    id: "blue-horizon-ecr",
    title: "Blue Horizon Seafront Compound",
    corridor: "Kovalam – East Coast Road (ECR), Chennai",
    setting: "Beachfront · Direct Bay of Bengal Access",
    bedrooms: 6,
    bathrooms: 7,
    maxGuests: 16,
    landExtent: "1.4 Acres (Patta + CRZ-III Cleared)",
    garageSpec: "Dehumidified Collector Vault · 6 Vehicles · Dual 22 kW EV",
    reserveCr: 18.5,
    nightlyInr: 95000,
    listingBrokerBps: 100,
    buyerBrokerBps: 100,
    reraId: "TN/29/Building/0418/2026",
    image: "/assets/prop-blue-horizon.jpg",
    imageWidth: 640,
    imageHeight: 640,
    architecturalNote:
      "Six-suite poured concrete coastal compound with 18-metre lap pool, acoustic courtyard, private beach gate, and zero-gradient supercar ramp.",
  },
  {
    id: "palm-grove-pavilion",
    title: "Palm Grove Estate Pavilion",
    corridor: "Injambakkam – Panaiyur Shore, ECR",
    setting: "Coastal Casuarina & Palm Sanctuary",
    bedrooms: 5,
    bathrooms: 6,
    maxGuests: 14,
    landExtent: "18,600 sq.ft CMDA Freehold Plot",
    garageSpec: "Enclosed Motor Court · 5 Vehicles · Chauffeur Quarters",
    reserveCr: 14.2,
    nightlyInr: 72000,
    listingBrokerBps: 125,
    buyerBrokerBps: 100,
    reraId: "TN/29/Building/0512/2026",
    image: "/assets/prop-palm-grove.jpg",
    imageWidth: 800,
    imageHeight: 1000,
    architecturalNote:
      "Double-height teak and lime-plaster residence framed by mature coconut palms, private lawn pavilion, and separate service kitchen.",
  },
  {
    id: "terracotta-courtyard",
    title: "Terracotta Courtyard Manor",
    corridor: "Mahabalipuram Heritage Belt, ECR",
    setting: "Walled Chettinad-Modern Acreage",
    bedrooms: 7,
    bathrooms: 8,
    maxGuests: 20,
    landExtent: "2.1 Acres Walled Compound",
    garageSpec: "Covered Collector Portico · 8 Vehicles · Washdown Bay",
    reserveCr: 24.0,
    nightlyInr: 115000,
    listingBrokerBps: 100,
    buyerBrokerBps: 125,
    reraId: "TN/29/Building/0609/2026",
    image: "/assets/prop-terracotta-courtyard.jpg",
    imageWidth: 1080,
    imageHeight: 720,
    architecturalNote:
      "Seven-bedroom whole-family estate engineered for multi-generational buyouts, Trial-Stay-to-Buy evaluations, and family-office acquisitions.",
  },
  {
    id: "lakeview-courtyard",
    title: "Lakeview Shola Sanctuary",
    corridor: "Coonoor – Kotagiri Ridge, Nilgiris",
    setting: "High-Altitude Tea & Lake Outlook · 6,100 ft ASL",
    bedrooms: 4,
    bathrooms: 5,
    maxGuests: 10,
    landExtent: "1.8 Acres Private Ridge Patta",
    garageSpec: "Heated Timber Garage · 4 Vehicles · 22 kW Charger",
    reserveCr: 11.8,
    nightlyInr: 58000,
    listingBrokerBps: 100,
    buyerBrokerBps: 100,
    reraId: "TN/11/Building/0294/2026",
    image: "/assets/prop-lakeview-courtyard.jpg",
    imageWidth: 640,
    imageHeight: 640,
    architecturalNote:
      "Cantilevered stone and thermal-glass mountain residence with wood-burning hearths, private orchard trails, and dedicated staff cottage.",
  },
];

const PORTFOLIO_GRID = [
  {
    id: "guava-house",
    title: "The Guava Orchard Villa",
    location: "Muttukadu Backwaters, ECR",
    bedrooms: 4,
    bathrooms: 5,
    land: "12,000 sq.ft Waterfront",
    garage: "4-Car Covered Vault · EV Ready",
    reserveCr: "₹9.80 Cr",
    splitBps: "100 bps + 100 bps",
    trialStay: "₹52,000 / night buyout",
    image: "/assets/prop-guava-house.jpg",
    tag: "Sale + Trial Stay",
  },
  {
    id: "mango-orchard",
    title: "Mango Orchard Farmstead",
    location: "cheyyur – Alamparai Coast",
    bedrooms: 6,
    bathrooms: 7,
    land: "3.2 Acres Organic Orchard",
    garage: "6-Car Collector Barn · Helipad Clear",
    reserveCr: "₹16.40 Cr",
    splitBps: "125 bps + 100 bps",
    trialStay: "₹84,000 / night buyout",
    image: "/assets/prop-mango-orchard.jpg",
    tag: "Exclusive Mandate",
  },
  {
    id: "coconut-grove",
    title: "Coconut Grove Coastal Estate",
    location: "Neelankarai Beachside, Chennai",
    bedrooms: 5,
    bathrooms: 6,
    land: "14,400 sq.ft (6 Grounds)",
    garage: "5-Car Subterranean Ramp · 22 kW EV",
    reserveCr: "₹28.50 Cr",
    splitBps: "100 bps + 125 bps",
    trialStay: "₹1,10,000 / night buyout",
    image: "/assets/prop-coconut-grove.jpg",
    tag: "Sovereign Freehold",
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
      className="seo-page"
      style={{ "--seo-max": "1320px" } as React.CSSProperties}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

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
              <span className="seo-brand-sub">realtor.9bhk.app</span>
            </Link>
            <span className="seo-header-badge">
              RERA Co-Broking &amp; Mandate Terminal
            </span>
          </div>

          <nav className="seo-nav" aria-label="Realtor portal navigation">
            <a href="#features" className="seo-nav-link">
              The desk
            </a>
            <a href="#mandate-portfolio" className="seo-nav-link">
              Mandates
            </a>
            <a href="#bps-ledger" className="seo-nav-link">
              Calculator
            </a>
            <a href="#pricing" className="seo-nav-link">
              Pricing
            </a>
            <a href="#protocol-schedule" className="seo-nav-link">
              FAQ
            </a>
            <Link href="/stays" className="seo-nav-link">
              Guest Catalog
            </Link>

            {signedInUser ? (
              <>
                {onEnterWorkspace && (
                  <button type="button" onClick={onEnterWorkspace} className="seo-nav-cta">
                    Open Broker Workspace →
                  </button>
                )}
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="btn outline sm"
                    style={{ marginLeft: 4 }}
                  >
                    Sign Out
                  </button>
                )}
              </>
            ) : (
              <a href="#broker-auth-desk" className="seo-nav-cta">
                Register / Sign In
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="seo-main" id="main-content" tabIndex={-1} style={{ maxWidth: 1320 }}>
        {/* Breadcrumb */}
        <nav className="seo-breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href="/">9bhk.app</Link>
            </li>
            <li className="seo-breadcrumb-sep" aria-hidden="true">
              /
            </li>
            <li aria-current="page">realtor.9bhk.app · RERA Broker &amp; Mandate Registry</li>
          </ol>
        </nav>

        {/* Hero Grid: Left Editorial + Interactive Photo Showcase | Right Sticky Auth Desk */}
        <section
          id="active-mandates"
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
                RERA Co-Broking Registry · Strictly 3 to 9 BHK Whole Estates
              </span>
              <h1
                className="seo-h1"
                style={{
                  fontSize: "clamp(32px, 4.4vw, 54px)",
                  maxWidth: "18ch",
                  marginTop: 8,
                }}
              >
                The broker desk for India&rsquo;s 3+ BHK estates.
              </h1>
              <p className="seo-lede" style={{ marginTop: 12 }}>
                Send unbranded client dossiers, lock 90-day accompanied site-visit attribution, and settle co-broking allocations in integer basis points (<code>bps</code>) &mdash; on one RERA-verified terminal built strictly for 3 to 9 BHK whole estates.
              </p>
              <div className="rl-hero-actions">
                {signedInUser && onEnterWorkspace ? (
                  <button type="button" className="btn" onClick={onEnterWorkspace}>
                    Open Broker Workspace &rarr;
                  </button>
                ) : (
                  <a className="btn" href="#broker-auth-desk">
                    Start the broker desk &rarr;
                  </a>
                )}
                <a className="btn outline" href="#bps-ledger">
                  Open the split calculator
                </a>
              </div>
            </div>

            {signedInUser && onEnterWorkspace && (
              <div
                className="seo-note"
                style={{
                  background: "var(--ok-soft)",
                  borderColor: "var(--ok)",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong style={{ display: "block", fontSize: 14, color: "var(--forest-deep)" }}>
                    Signed in as {signedInUser.email || signedInUser.name}
                  </strong>
                  <span style={{ fontSize: 12.5, color: "var(--moss)" }}>
                    Enter your Realtor Workspace to manage 3+ BHK mandates, CRM leads, and co-broking tie-ups.
                  </span>
                </div>
                <button type="button" className="btn sm" onClick={onEnterWorkspace}>
                  Enter Broker Workspace →
                </button>
              </div>
            )}

            {/* 4-Cell Architectural Stat Strip */}
            <ul className="seo-stats" style={{ margin: 0 }}>
              <li>
                <span className="seo-stat-value">3–9 BHK</span>
                <span className="seo-stat-label">Whole estates only</span>
              </li>
              <li>
                <span className="seo-stat-value">90 Days</span>
                <span className="seo-stat-label">Site-visit lead lock</span>
              </li>
              <li>
                <span className="seo-stat-value">100–250 bps</span>
                <span className="seo-stat-label">Integer escrow ledgers</span>
              </li>
              <li>
                <span className="seo-stat-value">4–8 Cars</span>
                <span className="seo-stat-label">Verified motor courts</span>
              </li>
            </ul>

            {/* Interactive Featured Mandate Photo Card */}
            <div className="seo-dossier">
              {/* Switcher Header */}
              <div className="seo-dossier-head">
                <div className="seo-dossier-title">
                  <Icon name="verified" style={{ width: 16, height: 16, color: "var(--forest)" }} />
                  <span>Featured 3+ BHK Co-Broking Dossier Preview</span>
                </div>
                <div className="seo-dossier-chips">
                  {ACTIVE_MANDATES.map((m, idx) => {
                    const active = idx === selectedMandateIdx;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedMandateIdx(idx);
                          setDealValueCr(m.reserveCr);
                        }}
                        aria-pressed={active}
                        className={active ? "chip seo-chip is-active" : "chip seo-chip"}
                      >
                        {m.bedrooms} BHK · {m.title.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Real Property Photograph with Overlaid Glass Pills */}
              <div
                className="seo-dossier-media"
                style={{
                  aspectRatio: `${activeMandate.imageWidth} / ${activeMandate.imageHeight}`,
                }}
              >
                <Image
                  src={activeMandate.image}
                  alt={`${activeMandate.title} — ${activeMandate.corridor}`}
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
                      "linear-gradient(180deg, rgba(16,37,30,0.32) 0%, rgba(16,37,30,0.04) 45%, rgba(16,37,30,0.82) 100%)",
                  }}
                />

                {/* Top Overlay Badges */}
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
                  <span className="seo-overlay-pill">{activeMandate.setting}</span>
                  <span className="seo-overlay-pill is-mono">
                    RERA: {activeMandate.reraId}
                  </span>
                </div>

                {/* Bottom Overlay Title + Reserve */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 14,
                    left: 16,
                    right: 16,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                    color: "var(--warm-white)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "clamp(22px, 2.6vw, 30px)",
                        fontWeight: 400,
                        lineHeight: 1.1,
                      }}
                    >
                      {activeMandate.title}
                    </div>
                    <div style={{ fontSize: 12.5, opacity: 0.9, marginTop: 2 }}>
                      {activeMandate.corridor} · {activeMandate.bedrooms} Bedrooms · {activeMandate.bathrooms} Baths · Up to {activeMandate.maxGuests} Guests
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 26,
                        fontWeight: 400,
                        lineHeight: 1,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      ₹{activeMandate.reserveCr.toFixed(2)} Cr
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.85, marginTop: 3 }}>
                      Co-Broking Pool: {activeMandate.listingBrokerBps} + {activeMandate.buyerBrokerBps} bps
                    </div>
                  </div>
                </div>
              </div>

              {/* Architectural Specs Footer */}
              <div style={{ padding: 18 }}>
                <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "var(--moss)", lineHeight: 1.55 }}>
                  {activeMandate.architecturalNote}
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 12,
                    paddingTop: 12,
                    borderTop: "1px solid var(--border)",
                    fontSize: 12.5,
                  }}
                >
                  <div>
                    <span style={{ color: "var(--muted)", display: "block", fontSize: 11 }}>
                      LAND &amp; TITLE EXTENT
                    </span>
                    <strong style={{ color: "var(--fg)" }}>{activeMandate.landExtent}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", display: "block", fontSize: 11 }}>
                      SUPERCAR &amp; MOTOR VAULT
                    </span>
                    <strong style={{ color: "var(--fg)" }}>{activeMandate.garageSpec}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", display: "block", fontSize: 11 }}>
                      TRIAL-STAY BUYOUT TARIFF
                    </span>
                    <strong style={{ color: "var(--forest)" }}>
                      ₹{activeMandate.nightlyInr.toLocaleString("en-IN")} / night (Credited on Sale)
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Realtor Auth & Onboarding Desk */}
          <div id="broker-auth-desk" className="seo-auth-desk">
            <PortalAuthCard
              portal="realtor"
              defaultNext="/realtor"
              onAuthenticated={onEnterWorkspace}
            />

            {/* Quick Unbranded Client Preview Callout */}
            <div
              className="seo-note"
              style={{ marginTop: 14 }}
            >
              <Icon name="shield" style={{ width: 18, height: 18, color: "var(--forest)", flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12.5, color: "var(--moss)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--fg)", display: "block", marginBottom: 2 }}>
                  Zero Client Circumvention Architecture
                </strong>
                When you share a <code>?mode=client</code> presentation dossier from your workspace, 9bhk strips platform contact forms and pins your brokerage RERA header to every estate sheet.
              </div>
            </div>
          </div>
        </section>

        {/* Capability grid — what the desk actually does */}
        <section id="features" className="seo-section">
          <div className="rl-section-head">
            <span className="seo-eyebrow">The desk</span>
            <h2 className="seo-h2" style={{ margin: "6px 0 8px" }}>
              Everything a co-broking mandate needs, minus the spreadsheet.
            </h2>
            <p className="seo-section-lede" style={{ marginBottom: 0 }}>
              One terminal for the whole mandate lifecycle: the estate book, the
              client-facing sheet, the tie-up ledger, and the documents that
              unlock it.
            </p>
          </div>

          <div className="rl-features">
            <article className="rl-feature">
              <span className="rl-feature-num">01 &middot; Mandate book</span>
              <h3>Dossiers, not a listings feed</h3>
              <p>
                Each entry carries land extent, motor vault, RERA ID, and the
                reserve in crore. Only 3 to 9 BHK whole estates ever enter the
                book.
              </p>
            </article>
            <article className="rl-feature">
              <span className="rl-feature-num">02 &middot; Client links</span>
              <h3>Unbranded client presentations</h3>
              <p>
                Share a <code>?mode=client</code> sheet that strips platform
                contact forms and pins your brokerage RERA header to every
                estate page.
              </p>
            </article>
            <article className="rl-feature">
              <span className="rl-feature-num">03 &middot; Tie-up ledger</span>
              <h3>Integer bps, locked early</h3>
              <p>
                Agree co-broking allocations in basis points and lock the ledger
                before buyer disclosure, so nothing is renegotiated at
                settlement.
              </p>
            </article>
            <article className="rl-feature">
              <span className="rl-feature-num">04 &middot; Compliance</span>
              <h3>One verified KYC locker</h3>
              <p>
                RERA certificate, PAN, and GST sit in a single locker, reviewed
                through the compliance gate before a mandate unlocks.
              </p>
            </article>
          </div>
        </section>

        {/* Live 3+ BHK Mandate Portfolio Grid with Real Photography */}
        <section id="mandate-portfolio" className="seo-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            <div>
              <span className="seo-eyebrow">Active Co-Broking Inventory</span>
              <h2 className="seo-h2" style={{ margin: "6px 0 0" }}>
                Representative 3+ BHK Sale &amp; Trial-Stay Mandates
              </h2>
            </div>
            <a href="#broker-auth-desk" className="btn outline sm">
              Open the full mandate book →
            </a>
          </div>

          <div className="seo-grid">
            {PORTFOLIO_GRID.map((item) => (
              <article key={item.id} className="seo-card seo-card-static">
                <div className="seo-card-media">
                  <Image
                    src={item.image}
                    alt={`${item.title} — ${item.location}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 380px"
                    className="seo-card-img"
                  />
                  <span className="seo-card-tag">{item.tag}</span>
                  <span className="seo-card-BHK">{item.bedrooms} BHK</span>
                </div>
                <div className="seo-card-body">
                  <div className="seo-card-loc">
                    <Icon name="pin" style={{ width: 13, height: 13 }} />
                    <span>{item.location}</span>
                  </div>
                  <h3 className="seo-card-title">{item.title}</h3>
                  <div className="seo-card-facts">
                    <span>{item.land}</span>
                    <span>·</span>
                    <span>{item.garage}</span>
                  </div>
                  <div className="seo-card-foot">
                    <div>
                      <div className="seo-price">{item.reserveCr}</div>
                      <span className="seo-price-sub">{item.trialStay}</span>
                    </div>
                    <span className="seo-bps-pill">{item.splitBps}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Forest Architectural Banner: Interactive Basis-Point (bps) Co-Broking Split Calculator */}
        <section
          id="bps-ledger"
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
              alignItems: "center",
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
                Transparent Integer Basis-Point Ledger
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
                Simulate your co-broking split in integer basis points before proposing a tie-up.
              </h2>
              <p style={{ color: "rgba(252,251,248,0.82)", fontSize: 14.5, lineHeight: 1.6, margin: "0 0 22px" }}>
                Every brokerage tie-up on <code>realtor.9bhk.app</code> is denominated in integer basis points (<code>100 bps</code> equals one hundredth of the mandate consideration) and locked in PostgreSQL before buyer disclosure.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <label style={{ display: "block" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "var(--warm-white)",
                      marginBottom: 8,
                    }}
                  >
                    <span>Estate Mandate Consideration</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--sand)" }}>
                      ₹{dealValueCr.toFixed(1)} Crore
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={45}
                    step={0.5}
                    value={dealValueCr}
                    aria-label="Estate mandate consideration in crore"
                    aria-valuetext={`₹${dealValueCr.toFixed(1)} crore`}
                    onChange={(e) => setDealValueCr(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--terracotta)", cursor: "pointer" }}
                  />
                </label>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {SPLIT_PRESETS.map((preset, idx) => {
                    const active = idx === splitPresetIdx;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setSplitPresetIdx(idx)}
                        aria-pressed={active}
                        style={{
                          textAlign: "left",
                          padding: "13px 14px",
                          borderRadius: "var(--r-md)",
                          border: active
                            ? "1.5px solid var(--sand)"
                            : "1px solid rgba(252,251,248,0.18)",
                          background: active
                            ? "rgba(252,251,248,0.14)"
                            : "rgba(16,37,30,0.45)",
                          color: "var(--warm-white)",
                          fontSize: 13,
                          fontWeight: 600,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span>{preset.label}</span>
                        <span style={{ fontFamily: "var(--font-mono)", color: "var(--sand)", fontSize: 12 }}>
                          {preset.listingBps + preset.buyerBps} bps pool
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Ledger Breakdown Sheet */}
            <div
              style={{
                background: "var(--warm-white)",
                color: "var(--fg)",
                borderRadius: "var(--r-lg)",
                padding: 26,
                boxShadow: "var(--sh-float)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                <span className="seo-bps-pill">Escrow Split Voucher Preview</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--muted)" }}>
                  Integer bps · zero rounding
                </span>
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 26,
                  fontWeight: 400,
                  margin: "0 0 16px",
                  color: "var(--forest-deep)",
                }}
              >
                Tripartite Co-Broking Allocation
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13.5 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: 10,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span style={{ color: "var(--moss)" }}>Gross Sale Consideration</span>
                  <strong style={{ fontFamily: "var(--font-mono)" }}>₹{dealValueCr.toFixed(2)} Cr</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: 10,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span style={{ color: "var(--moss)" }}>
                    Listing Mandate Broker ({activeSplit.listingBps} bps)
                  </span>
                  <strong style={{ fontFamily: "var(--font-mono)", color: "var(--forest)" }}>
                    {formatLakhsAndCrores(listingShareInr)}
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: 10,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span style={{ color: "var(--moss)" }}>
                    Buyer Introducer Broker ({activeSplit.buyerBps} bps)
                  </span>
                  <strong style={{ fontFamily: "var(--font-mono)", color: "var(--terracotta)" }}>
                    {formatLakhsAndCrores(buyerShareInr)}
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: 4,
                    fontSize: 15,
                  }}
                >
                  <strong>Total Broker Allocation ({activeSplit.listingBps + activeSplit.buyerBps} bps)</strong>
                  <strong style={{ fontFamily: "var(--font-mono)", color: "var(--forest-deep)" }}>
                    {formatLakhsAndCrores(totalAllocationInr)}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  marginTop: 18,
                  padding: "12px 14px",
                  borderRadius: "var(--r-md)",
                  background: "var(--surface-2)",
                  fontSize: 12,
                  color: "var(--moss)",
                  lineHeight: 1.5,
                }}
              >
                Both RERA broker IDs and PAN numbers are bound to the digital tie-up agreement prior to scheduling an accompanied client site visit.
              </div>
            </div>
          </div>
        </section>

        {/* Membership pricing — one honest tier */}
        <section id="pricing" className="seo-section">
          <div className="rl-section-head rl-center">
            <span className="seo-eyebrow">Membership</span>
            <h2 className="seo-h2" style={{ margin: "6px 0 8px" }}>
              One desk. One monthly fee.
            </h2>
            <p className="seo-section-lede" style={{ marginBottom: 0 }}>
              The workspace is billed as a flat broker membership. Co-broking
              allocations are agreed between the named brokers and recorded on
              the ledger in basis points.
            </p>
          </div>

          <div className="rl-price-card">
            <div className="rl-price-main">
              <span className="seo-bps-pill">Verified Broker Membership</span>
              <div className="rl-price-figure">
                ₹500<span>/ month</span>
              </div>
              <p className="rl-price-sub">
                Billed monthly in INR. Requires State RERA registration and PAN
                verification through the compliance gate.
              </p>
              {signedInUser && onEnterWorkspace ? (
                <button
                  type="button"
                  className="btn"
                  style={{ marginTop: 8 }}
                  onClick={onEnterWorkspace}
                >
                  Open Broker Workspace &rarr;
                </button>
              ) : (
                <a className="btn" style={{ marginTop: 8 }} href="#broker-auth-desk">
                  Activate the broker desk &rarr;
                </a>
              )}
              <p className="rl-price-sub" style={{ marginTop: 4 }}>
                Already registered? Sign in from the desk on this page.
              </p>
            </div>

            <div className="rl-price-includes">
              <h3>Included every month</h3>
              <ul className="rl-price-list">
                <li>Full 3+ BHK mandate book with RERA dossiers</li>
                <li>Unbranded <code>?mode=client</code> presentation links</li>
                <li>90-day accompanied site-visit lock</li>
                <li>CRM requirement pipeline and client roster</li>
                <li>Basis-point tie-up ledgers with escrow preview</li>
                <li>RERA, PAN, and GST document locker</li>
              </ul>
            </div>
          </div>
          <p className="rl-price-note">
            Membership is a workspace fee, not a brokerage share. Any co-broking
            split is a separate agreement between the named RERA brokers and is
            stored on the tie-up ledger in <code>bps</code>.
          </p>
        </section>

        {/* Architectural Comparison & FAQ */}
        <section id="protocol-schedule" className="seo-section">
          <span className="seo-eyebrow">Portal Governance</span>
          <h2 className="seo-h2" style={{ marginTop: 6 }}>
            Why RERA Brokers Operate on a Dedicated Subdomain
          </h2>
          <div className="seo-faq" style={{ marginTop: 18 }}>
            <div className="seo-faq-list">
              <details className="seo-faq-item" open>
                <summary>
                  <span>How does realtor.9bhk.app protect my client introductions?</span>
                  <span className="seo-faq-mark" aria-hidden="true" />
                </summary>
                <div className="seo-faq-answer">
                  <p>
                    Every buyer requirement logged in your CRM desk generates a timestamped hash. When you initiate a co-broking tie-up with a listing mandate holder or estate owner, your brokerage holds a 90-day accompanied site-visit attribution lock across both trial stays and freehold acquisitions.
                  </p>
                </div>
              </details>
              <details className="seo-faq-item">
                <summary>
                  <span>Why are brokerage splits recorded in basis points (bps)?</span>
                  <span className="seo-faq-mark" aria-hidden="true" />
                </summary>
                <div className="seo-faq-answer">
                  <p>
                    Integer basis points (where 100 bps equals one hundredth of the transaction value) eliminate floating-point rounding discrepancies in multi-crore escrow settlements and tripartite mandate agreements.
                  </p>
                </div>
              </details>
              <details className="seo-faq-item">
                <summary>
                  <span>What does the ₹500 monthly membership cover?</span>
                  <span className="seo-faq-mark" aria-hidden="true" />
                </summary>
                <div className="seo-faq-answer">
                  <p>
                    It unlocks the full 3+ BHK mandate book, unbranded client presentation links, the 90-day accompanied site-visit lock, the CRM requirement pipeline, basis-point tie-up ledgers, and the document locker. It is a workspace fee, so co-broking allocations remain a separate agreement between the named brokers.
                  </p>
                </div>
              </details>
              <details className="seo-faq-item">
                <summary>
                  <span>Can a guest account access realtor.9bhk.app tools?</span>
                  <span className="seo-faq-mark" aria-hidden="true" />
                </summary>
                <div className="seo-faq-answer">
                  <p>
                    No. Each 9bhk portal enforces strict account isolation. Operating on <code>realtor.9bhk.app</code> requires a dedicated Realtor account with State RERA registration and PAN verification reviewed by <code>admin.9bhk.app</code>.
                  </p>
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* Closing CTA band */}
        <section className="seo-closing">
          <span className="seo-eyebrow">Your next mandate</span>
          <h2>Bring the next 3+ BHK mandate to a desk that settles in bps.</h2>
          <p>
            Register your brokerage once, clear the RERA and PAN gate, and the
            estate book, client sheets, and tie-up ledgers open together.
          </p>
          {signedInUser && onEnterWorkspace ? (
            <button type="button" className="seo-btn" onClick={onEnterWorkspace}>
              Open Broker Workspace
            </button>
          ) : (
            <a className="seo-btn" href="#broker-auth-desk">
              Register your brokerage
            </a>
          )}
        </section>
      </main>

      {/* Native 9bhk Footer */}
      <footer className="seo-footer">
        <div className="seo-footer-inner">
          <div>
            <strong>realtor.9bhk.app</strong> · RERA Realtor &amp; Mandate Registry · Strictly 3+ BHK Whole Properties
          </div>
          <div className="seo-footer-links">
            <Link href="/">Guest Catalog (www)</Link>
            <Link href="/host">Estate Owners (owners)</Link>
            <Link href="/admin">Compliance Gate (admin)</Link>
            <Link href="/stays">All 3+ BHK Stays</Link>
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
