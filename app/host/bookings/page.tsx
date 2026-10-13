"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { BaseSheet } from "@/components/base-sheet";
import { formatRange, inr } from "@/lib/format";
import { closureDates } from "@/lib/operations";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { browserSupabase } from "@/lib/supabase/browser";
import { loadHostBookings, loadHostProperties, saveHostRules, type HostProperty } from "@/lib/supabase/properties";
import { listBookingMessages, operationRequest, sendBookingMessage, type BookingMessage } from "@/lib/supabase/community";

type HostBooking = Awaited<ReturnType<typeof loadHostBookings>>[number];
type Payout = { id: string; amount: number; status: string; created_at: string };
type Earnings = { requests: Payout[]; availableAmount: number; lockedAmount: number; grossAmount: number; platformFeeAmount: number; netAmount: number };
const EMPTY_EARNINGS: Earnings = { requests: [], availableAmount: 0, lockedAmount: 0, grossAmount: 0, platformFeeAmount: 0, netAmount: 0 };

function HostBookings() {
  const params = useSearchParams();
  const { user, showToast } = useStore();
  const t = useT();
  const [tab, setTab] = useState(params.get("tab") === "earnings" ? "Earnings" : params.get("tab") === "calendar" ? "Calendar" : "Upcoming");
  const [bookings, setBookings] = useState<HostBooking[]>([]);
  const [properties, setProperties] = useState<HostProperty[]>([]);
  const [earnings, setEarnings] = useState<Earnings>(EMPTY_EARNINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState("");
  const [minimumStay, setMinimumStay] = useState("1");
  const [weekendPrice, setWeekendPrice] = useState("");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [seasonalPrice, setSeasonalPrice] = useState("");
  const [blocks, setBlocks] = useState<string[]>([]);
  const [rates, setRates] = useState<Array<{ id: string; start_date: string; end_date: string; nightly_price: number }>>([]);
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [message, setMessage] = useState("");
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [owned, reservations, payments] = await Promise.all([loadHostProperties(), loadHostBookings(), operationRequest<Earnings>("/api/host/payouts")]);
      setProperties(owned); setBookings(reservations); setEarnings(payments); setError("");
      setPropertyId(current => current || owned[0]?.id || "");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load your host workspace."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload, user?.email]);
  const reloadCalendar = useCallback(async () => {
    const db = browserSupabase();
    if (!db || !propertyId) return;
    const [property, prices] = await Promise.all([
      db.from("bhk_properties").select("blocked_dates,min_stay,weekend_price").eq("id", propertyId).single(),
      db.from("bhk_property_rates").select("id,start_date,end_date,nightly_price").eq("property_id", propertyId).order("start_date"),
    ]);
    if (property.error || prices.error) throw property.error || prices.error;
    setBlocks(property.data.blocked_dates ?? []); setMinimumStay(String(property.data.min_stay || 1));
    setWeekendPrice(property.data.weekend_price == null ? "" : String(property.data.weekend_price));
    setRates(prices.data ?? []);
  }, [propertyId]);
  useEffect(() => { void reloadCalendar().catch(reason => showToast(reason.message || "Could not load calendar.")); }, [reloadCalendar, showToast]);
  useEffect(() => {
    if (!openId) return;
    setMessages([]);
    void listBookingMessages(openId).then(setMessages).catch(reason => showToast(reason.message || "Could not load messages."));
  }, [openId, showToast]);
  async function perform(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try { await action(); }
    catch (reason) { showToast(reason instanceof Error ? reason.message : "Could not save your changes."); }
    finally { setBusy(false); }
  }
  function datesInRange() {
    if (!propertyId) throw new Error("Choose your listing first.");
    return closureDates(from, until);
  }
  async function changeBlocks(blocked: boolean) {
    const dates = datesInRange(), db = browserSupabase();
    if (!db) throw new Error("Online services are not configured.");
    const { error: failure } = await db.rpc("bhk_set_blocked_dates", { target_property: propertyId, dates, blocked });
    if (failure) throw failure;
    await reloadCalendar(); showToast(blocked ? "Dates blocked." : "Dates reopened.");
  }
  async function addRate() {
    datesInRange();
    const price = Number(seasonalPrice);
    if (!Number.isInteger(price) || price <= 0) throw new Error("Enter a positive whole-rupee nightly price.");
    const db = browserSupabase();
    if (!db) throw new Error("Online services are not configured.");
    const { data } = await db.auth.getUser();
    if (!data.user) throw new Error("Sign in to continue.");
    const { error: failure } = await db.from("bhk_property_rates").insert({ property_id: propertyId, host_id: data.user.id, start_date: from, end_date: until, nightly_price: price });
    if (failure) throw failure;
    await reloadCalendar(); showToast("Date-specific price saved.");
  }
  const rows = bookings.filter(row => tab === "Cancelled" ? row.status === "cancelled" : tab === "Past" ? row.status === "completed" : ["awaiting", "confirmed"].includes(row.status));
  const open = bookings.find(row => row.id === openId);
  return <Shell>
    <PageBar title={t("host.bookings")} backHref="/host" />
    <header className="page-head"><p className="eyebrow">{t("host.workspace")}</p><h1>{t("host.manageStays")}</h1></header>
    <div className="pad"><div className="seg" role="tablist">{["Upcoming", "Past", "Cancelled", "Calendar", "Earnings"].map(item => <button key={item} role="tab" aria-selected={tab === item} onClick={() => setTab(item)}>{item}</button>)}</div></div>
    <div className="pad mt stack">
      {loading && <p role="status">Loading your bookings…</p>}{error && <p role="alert">{error}</p>}
      {tab === "Calendar" && <>
        <label className="field">Your listing<select className="ctrl" value={propertyId} onChange={e => setPropertyId(e.target.value)}><option value="">Choose a listing</option>{properties.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
        {propertyId && <><div className="card stack"><h3>Booking rules</h3>
          <label className="field">Minimum nights<input className="ctrl" type="number" min="1" max="90" value={minimumStay} onChange={e => setMinimumStay(e.target.value)} /></label>
          <label className="field">Saturday / Sunday price (₹; blank uses base price)<input className="ctrl" type="number" min="1" value={weekendPrice} onChange={e => setWeekendPrice(e.target.value)} /></label>
          <button className="btn" disabled={busy} onClick={() => perform(async () => { await saveHostRules(propertyId, Number(minimumStay), weekendPrice ? Number(weekendPrice) : null); showToast("Booking rules saved."); })}>Save rules</button>
        </div><div className="card stack"><h3>Dates and seasonal prices</h3>
          <label className="field">First night<input className="ctrl" type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
          <label className="field">Checkout date (not included)<input className="ctrl" type="date" value={until} onChange={e => setUntil(e.target.value)} /></label>
          <div className="row"><button className="btn" disabled={busy} onClick={() => perform(() => changeBlocks(true))}>Block dates</button><button className="btn outline" disabled={busy} onClick={() => perform(() => changeBlocks(false))}>Reopen dates</button></div>
          <p className="muted">Blocked nights: {blocks.length ? blocks.join(", ") : "None"}</p>
          <label className="field">Price per night for this range (₹)<input className="ctrl" type="number" min="1" value={seasonalPrice} onChange={e => setSeasonalPrice(e.target.value)} /></label>
          <button className="btn outline" disabled={busy} onClick={() => perform(addRate)}>Save date-specific price</button>
          {rates.map(rate => <div className="between" key={rate.id}><span>{formatRange(rate.start_date, rate.end_date)} · {inr(rate.nightly_price)} / night</span><button className="btn ghost sm" disabled={busy} onClick={() => perform(async () => { const db = browserSupabase(); if (!db) throw new Error("Services unavailable."); const result = await db.from("bhk_property_rates").delete().eq("id", rate.id).select("id").single(); if (result.error) throw result.error; await reloadCalendar(); })}>Remove</button></div>)}
        </div></>}
      </>}
      {tab === "Earnings" && <><div className="card"><h3>Available for withdrawal</h3><p className="nb">{inr(earnings.availableAmount ?? 0)}</p><p className="muted">Eligible captured stay payments, after fees and existing payout requests. Requests are reviewed before transfer.</p>
        <button className="btn mt" disabled={busy || loading || Boolean(error) || !(earnings.availableAmount > 0)} onClick={() => perform(async () => { await operationRequest("/api/host/payouts", {}); await reload(); showToast("Payout request saved for review."); })}>Request payout</button>
      </div><div className="card"><h3>Payment breakdown</h3>{[["Captured gross", earnings.grossAmount], ["Platform fees", earnings.platformFeeAmount], ["Net earnings", earnings.netAmount], ["Not yet eligible", earnings.lockedAmount]].map(([label, value]) => <div className="sumline" key={String(label)}><span>{label}</span><span>{inr(Number(value) || 0)}</span></div>)}</div>
        <div className="card"><h3>Payout requests</h3>{!earnings.requests?.length && <p className="muted">No payout requests yet.</p>}{earnings.requests?.map(row => <div className="sumline" key={row.id}><span>{new Date(row.created_at).toLocaleDateString()} · {row.status}</span><strong>{inr(row.amount)}</strong></div>)}</div></>}
      {!["Calendar", "Earnings"].includes(tab) && <>{!loading && !rows.length && <p className="muted">No {tab.toLowerCase()} bookings.</p>}{rows.map(row => <article className="card" key={row.id}><div className="between"><span className="pill">{row.status}</span><strong>{inr(row.total)}</strong></div><h3 className="mt">{row.property_name}</h3><p className="muted">{formatRange(row.check_in, row.check_out)} · {row.adults + row.children} guests</p><p>{row.guest_name}</p><button className="btn outline sm mt" onClick={() => setOpenId(row.id)}>View details</button></article>)}</>}
    </div>
    <BaseSheet open={Boolean(open)} onOpenChange={value => { if (!value) setOpenId(null); }} title="Booking details">
      {open && <div className="stack"><h3>{open.property_name}</h3><p>{open.code} · {open.guest_name}</p><p>{formatRange(open.check_in, open.check_out)} · {inr(open.total)}</p><p className="muted">Payment reference: {open.payment_ref || "No captured payment recorded"}</p>
        {open.guest_email && <a href={`mailto:${open.guest_email}`}>{open.guest_email}</a>}{open.guest_phone && <a href={`tel:${open.guest_phone.replace(/[^+\d]/g, "")}`}>{open.guest_phone}</a>}
        <h3>Guest conversation</h3>{messages.map(row => <p className="card" key={row.id}>{row.body}<small className="muted"> · {new Date(row.created_at).toLocaleString()}</small></p>)}
        <label className="field">Message<textarea className="ctrl" value={message} maxLength={4000} onChange={e => setMessage(e.target.value)} /></label><button className="btn" disabled={busy || !message.trim()} onClick={() => perform(async () => { await sendBookingMessage(open.id, message); setMessage(""); setMessages(await listBookingMessages(open.id)); showToast("Message saved."); })}>Send message</button>
        {["awaiting", "confirmed"].includes(open.status) && <button className="btn outline" disabled={busy} onClick={() => perform(async () => { const result = await operationRequest<{ refundStatus: string }>(`/api/bookings/${encodeURIComponent(open.code)}/cancel`, {}); await reload(); setOpenId(null); showToast(result.refundStatus === "requested" ? "Cancelled. Refund request saved for review." : "Booking cancelled."); })}>Cancel reservation</button>}
      </div>}
    </BaseSheet>
  </Shell>;
}
export default function HostBookingsPage() { return <Suspense fallback={<Shell><p>Loading bookings…</p></Shell>}><HostBookings /></Suspense>; }
