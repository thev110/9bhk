"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { Icon } from "@/components/icon";
import { useStore, type RealtorClient, type RealtorProperty, isShowcaseEligible } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { BaseSheet } from "@/components/base-sheet";
import { useCatalog } from "@/lib/catalog";
import { CITIES, inr } from "@/lib/format";
import { formatInrCrores, type Property } from "@/lib/properties";
import { RazorpayCheckout, type RazorpayPaymentSuccess } from "@/components/RazorpayCheckout";

export default function RealtorPortalPage() {
  const router = useRouter();
  const {
    clients,
    addClient,
    removeClient,
    presentationMode,
    setPresentationMode,
    showToast,
    brokerSubscribed,
    brokerSubscriptionPaymentId,
    reloadAccount,
    realtorProperties,
    addRealtorProperty,
    removeRealtorProperty,
    user,
    updateUser,
    ready,
    sessionChecked,
  } = useStore();
  const t = useT();
  const { properties } = useCatalog();

  // Route protection: redirect unauthenticated visitors to login with return URL
  useEffect(() => {
    if (!ready || !sessionChecked || user) return;
    router.replace(`/login?next=${encodeURIComponent("/realtor")}`);
  }, [ready, sessionChecked, user, router]);

  const [activeTab, setActiveTab] = useState<"catalog" | "clients">("catalog");
  const [addClientModalOpen, setAddClientModalOpen] = useState(false);
  const [addPropertyModalOpen, setAddPropertyModalOpen] = useState(false);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);

  // Agency Profile State — initialized from signed-in user or empty
  const [agencyName, setAgencyName] = useState(user?.agencyName || "");
  const [reraNumber, setReraNumber] = useState(user?.reraNumber || "");
  const [tempAgencyName, setTempAgencyName] = useState(user?.agencyName || "");
  const [tempReraNumber, setTempReraNumber] = useState(user?.reraNumber || "");

  // Sync when user profile loads from database or storage
  useEffect(() => {
    if (user?.agencyName && !agencyName) {
      setAgencyName(user.agencyName);
      setTempAgencyName(user.agencyName);
    }
    if (user?.reraNumber && !reraNumber) {
      setReraNumber(user.reraNumber);
      setTempReraNumber(user.reraNumber);
    }
  }, [user, agencyName, reraNumber]);

  // New Client Form State
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [budgetMin, setBudgetMin] = useState(5);
  const [budgetMax, setBudgetMax] = useState(20);
  const [preferredStretch, setPreferredStretch] = useState("Chennai");
  const [garageNeed, setGarageNeed] = useState("Standard Covered Parking (2-4 cars)");
  const [confidential, setConfidential] = useState(true);
  const [notes, setNotes] = useState("");

  // New Property Form State
  const [propName, setPropName] = useState("");
  const [propLocation, setPropLocation] = useState("");
  const [propCity, setPropCity] = useState("Chennai");
  const [propBedrooms, setPropBedrooms] = useState(3);
  const [propBathrooms, setPropBathrooms] = useState(3);
  const [propGuests, setPropGuests] = useState(10);
  const [propForRent, setPropForRent] = useState(true);
  const [propForSale, setPropForSale] = useState(false);
  const [propNightlyRate, setPropNightlyRate] = useState(25000);
  const [propSalePriceCr, setPropSalePriceCr] = useState(5);
  const [propPool, setPropPool] = useState(true);
  const [propNotes, setPropNotes] = useState("");

  const clientList = Array.isArray(clients) ? clients : [];
  const propertyList = Array.isArray(realtorProperties) ? realtorProperties : [];
  const totalMandateValue = clientList.reduce((acc, c) => acc + (c?.budgetMaxCr || 0), 0);

  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://www.9bhk.app";

  function requireSubscription(actionName: string): boolean {
    if (!brokerSubscribed) {
      showToast(`Please activate the ₹500/month Broker Subscription to ${actionName}.`);
      const card = document.getElementById("broker-subscription-card");
      if (card) {
        card.scrollIntoView({ behavior: "smooth" });
      }
      return false;
    }
    return true;
  }

  function copyToClipboard(text: string, label: string) {
    if (!requireSubscription("share catalog links")) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text).then(() => showToast(`Copied ${label} to clipboard`)).catch(() => showToast("Could not copy the link."));
    } else {
      showToast(`Link ready: ${text}`);
    }
  }

  function shareWhatsApp(text: string) {
    if (!requireSubscription("share listings via WhatsApp")) return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    const cleanAgency = tempAgencyName.trim();
    const cleanRera = tempReraNumber.trim();
    try { await updateUser({
      agencyName: cleanAgency,
      reraNumber: cleanRera,
      role: "realtor",
    });
    setAgencyName(cleanAgency); setReraNumber(cleanRera);
    } catch (e) { showToast(e instanceof Error ? e.message : "Profile was not saved."); return; }
    showToast("Broker profile updated successfully");
    setEditProfileModalOpen(false);
  }

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    if (!requireSubscription("onboard clients")) return;
    if (!clientName.trim() || !clientPhone.trim()) {
      showToast(t("realtor.toastNeedNamePhone"));
      return;
    }
    const newClient: RealtorClient = {
      id: crypto.randomUUID(),
      name: clientName.trim(),
      phone: clientPhone.trim(),
      email: clientEmail.trim() || undefined,
      budgetMinCr: Number(budgetMin) || 5,
      budgetMaxCr: Number(budgetMax) || 20,
      preferredStretch,
      garageNeed,
      confidential,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString().split("T")[0],
    };
    try { await addClient(newClient); } catch (e) { showToast(e instanceof Error ? e.message : "Client was not saved."); return; }
    showToast(t("realtor.toastClientOnboarded", { name: newClient.name }));
    setAddClientModalOpen(false);
    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setNotes("");
  }

  async function handleCreateProperty(e: React.FormEvent) {
    e.preventDefault();
    if (!requireSubscription("add properties")) return;
    if (!propName.trim() || !propLocation.trim()) {
      showToast("Please enter a property name and location stretch.");
      return;
    }
    const newProp: RealtorProperty = {
      id: crypto.randomUUID(),
      name: propName.trim(),
      location: propLocation.trim(),
      city: propCity,
      bedrooms: Number(propBedrooms) || 1,
      bathrooms: Number(propBathrooms) || 1,
      guests: Number(propGuests) || 4,
      forRent: propForRent,
      forSale: propForSale,
      nightlyRate: propForRent ? Number(propNightlyRate) || 20000 : undefined,
      salePriceCr: propForSale ? Number(propSalePriceCr) || 5 : undefined,
      pool: propPool,
      notes: propNotes.trim() || undefined,
      createdAt: new Date().toISOString().split("T")[0],
    };
    try { await addRealtorProperty(newProp); } catch (e) { showToast(e instanceof Error ? e.message : "Property was not saved."); return; }
    const eligible = isShowcaseEligible(newProp);
    showToast(
      eligible
        ? `Added "${newProp.name}" to your private catalog. Public listings require approval.`
        : `Added "${newProp.name}" to your private catalog.`
    );
    setAddPropertyModalOpen(false);
    setPropName("");
    setPropLocation("");
    setPropNotes("");
  }

  async function handleImportFrom9bhk(p: Property) {
    if (!requireSubscription("import 9bhk listings")) return;
    if (propertyList.some((rp) => rp.sourcePropertyId === p.id)) {
      showToast(`"${p.name}" is already in your catalog`);
      return;
    }
    const newProp: RealtorProperty = {
      id: crypto.randomUUID(),
      sourcePropertyId: p.id,
      name: p.name,
      location: p.location,
      city: p.city,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      guests: p.guests,
      forRent: true,
      forSale: Boolean(p.isForSale),
      nightlyRate: p.price,
      salePriceCr: p.salePrice ? Number((p.salePrice / 10000000).toFixed(2)) : undefined,
      pool: p.amenities?.some((a) => a.toLowerCase().includes("pool")) ?? false,
      notes: p.blurb || p.highlights,
      createdAt: new Date().toISOString().split("T")[0],
    };
    try { await addRealtorProperty(newProp); } catch (e) { showToast(e instanceof Error ? e.message : "Property was not saved."); return; }
    showToast(`Added "${p.name}" to your broker catalog`);
    setPortfolioModalOpen(false);
  }

  if (!ready || !sessionChecked) {
    return (
      <Shell>
        <PageBar title={t("realtor.portalTitle")} backHref="/buy" />
        <div className="pad center mt" style={{ padding: "80px 20px", textAlign: "center" }}>
          <p className="muted">Verifying broker credentials...</p>
        </div>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <PageBar title={t("realtor.portalTitle")} backHref="/buy" />
        <div className="pad mt" style={{ maxWidth: 540, margin: "40px auto" }}>
          <div
            className="card"
            style={{
              padding: 32,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "color-mix(in oklch, var(--primary) 12%, var(--surface))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
              }}
            >
              <Icon name="shield" style={{ width: 30, height: 30 }} />
            </div>
            <div>
              <span className="pill warn">Authentication Required</span>
              <h2 style={{ fontSize: 24, marginTop: 12, marginBottom: 8 }}>
                Broker &amp; Distributor Workspace
              </h2>
              <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.5, margin: "0 auto", maxWidth: 440 }}>
                This workspace is exclusive to certified real estate agents, brokers, and wealth advisors. Please sign in or create an account to access client mandate tracking, your digital catalog, and presentation mode.
              </p>
            </div>
            <div className="stack" style={{ width: "100%", gap: 10, marginTop: 12 }}>
              <Link className="btn accent block" href="/login?next=/realtor">
                {t("auth.signIn")}
              </Link>
              <Link className="btn outline block" href="/signup?next=/realtor">
                {t("auth.createAccount")}
              </Link>
              <Link
                className="btn ghost sm"
                href="/onboarding"
                style={{ fontSize: 12, color: "var(--moss)", marginTop: 4 }}
              >
                New to 9bhk? Onboard as a Certified Broker →
              </Link>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <PageBar
        title={t("realtor.portalTitle")}
        backHref="/buy"
        right={
          <div className="row" style={{ gap: 8 }}>
            <Link className="btn sm ghost" href="/profile" title="View Profile">
              <Icon name="user" /> {user.name ? user.name.split(" ")[0] : "Profile"}
            </Link>
            <button
              className={`btn sm ${presentationMode ? "accent" : "outline"}`}
              type="button"
              onClick={() => {
                const next = !presentationMode;
                setPresentationMode(next);
                showToast(next ? t("realtor.toastPresentationOn") : t("realtor.toastPresentationOff"));
              }}
            >
              {presentationMode ? t("realtor.presentationActive") : t("realtor.presentationMode")}
            </button>
          </div>
        }
      />

      {/* Header Banner */}
      <header className="page-head">
        <div className="between" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div>
            <p className="eyebrow">{t("realtor.workspaceEyebrow")}</p>
            <h1 style={{ fontSize: 30, marginTop: 4 }}>Broker &amp; Distributor Workspace</h1>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>
              {agencyName ? (
                <>
                  <strong>{agencyName}</strong>
                  {reraNumber ? t("realtor.agencyRera", { rera: reraNumber }) : ""}
                  <span style={{ marginLeft: 8, opacity: 0.8 }}>· {user.name} ({user.email})</span>
                </>
              ) : (
                <>
                  <span>Signed in as <strong>{user.name}</strong> ({user.email}) · </span>
                  <span style={{ fontStyle: "italic" }}>
                    Agency details not configured · Tap &ldquo;Edit Profile&rdquo; to add your agency &amp; RERA number.
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="row" style={{ gap: 8 }}>
            {user.verifiedBroker ? <span className="pill ok">{t("realtor.reraVerified")}</span> : reraNumber ? <span className="pill">Verification pending</span> : null}
            <button
              className="btn sm outline"
              type="button"
              onClick={() => {
                setTempAgencyName(agencyName);
                setTempReraNumber(reraNumber);
                setEditProfileModalOpen(true);
              }}
            >
              <Icon name="pencil" /> Edit Profile
            </button>
          </div>
        </div>
      </header>

      {/* Incomplete Agency Profile Banner */}
      {!agencyName && !reraNumber ? (
        <div className="pad mt">
          <div
            className="card"
            style={{
              background: "color-mix(in oklch, var(--primary) 8%, var(--surface))",
              border: "1px dashed var(--primary)",
              padding: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="pill info">Setup Incomplete</span>
                <strong>Welcome, {user.name || "Partner"}! Set up your Broker Credentials</strong>
              </div>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 4, margin: 0 }}>
                Add your agency name and RERA registration number to complete your broker profile. Verification is reviewed separately by staff.
              </p>
            </div>
            <button
              className="btn accent sm"
              type="button"
              onClick={() => {
                setTempAgencyName(agencyName || user.agencyName || "");
                setTempReraNumber(reraNumber || user.reraNumber || "");
                setEditProfileModalOpen(true);
              }}
            >
              Configure Agency Profile
            </button>
          </div>
        </div>
      ) : null}

      {/* Presentation Mode Status Banner */}
      {presentationMode ? (
        <div className="pad mt">
          <div
            className="card"
            style={{
              background: "color-mix(in oklch, var(--accent) 12%, var(--surface))",
              border: "1px solid var(--accent)",
            }}
          >
            <div className="between">
              <div>
                <strong>{t("realtor.presentationLive")}</strong>
                <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {t("realtor.presentationLiveBody")}
                </p>
              </div>
              <button className="btn outline sm" type="button" onClick={() => setPresentationMode(false)}>
                {t("realtor.presentationDisable")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ₹500 Subscription Status Bar with Real Razorpay Checkout */}
      <div className="pad mt" id="broker-subscription-card">
        <div
          className="card"
          style={{
            background: brokerSubscribed
              ? "color-mix(in oklch, var(--primary) 8%, var(--surface))"
              : "color-mix(in oklch, var(--warn) 8%, var(--surface))",
            border: `1px solid ${brokerSubscribed ? "var(--primary)" : "var(--warn)"}`,
            padding: 16,
          }}
        >
          <div className="between" style={{ flexWrap: "wrap", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className={`pill ${brokerSubscribed ? "forest" : "warn"}`}>
                  {brokerSubscribed ? "✓ ₹500 / mo Active" : "Subscription Required"}
                </span>
                <strong style={{ fontSize: 14 }}>Broker Catalog &amp; Client Link Suite</strong>
              </div>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                {brokerSubscribed
                  ? `Active Broker Membership. Branded digital catalog links, client mandate tracking, calendar booking routing, and WhatsApp links are fully unlocked.${
                      brokerSubscriptionPaymentId ? ` Receipt: ${brokerSubscriptionPaymentId}` : ""
                    }`
                  : "Activate your ₹500 monthly subscription to unlock branded client links, interactive calendar booking, and client roster management."}
              </p>
            </div>
            <div>
              {brokerSubscribed ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="pill ok" style={{ fontSize: 11 }}>
                    All Features Unlocked
                  </span>
                </div>
              ) : (
                <RazorpayCheckout
                  kind="subscription"
                  amount={500}
                  propertyName="Broker Workspace Monthly Subscription"
                  bookingCode={`broker_${Date.now()}`}
                  buttonText="Subscribe for ₹500 / mo"
                  className="btn accent sm"
                  guestName={user.name || agencyName || "Broker"}
                  guestEmail={user.email || "broker@9bhk.app"}
                  guestPhone={user.phone || "+91 99999 99999"}
                  onSuccess={async (_payment: RazorpayPaymentSuccess) => {
                    await reloadAccount(); showToast("Subscription payment verified. Your account has been refreshed.");
                  }}
                  onError={(err) => {
                    showToast(`Payment error: ${err.message}`);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Performance & Mandate Metrics */}
      <div className="stats pad mt">
        <div className="stat">
          <p className="lb">
            <Icon name="home" />
            Broker Catalog
          </p>
          <p className="nb">{propertyList.length}</p>
          <p className="sub">
            {propertyList.filter(p => p.sourcePropertyId && properties.some(item => item.id === p.sourcePropertyId)).length} Public listings · {propertyList.filter(p => !p.sourcePropertyId || !properties.some(item => item.id === p.sourcePropertyId)).length} Private
          </p>
        </div>
        <div className="stat">
          <p className="lb">
            <Icon name="users" />
            Client Roster
          </p>
          <p className="nb">{clientList.length}</p>
          <p className="sub">Mandates locked</p>
        </div>
        <div className="stat">
          <p className="lb">
            <Icon name="wallet" />
            Mandate Value
          </p>
          <p className="nb">₹{totalMandateValue} Cr</p>
          <p className="sub">Active buyer power</p>
        </div>
        <div className="stat">
          <p className="lb">
            <Icon name="shield" />
            Platform Rule
          </p>
          <p className="nb">3 BHK</p>
          <p className="sub">Minimum app showcase floor</p>
        </div>
      </div>

      {/* View Switcher: Catalog vs Clients */}
      <div className="pad mt">
        <div className="seg">
          <button
            type="button"
            aria-selected={activeTab === "catalog"}
            onClick={() => setActiveTab("catalog")}
          >
            Property Catalog ({propertyList.length})
          </button>
          <button
            type="button"
            aria-selected={activeTab === "clients"}
            onClick={() => setActiveTab("clients")}
          >
            Client List ({clientList.length})
          </button>
        </div>
      </div>

      {/* ── TAB 1: PROPERTY CATALOG ────────────────────────────────────────── */}
      {activeTab === "catalog" ? (
        <div className="pad mt">
          <div className="between" style={{ flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2>Your Digital Property Catalog</h2>
              <p className="muted" style={{ fontSize: 12 }}>
                Your private catalog is available on your devices. Approved 9bhk listings have public client links.
              </p>
            </div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn outline sm"
                type="button"
                onClick={() => {
                  const catalogLink = `${origin}/buy?broker=${encodeURIComponent(agencyName || "Broker")}`;
                  copyToClipboard(catalogLink, "Full Catalog Link");
                }}
              >
                Copy Catalog Link
              </button>
              <button
                className="btn outline sm"
                type="button"
                onClick={() => {
                  if (!requireSubscription("import 9bhk listings")) return;
                  setPortfolioModalOpen(true);
                }}
              >
                + Add from 9bhk Portfolio
              </button>
              <button
                className="btn sm"
                type="button"
                onClick={() => {
                  if (!requireSubscription("add properties")) return;
                  setAddPropertyModalOpen(true);
                }}
              >
                + Add Custom Property
              </button>
            </div>
          </div>

          {/* 3-BHK Platform Rule Card */}
          <div
            className="card mt"
            style={{
              background: "color-mix(in oklch, var(--primary) 5%, var(--surface))",
              border: "1px dashed var(--border)",
              padding: 12,
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span className="pill info" style={{ marginTop: 2 }}>3-BHK Rule</span>
              <p style={{ fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>
                <strong>How the 9bhk showcase works:</strong> You can organize any property in your private catalog. However, <strong>only properties with 3 BHK or more can be showcased in the public 9bhk app</strong> for rent or sale. Custom records remain private until a marketplace listing is submitted and approved. Imported approved listings have public client and booking links.
              </p>
            </div>
          </div>

          {propertyList.length === 0 ? (
            <div
              className="card mt"
              style={{
                textAlign: "center",
                padding: "36px 20px",
                border: "1px dashed var(--border)",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏡</div>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Your Broker Catalog is Empty</h3>
              <p className="muted" style={{ fontSize: 13, maxWidth: 460, margin: "6px auto 16px" }}>
                Add your exclusive listings, or represent verified farmhouses and beachfront estates directly from the 9bhk luxury collection.
              </p>
              <div className="row" style={{ justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                <button
                  className="btn sm outline"
                  type="button"
                  onClick={() => {
                    if (!requireSubscription("import 9bhk listings")) return;
                    setPortfolioModalOpen(true);
                  }}
                >
                  Browse 9bhk Portfolio
                </button>
                <button
                  className="btn sm accent"
                  type="button"
                  onClick={() => {
                    if (!requireSubscription("add custom properties")) return;
                    setAddPropertyModalOpen(true);
                  }}
                >
                  + Add Custom Property
                </button>
              </div>
            </div>
          ) : (
            <div className="stack mt">
              {propertyList.map((prop) => {
                const eligible = isShowcaseEligible(prop);
                const isCatalogProperty = Boolean(prop.sourcePropertyId && properties.some(p => p.id === prop.sourcePropertyId));
                const propUrl = isCatalogProperty ? `${origin}/property/${prop.sourcePropertyId}` : "";
                const calendarBookingUrl = isCatalogProperty ? `${origin}/book/${prop.sourcePropertyId}` : "";
                const shareText = `Property: ${prop.name} (${prop.bedrooms} BHK in ${prop.location})\n${propUrl}`;

                return (
                  <article key={prop.id} className="card" style={{ padding: 16 }}>
                    {!isCatalogProperty ? <p className="help">Private to your broker account. Public sharing and booking require a reviewed marketplace listing.</p> : null}
                    <div className="between">
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 800 }}>{prop.name}</h3>
                          <span className={`pill ${eligible ? "ok" : "warn"}`} style={{ fontSize: 10.5 }}>
                            {isCatalogProperty ? "Approved public listing" : "Private broker record"}
                          </span>
                        </div>
                        <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                          {prop.location} · {prop.bedrooms} BHK · {prop.bathrooms} Bath · Sleeps {prop.guests}
                          {prop.pool ? " · Private Pool" : ""}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {prop.nightlyRate ? (
                          <div>
                            <strong style={{ fontSize: 14 }}>{inr(prop.nightlyRate)}</strong>
                            <small className="muted"> / night</small>
                          </div>
                        ) : null}
                        {prop.salePriceCr ? (
                          <div style={{ fontSize: 12, color: "var(--moss)", fontWeight: 700 }}>
                            Sale: ₹{prop.salePriceCr} Cr
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <p className="tiny muted mt" style={{ margin: "8px 0 0", fontStyle: "italic" }}>
                      {eligible
                        ? "Meets the 3-bedroom minimum; marketplace publication still requires approval."
                        : "Fewer than 3 bedrooms: private catalog only."}
                    </p>

                    {prop.notes ? (
                      <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                        &ldquo;{prop.notes}&rdquo;
                      </p>
                    ) : null}

                    {/* Shareable Link Rails */}
                    <div
                      className="mt"
                      style={{
                        paddingTop: 12,
                        borderTop: "1px solid var(--border)",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        <button
                          className="btn outline sm"
                          type="button"
                          disabled={!isCatalogProperty}
                          onClick={() => copyToClipboard(propUrl, `Catalog Link for ${prop.name}`)}
                          title="Copy clean presentation link for your client"
                        >
                          Copy Client Link
                        </button>
                        <button
                          className="btn outline sm"
                          type="button"
                          disabled={!isCatalogProperty}
                          onClick={() => copyToClipboard(calendarBookingUrl, `Calendar Booking Link for ${prop.name}`)}
                          title="Copy direct booking and calendar link"
                        >
                          Calendar Link
                        </button>
                        <button
                          className="btn sm"
                          type="button"
                          style={{ background: "#25D366", color: "#fff", borderColor: "#25D366" }}
                          disabled={!isCatalogProperty}
                          onClick={() => shareWhatsApp(shareText)}
                          title="Share catalog and calendar directly to WhatsApp"
                        >
                          WhatsApp
                        </button>
                      </div>

                      <button
                        className="btn ghost sm"
                        type="button"
                        style={{ color: "var(--danger)" }}
                        onClick={async () => {
                          try { await removeRealtorProperty(prop.id); showToast(`Removed "${prop.name}" from broker catalog`); }
                          catch (e) { showToast(e instanceof Error ? e.message : "Property was not removed."); }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* ── TAB 2: CLIENT LIST & MANDATES ──────────────────────────────────── */}
      {activeTab === "clients" ? (
        <div className="pad mt">
          <div className="between">
            <div>
              <h2>{t("realtor.rosterTitle")}</h2>
              <p className="muted" style={{ fontSize: 12 }}>
                {t("realtor.rosterBody")}
              </p>
            </div>
            <button
              className="btn sm"
              type="button"
              onClick={() => {
                if (!requireSubscription("onboard clients")) return;
                setAddClientModalOpen(true);
              }}
            >
              {t("realtor.onboardClient")}
            </button>
          </div>

          {clientList.length === 0 ? (
            <div
              className="card mt"
              style={{
                textAlign: "center",
                padding: "36px 20px",
                border: "1px dashed var(--border)",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>No Clients Onboarded Yet</h3>
              <p className="muted" style={{ fontSize: 13, maxWidth: 460, margin: "6px auto 16px" }}>
                Keep track of client budgets, corridor requirements, and parking needs. Generate personal portfolio links and send them directly via WhatsApp.
              </p>
              <button
                className="btn sm accent"
                type="button"
                onClick={() => {
                  if (!requireSubscription("onboard clients")) return;
                  setAddClientModalOpen(true);
                }}
              >
                + Onboard Your First Client
              </button>
            </div>
          ) : (
            <div className="stack mt">
              {clientList.map((client) => (
                <article key={client.id} className="card" style={{ padding: 16 }}>
                  <div className="between">
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800 }}>{client.name}</h3>
                      <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                        {client.phone} {client.email ? `· ${client.email}` : ""}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className="pill info" style={{ fontWeight: 800, fontSize: 11 }}>
                        ₹{client.budgetMinCr} - ₹{client.budgetMaxCr} Cr
                      </span>
                      {client.confidential ? (
                        <div style={{ marginTop: 4 }}>
                          <span className="pill warn" style={{ fontSize: 10 }}>{t("realtor.ndaProtected")}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt" style={{ paddingTop: 10, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 6 }}>
                    <p style={{ fontSize: 12.5, margin: 0 }}>
                      <strong style={{ color: "var(--moss)" }}>{t("realtor.labelCorridor")}</strong> {client.preferredStretch}
                    </p>
                    <p style={{ fontSize: 12.5, margin: 0 }}>
                      <strong style={{ color: "var(--moss)" }}>{t("realtor.labelAutomotiveNeed")}</strong> {client.garageNeed}
                    </p>
                    {client.notes ? (
                      <p className="muted" style={{ fontSize: 12, fontStyle: "italic", margin: "4px 0 0" }}>
                        &ldquo;{client.notes}&rdquo;
                      </p>
                    ) : null}
                  </div>

                  <div className="between mt" style={{ paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                    <span className="tiny">{t("realtor.addedOn", { date: client.createdAt })}</span>
                    <div className="row" style={{ gap: 6 }}>
                      <button
                        className="btn outline sm"
                        type="button"
                        onClick={() => {
                          const message = `Hello ${client.name}, here is our curated estate portfolio for your review:\n${origin}/buy?broker=${encodeURIComponent(agencyName || "Broker")}`;
                          shareWhatsApp(message);
                        }}
                      >
                        Send Catalog
                      </button>
                      <button
                        className="btn ghost sm"
                        type="button"
                        style={{ color: "var(--danger)" }}
                        onClick={async () => {
                          try { await removeClient(client.id); showToast(t("realtor.toastClientRemoved", { name: client.name })); }
                          catch (e) { showToast(e instanceof Error ? e.message : "Client was not removed."); }
                        }}
                      >
                        {t("realtor.removeClient")}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Listing Action for Realtors */}
      <section className="pad mt" style={{ marginBottom: 30 }}>
        <div className="card" style={{ background: "var(--surface-2)" }}>
          <h3>{t("realtor.sellerPrompt")}</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            {t("realtor.sellerBody")}
          </p>
          <div className="row mt">
            <Link href="/host/new?mode=sale" className="btn sm">
              {t("realtor.listForSale")}
            </Link>
            <Link href="/buy" className="btn outline sm">
              {t("realtor.viewAllHoldings")}
            </Link>
          </div>
        </div>
      </section>

      {/* Modal: Edit Broker Profile */}
      <BaseSheet
        open={editProfileModalOpen}
        onOpenChange={setEditProfileModalOpen}
        title="Broker Agency Profile"
      >
        <form className="stack" onSubmit={handleSaveProfile}>
          <p className="muted" style={{ fontSize: 13 }}>
            Configure your registered agency name and RERA license number. Verification is reviewed separately by staff.
          </p>

          <label className="field">
            <span>Agency / Advisory Name</span>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Apex Luxury Advisory"
              value={tempAgencyName}
              onChange={(e) => setTempAgencyName(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>RERA Agent Number</span>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. TN/AGENT/2026/0894"
              value={tempReraNumber}
              onChange={(e) => setTempReraNumber(e.target.value)}
            />
          </label>

          <div className="between mt">
            <button className="btn outline sm" type="button" onClick={() => setEditProfileModalOpen(false)}>
              Cancel
            </button>
            <button className="btn accent sm" type="submit">
              Save Profile
            </button>
          </div>
        </form>
      </BaseSheet>

      {/* Modal: Browse & Import from 9bhk Luxury Collection */}
      <BaseSheet
        open={portfolioModalOpen}
        onOpenChange={setPortfolioModalOpen}
        title="Select from 9bhk Portfolio"
      >
        <div className="stack">
          <p className="muted" style={{ fontSize: 13 }}>
            Add published 9bhk estates to your broker catalog. You can generate branded client links and schedule calendar visits.
          </p>
          <div className="stack" style={{ maxHeight: "60vh", overflowY: "auto", gap: 10 }}>
            {properties.map((p) => {
              const alreadyAdded = propertyList.some((rp) => rp.sourcePropertyId === p.id);
              return (
                <div
                  key={p.id}
                  className="card"
                  style={{
                    padding: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 14 }}>{p.name}</strong>
                    <p className="muted" style={{ fontSize: 12, margin: "2px 0 0" }}>
                      {p.location} · {p.bedrooms} BHK · {inr(p.price)}/night
                      {p.salePrice ? ` · Sale: ${formatInrCrores(p.salePrice)}` : ""}
                    </p>
                  </div>
                  <button
                    className={`btn sm ${alreadyAdded ? "outline" : "accent"}`}
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => handleImportFrom9bhk(p)}
                  >
                    {alreadyAdded ? "Added" : "+ Add"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </BaseSheet>

      {/* Modal: Add Property to Broker Catalog */}
      <BaseSheet
        open={addPropertyModalOpen}
        onOpenChange={setAddPropertyModalOpen}
        title="Add Property to Broker Catalog"
      >
        <form className="stack" onSubmit={handleCreateProperty}>
          <p className="muted" style={{ fontSize: 13 }}>
            Add an estate to your private distributor catalog. Generate clean links to send to clients with interactive calendar booking.
          </p>

          <label className="field">
            <span>Property Name</span>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Bayview Dune Residence"
              value={propName}
              onChange={(e) => setPropName(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Location / Corridor</span>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. ECR Coastal Strip, Kovalam"
              value={propLocation}
              onChange={(e) => setPropLocation(e.target.value)}
              required
            />
          </label>

          <div className="between">
            <label className="field" style={{ flex: 1 }}>
              <span>Bedrooms (BHK)</span>
              <input
                className="ctrl"
                type="number"
                min="1"
                max="20"
                value={propBedrooms}
                onChange={(e) => setPropBedrooms(Number(e.target.value))}
                required
              />
            </label>
            <label className="field" style={{ flex: 1 }}>
              <span>Bathrooms</span>
              <input
                className="ctrl"
                type="number"
                min="1"
                max="20"
                value={propBathrooms}
                onChange={(e) => setPropBathrooms(Number(e.target.value))}
                required
              />
            </label>
          </div>

          {/* Dynamic 3-BHK Platform Rule Callout */}
          <div
            className="card"
            style={{
              background: propBedrooms >= 3
                ? "color-mix(in oklch, var(--ok) 10%, var(--surface))"
                : "color-mix(in oklch, var(--warn) 10%, var(--surface))",
              border: `1px solid ${propBedrooms >= 3 ? "var(--ok)" : "var(--warn)"}`,
              padding: 12,
            }}
          >
            <strong>
              {propBedrooms >= 3 ? "3+ bedrooms: publication requires approval" : "Under 3 bedrooms: private catalog only"}
            </strong>
            <p className="muted" style={{ fontSize: 12, marginTop: 4, margin: 0 }}>
              {propBedrooms >= 3
                ? "This record will be saved privately. Submit a marketplace listing for review before public sharing or bookings."
                : "Properties under 3 BHK cannot be showcased in the public 9bhk marketplace (9bhk strictly enforces a 3-BHK group floor). However, it will be saved in your private broker catalog and public sharing requires an approved marketplace listing."}
            </p>
          </div>

          <div className="between">
            <div
              className="checkline"
              onClick={() => setPropForRent(!propForRent)}
              style={{ cursor: "pointer", flex: 1 }}
            >
              <div className="box" aria-checked={propForRent}>
                {propForRent ? <Icon name="check" style={{ color: "var(--on-primary)" }} /> : null}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Available for Rent</span>
            </div>
            <div
              className="checkline"
              onClick={() => setPropForSale(!propForSale)}
              style={{ cursor: "pointer", flex: 1 }}
            >
              <div className="box" aria-checked={propForSale}>
                {propForSale ? <Icon name="check" style={{ color: "var(--on-primary)" }} /> : null}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Available for Sale</span>
            </div>
          </div>

          {propForRent ? (
            <label className="field">
              <span>Nightly Rate (₹)</span>
              <input
                className="ctrl"
                type="number"
                min="5000"
                step="500"
                value={propNightlyRate}
                onChange={(e) => setPropNightlyRate(Number(e.target.value))}
              />
            </label>
          ) : null}

          {propForSale ? (
            <label className="field">
              <span>Asking Price (₹ Crores)</span>
              <input
                className="ctrl"
                type="number"
                min="1"
                step="0.5"
                value={propSalePriceCr}
                onChange={(e) => setPropSalePriceCr(Number(e.target.value))}
              />
            </label>
          ) : null}

          <div
            className="checkline"
            onClick={() => setPropPool(!propPool)}
            style={{ cursor: "pointer" }}
          >
            <div className="box" aria-checked={propPool}>
              {propPool ? <Icon name="check" style={{ color: "var(--on-primary)" }} /> : null}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Has Private Pool</span>
          </div>

          <label className="field">
            <span>Broker Notes / Specs</span>
            <textarea
              className="ctrl"
              rows={2}
              placeholder="e.g. Direct beach gate, 30 kW sanctioned power load, parking for 6 cars"
              value={propNotes}
              onChange={(e) => setPropNotes(e.target.value)}
            />
          </label>

          <div className="between mt">
            <span className="tiny muted">₹500 Broker Workspace tool</span>
            <button className="btn accent" type="submit">
              Save to Catalog
            </button>
          </div>
        </form>
      </BaseSheet>

      {/* Modal: Onboard Client Form */}
      <BaseSheet
        open={addClientModalOpen}
        onOpenChange={setAddClientModalOpen}
        title={t("realtor.sheetOnboardTitle")}
      >
        <form className="stack" onSubmit={handleCreateClient}>
          <p className="muted" style={{ fontSize: 13 }}>
            {t("realtor.sheetBody")}
          </p>
          <label className="field">
            <span>{t("realtor.fieldClientName")}</span>
            <input
              className="ctrl"
              type="text"
              placeholder={t("realtor.clientNamePlaceholder")}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>{t("realtor.fieldPhone")}</span>
            <input
              className="ctrl"
              type="tel"
              placeholder="+91 98400 00000"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>{t("realtor.fieldEmailOptional")}</span>
            <input
              className="ctrl"
              type="email"
              placeholder="principal@capital.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </label>

          <div className="between">
            <label className="field" style={{ flex: 1 }}>
              <span>{t("realtor.fieldMinBudget")}</span>
              <input
                className="ctrl"
                type="number"
                min="1"
                max="100"
                value={budgetMin}
                onChange={(e) => setBudgetMin(Number(e.target.value))}
              />
            </label>
            <label className="field" style={{ flex: 1 }}>
              <span>{t("realtor.fieldMaxBudget")}</span>
              <input
                className="ctrl"
                type="number"
                min="1"
                max="150"
                value={budgetMax}
                onChange={(e) => setBudgetMax(Number(e.target.value))}
              />
            </label>
          </div>

          <label className="field">
            <span>{t("realtor.fieldCoastalStretch")}</span>
            <select
              className="ctrl"
              value={preferredStretch}
              onChange={(e) => setPreferredStretch(e.target.value)}
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>{t("realtor.fieldGarageNeed")}</span>
            <select
              className="ctrl"
              value={garageNeed}
              onChange={(e) => setGarageNeed(e.target.value)}
            >
              <option value="Standard Covered Parking (2-4 cars)">
                Standard Covered Parking (2-4 cars)
              </option>
              <option value="Subterranean Collector Vault (<7° Supercar Ramp)">
                {t("realtor.optionCollectorVault")}
              </option>
              <option value="Beach & Marine Port (Jet Ski / Boat Trailer Slip)">
                {t("realtor.optionMarinePort")}
              </option>
              <option value="Executive EV Pavilion (High Output 22-50kW Chargers)">
                {t("realtor.optionEvPavilion")}
              </option>
              <option value="Coastal Teak Portico (Shaded Pergola for Cruisers)">
                {t("realtor.optionTeakPortico")}
              </option>
            </select>
          </label>

          <div
            className="checkline"
            onClick={() => setConfidential(!confidential)}
            style={{ cursor: "pointer" }}
          >
            <div className="box" aria-checked={confidential}>
              {confidential ? <Icon name="check" style={{ color: "var(--on-primary)" }} /> : null}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{t("realtor.enforceNda")}</span>
          </div>

          <label className="field">
            <span>{t("realtor.fieldMandateNotes")}</span>
            <textarea
              className="ctrl"
              rows={2}
              placeholder={t("realtor.mandateNotesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <div className="between mt">
            <span className="pill forest">{t("realtor.leadLockActive")}</span>
            <button className="btn accent" type="submit">
              {t("realtor.completeOnboarding")}
            </button>
          </div>
        </form>
      </BaseSheet>
    </Shell>
  );
}
