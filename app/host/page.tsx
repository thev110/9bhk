"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageBar, Shell } from "@/components/shell";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { inr } from "@/lib/format";
import { loadHostBookings, loadHostProperties, type HostProperty } from "@/lib/supabase/properties";

export default function HostPage() {
  const { draft, user, updateUser, showToast } = useStore();
  const t = useT();
  const [upi, setUpi] = useState(user?.upiId ?? "");
  const [properties, setProperties] = useState<HostProperty[]>([]);
  const [upcoming, setUpcoming] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([loadHostProperties(), loadHostBookings()]).then(([rows, bookings]) => {
      if (!active) return;
      setProperties(rows);
      const today = new Date().toISOString().slice(0, 10);
      setBookingCount(bookings.length);
      setUpcoming(bookings.filter(b => b.status === "confirmed" && b.check_out >= today).length);
      setError("");
    }).catch(reason => { if (active) setError(reason.message || "Could not load your host workspace."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.email]);
  async function saveUpi() {
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(upi.trim())) { showToast("Enter a valid UPI ID."); return; }
    setSaving(true);
    try { await updateUser({ upiId: upi.trim() }); showToast(t("host.toastUpiSaved")); }
    catch (reason) { showToast(reason instanceof Error ? reason.message : "Could not save UPI ID."); }
    finally { setSaving(false); }
  }
  return <Shell>
    <PageBar title={t("host.hosting")} backHref="/profile" right={<Link className="btn sm" href="/">{t("host.switchToGuest")}</Link>} />
    <header className="page-head"><p className="eyebrow">{t("host.workspace")}</p><h1>{t("host.overviewTitle")}</h1></header>
    <div className="pad mt stack">
      {error && <p role="alert">{error}</p>}
      <div className="card"><h3>{t("host.payoutUpi")}</h3><p className="muted">{t("host.payoutUpiBody")}</p>
        <label className="field mt">{t("host.fieldUpiId")}<input className="ctrl" value={upi} placeholder="name@okhdfcbank" onChange={e => setUpi(e.target.value)} /></label>
        <button className="btn sm mt" disabled={saving} onClick={saveUpi}>{t("host.saveUpi")}</button>
      </div>
      <div className="stats"><div className="stat"><p className="lb">{t("host.statUpcoming")}</p><p className="nb">{loading ? "—" : upcoming}</p></div>
        <div className="stat"><p className="lb">{t("host.yourProperties")}</p><p className="nb">{loading ? "—" : properties.length}</p></div></div>
      {!loading && !error && bookingCount === 0 && <p className="muted" data-empty="bookings">{t("host.noBookingsYet")}</p>}
      <div className="between"><h2>{t("host.yourProperties")}</h2><Link className="btn sm" href="/host/new">{t("host.add")}</Link></div>
      {loading && <p role="status">Loading your listings…</p>}
      {properties.map(item => <article className="card" key={item.id}>
        {item.image_urls?.[0] && <img src={item.image_urls[0]} alt={item.name} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 12 }} />}
        <div className="between mt"><h3>{item.name}</h3><span className={`pill ${item.status === "published" ? "ok" : "warn"}`}>{item.status}</span></div>
        <p className="muted">{item.location} · {inr(item.price)} / night</p><div className="row mt">
          {item.status === "published" && <Link className="btn outline sm" href={`/property/${item.id}`}>{t("host.view")}</Link>}
          {["draft", "rejected"].includes(item.status) && <Link className="btn outline sm" href={`/host/new?property=${encodeURIComponent(item.id)}`}>{t("host.resume")}</Link>}
          <Link className="btn ghost sm" href="/host/bookings">{t("host.bookings")}</Link>
        </div>
      </article>)}
      {draft && <article className="card"><h3>{draft.name || t("host.untitledFarmhouse")}</h3><span className="pill warn">{t("host.statusDraft")}</span>
        <p className="muted">{draft.city}</p><Link className="btn outline sm mt" href="/host/new">{t("host.resume")}</Link></article>}
      {!loading && !error && properties.length === 0 && !draft && <div className="card"><h3>{t("host.emptyTitle")}</h3><p className="muted">{t("host.emptyBody")}</p><Link className="btn mt" href="/host/new">{t("host.listYourFarmhouse")}</Link></div>}
      <h2>{t("host.hostingTools")}</h2><div className="menu"><Link className="mi" href="/host/bookings"><span className="lb">{t("host.bookings")}</span><span className="meta">{loading ? "—" : upcoming}</span></Link>
        <Link className="mi" href="/host/bookings?tab=calendar">Calendar and pricing</Link><Link className="mi" href="/host/bookings?tab=earnings">{t("host.earnings")}</Link></div>
    </div>
  </Shell>;
}
