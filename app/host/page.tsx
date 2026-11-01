"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { PortalShell } from "@/components/portal-shell";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { inr } from "@/lib/format";
import { loadHostBookings, loadHostProperties, type HostProperty } from "@/lib/supabase/properties";
import { KycLockerCard } from "@/components/kyc-locker-card";
import { OwnerOperationsDesk } from "@/components/owner-operations-desk";
import { OwnersLandingPage } from "@/components/owners-landing-page";

export default function HostPage() {
  const { draft, user, updateUser, signOut, showToast } = useStore();
  const t = useT();
  const [upi, setUpi] = useState(user?.upiId ?? "");
  const [properties, setProperties] = useState<HostProperty[]>([]);
  const [upcoming, setUpcoming] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sellerKycVerified, setSellerKycVerified] = useState(false);
  const [activeSection, setActiveSection] = useState<"estates" | "vault" | "kyc">("estates");
  const [viewMode, setViewMode] = useState<"landing" | "workspace">("landing");

  useEffect(() => {
    if (user?.upiId && !upi) {
      setUpi(user.upiId);
    }
  }, [user?.upiId, upi]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    Promise.all([loadHostProperties(), loadHostBookings()])
      .then(([rows, bookings]) => {
        if (!active) return;
        setProperties(rows);
        const today = new Date().toISOString().slice(0, 10);
        setBookingCount(bookings.length);
        setUpcoming(bookings.filter((b) => b.status === "confirmed" && b.check_out >= today).length);
        setError("");
      })
      .catch((reason) => {
        if (active) setError(reason.message || "Could not load your owner workspace.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  async function saveUpi() {
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(upi.trim())) {
      showToast("Enter a valid UPI ID.");
      return;
    }
    setSaving(true);
    try {
      await updateUser({ upiId: upi.trim() });
      showToast(t("host.toastUpiSaved"));
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "Could not save UPI ID.");
    } finally {
      setSaving(false);
    }
  }

  const ownerNavItems = [
    {
      id: "estates",
      label: "My Estates",
      icon: "estate",
      badge: properties.length,
      onClick: () => setActiveSection("estates"),
    },
    {
      id: "publish",
      label: "Publish 3+ BHK",
      icon: "plus",
      href: "/host/new",
    },
    {
      id: "bookings",
      label: "Bookings & Payouts",
      icon: "calendar",
      badge: upcoming,
      href: "/host/bookings",
    },
    {
      id: "vault",
      label: "Vault & Offers",
      icon: "vault",
      onClick: () => setActiveSection("vault"),
    },
    {
      id: "kyc",
      label: "Title KYC",
      icon: "badge-check",
      badge: sellerKycVerified ? "OK" : "Req",
      onClick: () => setActiveSection("kyc"),
    },
    {
      id: "landing",
      label: "Owners Landing",
      icon: "globe",
      onClick: () => setViewMode("landing"),
    },
  ];

  if (!user || viewMode === "landing") {
    return (
      <OwnersLandingPage
        signedInUser={user}
        onEnterWorkspace={() => setViewMode("workspace")}
        onSignOut={async () => {
          try {
            await signOut();
            showToast(t("toast.signedOut"));
          } catch (e) {
            showToast(e instanceof Error ? e.message : "Could not sign out.");
          }
        }}
      />
    );
  }

  return (
    <PortalShell
      portal="owners"
      title={t("host.overviewTitle")}
      subtitle={`Estate Owner Workspace · ${user.name || user.email} · Manage 3+ BHK stays, legal vault & sale offers`}
      navItems={ownerNavItems}
      activeNav={activeSection}
      userEmail={user.email}
      userName={user.name}
      onSignOut={async () => {
        try {
          await signOut();
          showToast(t("toast.signedOut"));
        } catch (e) {
          showToast(e instanceof Error ? e.message : "Could not sign out.");
        }
      }}
      statusBadge={
        sellerKycVerified ? (
          <span className="pill ok">Title &amp; Owner KYC Verified</span>
        ) : (
          <span className="pill warn">Title KYC Required</span>
        )
      }
      headerActions={
        <div className="row wrap" style={{ gap: 8 }}>
          <button
            className="btn sm outline"
            type="button"
            onClick={() => setViewMode("landing")}
          >
            ← Owners Landing Page
          </button>
          <Link className="btn sm" href="/host/new">
            <Icon name="plus" /> {t("host.add")}
          </Link>
          <Link className="btn sm outline" href="/host/bookings">
            <Icon name="calendar" /> {t("host.bookings")}
          </Link>
        </div>
      }
    >
      <div className="stack" style={{ gap: 18 }}>
        {error && <p role="alert">{error}</p>}

        {/* 4-Column Desktop KPI Strip */}
        <div className="portal-kpi-grid">
          <div className="stat">
            <p className="lb">{t("host.yourProperties")}</p>
            <p className="nb">{loading ? "—" : properties.length}</p>
          </div>
          <div className="stat">
            <p className="lb">{t("host.statUpcoming")}</p>
            <p className="nb">{loading ? "—" : upcoming}</p>
          </div>
          <div className="stat">
            <p className="lb">Total Reservations</p>
            <p className="nb">{loading ? "—" : bookingCount}</p>
          </div>
          <div className="stat">
            <p className="lb">Owner Title KYC</p>
            <p className="nb" style={{ fontSize: 18 }}>
              {sellerKycVerified ? "Verified" : "Action Needed"}
            </p>
          </div>
        </div>

        {/* Section Switcher Pills for quick jumping */}
        <div className="seg" role="tablist" aria-label="Owner workspace sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === "estates"}
            className={activeSection === "estates" ? "is-on" : ""}
            onClick={() => setActiveSection("estates")}
          >
            My 3+ BHK Estates &amp; Payouts
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === "vault"}
            className={activeSection === "vault" ? "is-on" : ""}
            onClick={() => setActiveSection("vault")}
          >
            Legal Vault, Mandates &amp; Offers
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === "kyc"}
            className={activeSection === "kyc" ? "is-on" : ""}
            onClick={() => setActiveSection("kyc")}
          >
            Owner Title KYC Locker
          </button>
        </div>

        {activeSection === "estates" && (
          <div className="portal-grid-2col">
            <div className="stack" style={{ gap: 14 }}>
              <div className="between">
                <h2>{t("host.yourProperties")}</h2>
                <Link className="btn sm" href="/host/new">
                  {t("host.add")}
                </Link>
              </div>
              {loading && <p role="status">Loading your listings…</p>}
              {!loading && !error && bookingCount === 0 && (
                <p className="muted" data-empty="bookings">
                  {t("host.noBookingsYet")}
                </p>
              )}
              {properties.map((item) => (
                <article className="card" key={item.id}>
                  {item.image_urls?.[0] && (
                    <img
                      src={item.image_urls[0]}
                      alt={item.name}
                      style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12 }}
                    />
                  )}
                  <div className="between mt">
                    <h3>{item.name}</h3>
                    <span className={`pill ${item.status === "published" ? "ok" : "warn"}`}>{item.status}</span>
                  </div>
                  <p className="muted">
                    {item.location} · {inr(item.price)} / night
                  </p>
                  <div className="row mt">
                    {item.status === "published" && (
                      <Link className="btn outline sm" href={`/property/${item.id}`}>
                        {t("host.view")}
                      </Link>
                    )}
                    {["draft", "rejected"].includes(item.status) && (
                      <Link className="btn outline sm" href={`/host/new?property=${encodeURIComponent(item.id)}`}>
                        {t("host.resume")}
                      </Link>
                    )}
                    <Link className="btn ghost sm" href="/host/bookings">
                      {t("host.bookings")}
                    </Link>
                  </div>
                </article>
              ))}
              {draft && (
                <article className="card">
                  <h3>{draft.name || t("host.untitledFarmhouse")}</h3>
                  <span className="pill warn">{t("host.statusDraft")}</span>
                  <p className="muted">{draft.city}</p>
                  <Link className="btn outline sm mt" href="/host/new">
                    {t("host.resume")}
                  </Link>
                </article>
              )}
              {!loading && !error && properties.length === 0 && !draft && (
                <div className="card">
                  <h3>{t("host.emptyTitle")}</h3>
                  <p className="muted">{t("host.emptyBody")}</p>
                  <Link className="btn mt" href="/host/new">
                    {t("host.listYourFarmhouse")}
                  </Link>
                </div>
              )}
            </div>

            <div className="stack" style={{ gap: 14 }}>
              <div className="card">
                <h2>{t("host.payoutUpi")}</h2>
                <p className="muted">{t("host.payoutUpiBody")}</p>
                <label className="field mt">
                  {t("host.fieldUpiId")}
                  <input
                    className="ctrl"
                    value={upi}
                    placeholder="name@okhdfcbank"
                    onChange={(e) => setUpi(e.target.value)}
                  />
                </label>
                <button className="btn sm mt" disabled={saving} onClick={saveUpi}>
                  {t("host.saveUpi")}
                </button>
              </div>

              <div className="card stack">
                <h2>{t("host.hostingTools")}</h2>
                <div className="menu">
                  <Link className="mi" href="/host/bookings">
                    <Icon name="calendar" />
                    <span className="lb">{t("host.bookings")}</span>
                    <span className="meta">{loading ? "—" : upcoming}</span>
                  </Link>
                  <Link className="mi" href="/host/bookings?tab=calendar">
                    <Icon name="sliders" />
                    <span className="lb">Calendar and seasonal pricing</span>
                  </Link>
                  <Link className="mi" href="/host/bookings?tab=earnings">
                    <Icon name="chart" />
                    <span className="lb">{t("host.earnings")}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "vault" && (
          <OwnerOperationsDesk
            mode="seller"
            isKycVerified={sellerKycVerified}
            properties={properties.map((p) => ({ id: p.id, name: p.name }))}
            onToast={showToast}
          />
        )}

        {activeSection === "kyc" && (
          <KycLockerCard category="seller" onVerifiedChange={setSellerKycVerified} onToast={showToast} />
        )}

        {/* Always keep KYC + Operations accessible below on estates view for one-scroll convenience */}
        {activeSection === "estates" && (
          <div className="portal-grid-2col">
            <KycLockerCard category="seller" onVerifiedChange={setSellerKycVerified} onToast={showToast} />
            <OwnerOperationsDesk
              mode="seller"
              isKycVerified={sellerKycVerified}
              properties={properties.map((p) => ({ id: p.id, name: p.name }))}
              onToast={showToast}
            />
          </div>
        )}
      </div>
    </PortalShell>
  );
}
