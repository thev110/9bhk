"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { BaseSheet } from "@/components/base-sheet";
import { formatRange, inr } from "@/lib/format";
import { paymentReceipt, type ReceiptPayment } from "@/lib/operations";
import { useCatalog } from "@/lib/catalog";
import { useStore, type Booking } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-t";
import { createSupportTicket, listBookingMessages, operationRequest, sendBookingMessage, submitStayReview, type BookingMessage } from "@/lib/supabase/community";

export default function TripsPage() {
  const { bookings, user, reloadAccount, showToast } = useStore();
  const { properties } = useCatalog();
  const t = useT();
  const { tag } = useLocale();
  const [tab, setTab] = useState("Upcoming");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  // Account hydration queries guest_id under RLS. Email/phone matching cannot
  // establish ownership and hides trips after a guest changes their profile.
  const list = useMemo(() => bookings.filter(b => tab === "Cancelled" ? b.status === "cancelled" : tab === "Past" ? b.status === "completed" : ["confirmed", "awaiting"].includes(b.status)), [bookings, tab]);
  const selected = bookings.find(b => b.id === selectedId);
  if (!user) return <Shell nav="trips"><header className="page-head"><h1>{t("trips.title")}</h1></header><div className="empty"><h3>{t("trips.signInPrompt")}</h3><Link className="btn" href="/login?next=/trips">{t("auth.signIn")}</Link></div></Shell>;
  return <Shell nav="trips">
    <header className="page-head"><h1>{t("trips.title")}</h1></header>
    <div className="pad mt"><div className="seg" role="tablist">{["Upcoming", "Past", "Cancelled"].map(id => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{t(id === "Upcoming" ? "trips.tabUpcoming" : id === "Past" ? "trips.tabPast" : "trips.tabCancelled")}</button>)}</div>
      <button className="btn ghost sm mt" onClick={() => { void reloadAccount().catch(reason => showToast(reason.message || "Could not refresh trips.")); }}>Refresh trips</button></div>
    {!list.length ? <div className="empty"><h3>{t(tab === "Upcoming" ? "trips.emptyUpcoming" : tab === "Cancelled" ? "trips.emptyCancelled" : "trips.emptyPast")}</h3><p className="muted">{t("trips.emptyBody")}</p><Link className="btn mt" href="/">{t("saved.explore")}</Link></div> : <div className="stack pad mt">{list.map(booking => {
      const property = properties.find(p => p.id === booking.propertyId);
      return <article className="card" key={booking.id}><div className="between"><span className="pill">{t(booking.status === "confirmed" ? "booking.statusConfirmed" : booking.status === "awaiting" ? "booking.statusAwaiting" : booking.status === "completed" ? "booking.statusCompleted" : "booking.statusCancelled")}</span><strong>{inr(booking.total)}</strong></div>
        <h3 className="p-title mt">{booking.propertyName || property?.name || booking.propertyId}</h3>{property && <p className="p-loc">{property.location}</p>}<p className="muted">{formatRange(booking.checkIn, booking.checkOut, tag)} · {booking.adults + booking.children} guests</p>
        <button className="btn outline sm mt" onClick={() => setSelectedId(booking.id)}>{t("trips.viewTrip")}</button>
        {booking.status === "completed" && <div className="row mt"><button className="btn ghost sm" onClick={() => setReviewBooking(booking)}>{t("trips.writeReview")}</button>{property && <Link className="btn sm" href={`/property/${property.id}`}>{t("trips.bookAgain")}</Link>}</div>}
      </article>;
    })}</div>}
    {selected && <TripSheet booking={selected} onClose={() => setSelectedId(null)} />}
    <ReviewSheet booking={reviewBooking} onClose={() => setReviewBooking(null)} />
  </Shell>;
}

function ReviewSheet({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  const { showToast } = useStore();
  const [rating, setRating] = useState("5");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  return <BaseSheet open={Boolean(booking)} onOpenChange={value => { if (!value) onClose(); }} title="Review your stay"><div className="stack">
    <label className="field">Rating<select className="ctrl" value={rating} onChange={e => setRating(e.target.value)}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} stars</option>)}</select></label>
    <label className="field">Your experience<textarea className="ctrl" minLength={10} maxLength={4000} value={body} onChange={e => setBody(e.target.value)} /></label>
    <button className="btn" disabled={busy || body.trim().length < 10} onClick={async () => { if (!booking || busy) return; setBusy(true); try { await submitStayReview(booking.id, booking.propertyId, Number(rating), body); showToast("Review submitted for staff approval."); setBody(""); onClose(); } catch (reason) { showToast(reason instanceof Error ? reason.message : "Could not submit review."); } finally { setBusy(false); } }}>Submit review</button>
  </div></BaseSheet>;
}

function TripSheet({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const { cancelBooking, reloadAccount, showToast } = useStore();
  const t = useT();
  const { tag } = useLocale();
  const [mode, setMode] = useState<"details" | "message" | "support">("details");
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [arrival, setArrival] = useState<{ address: string; checkInTime: string; checkOutTime: string; houseRules: string[] } | null>(null);
  async function perform(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try { await action(); } catch (reason) { showToast(reason instanceof Error ? reason.message : "Could not save your request."); }
    finally { setBusy(false); }
  }
  const captured = ["paid", "partial"].includes(booking.paymentStatus || "");
  const deadline = booking.cancellationDeadline;
  return <BaseSheet open onOpenChange={value => { if (!value) onClose(); }} title={t("trips.sheetTitle")}>
    <div className="stack"><p className="muted">{t("trips.bookingRef", { code: booking.code })}</p><h3>{booking.propertyName || booking.propertyId}</h3>
      <div className="card"><div className="sumline"><span>{t("trips.checkIn")}</span><span>{formatRange(booking.checkIn, booking.checkIn, tag)}</span></div><div className="sumline"><span>{t("trips.checkOut")}</span><span>{formatRange(booking.checkOut, booking.checkOut, tag)}</span></div><div className="sumline"><span>{t("home.guests")}</span><span>{booking.adults + booking.children}</span></div><div className="sumline total"><span>Reservation total</span><strong>{inr(booking.total)}</strong></div><p className="muted">Payment: {booking.paymentStatus || "Not recorded"} · Refund: {booking.refundStatus || "None recorded"}</p></div>
      {deadline ? <p className="muted">Cancellation request deadline: {new Date(deadline).toLocaleString(tag)}.</p> : <p className="muted">Submit cancellation requests before check-in. Contact support for your reservation’s cancellation terms.</p>}
      <p className="muted">Refund eligibility and amounts require review. A saved refund request does not mean a refund has been paid.</p>
      {booking.split?.length ? <div className="card"><h3>Group funding</h3>{booking.split.map(share => <div className="sumline" key={share.id}><span>{share.name} · {share.paid ? "Paid" : "Awaiting payment"}</span><strong>{inr(share.amount)}</strong></div>)}</div> : null}
      {["confirmed", "completed"].includes(booking.status) && booking.paymentStatus === "paid" && <button className="btn outline" disabled={busy} onClick={() => perform(async () => { setArrival(await operationRequest(`/api/bookings/${encodeURIComponent(booking.code)}/arrival`)); })}>Show arrival details</button>}
      {arrival && <div className="card"><h3>Arrival details</h3><p>{arrival.address || "The host has not provided an address. Contact your host."}</p><p>Check-in: {arrival.checkInTime} · Check-out: {arrival.checkOutTime}</p>{Array.isArray(arrival.houseRules) && arrival.houseRules.map((rule, i) => <p key={i}>{rule}</p>)}</div>}
      {captured && <button className="btn outline" onClick={() => perform(async () => {
        const canonical = await operationRequest<{ booking: Record<string, any>; payments: ReceiptPayment[] }>(`/api/bookings/${encodeURIComponent(booking.code)}/receipt`);
        const row = canonical.booking;
        const receipt = paymentReceipt({ ...booking, code: row.code, propertyName: row.property_name, guestName: row.guest_name,
          checkIn: row.check_in, checkOut: row.check_out, total: Number(row.total), quote: row.quote,
          paymentStatus: row.payment_status, refundStatus: row.refund_status, paymentRef: canonical.payments[0]?.payment_id }, canonical.payments);
        const url = URL.createObjectURL(new Blob([receipt], { type: "text/plain;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `9bhk-receipt-${booking.code}.txt`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      })}>Download payment receipt</button>}
      {booking.status === "awaiting" && booking.holdExpiresAt && Date.parse(booking.holdExpiresAt) > Date.now() && <Link className="btn" href={`/book/${encodeURIComponent(booking.propertyId)}?bookingCode=${encodeURIComponent(booking.code)}`}>Continue payment</Link>}
      {["confirmed", "awaiting"].includes(booking.status) && <>{confirmCancel ? <div className="card stack"><p>Cancel this reservation? Refunds remain subject to review and gateway processing.</p><button className="btn" disabled={busy} onClick={() => perform(async () => { await cancelBooking(booking.id); await reloadAccount(); showToast("Cancellation saved. Check your trip for the refund status."); onClose(); })}>Confirm cancellation</button><button className="btn ghost" disabled={busy} onClick={() => setConfirmCancel(false)}>Keep reservation</button></div> : <button className="btn outline" onClick={() => setConfirmCancel(true)}>Cancel reservation</button>}</>}
      <div className="row"><button className="btn outline grow" disabled={busy} onClick={() => perform(async () => { setMessages(await listBookingMessages(booking.id)); setMode("message"); })}>{t("trips.contactHost")}</button><button className="btn ghost grow" onClick={() => setMode("support")}>{t("trips.getHelp")}</button></div>
      {mode === "message" && <><h3>Host conversation</h3>{!messages.length && <p className="muted">No messages yet.</p>}{messages.map(row => <p className="card" key={row.id}>{row.body}<small className="muted"> · {new Date(row.created_at).toLocaleString(tag)}</small></p>)}<label className="field">Message<textarea className="ctrl" maxLength={4000} value={message} onChange={e => setMessage(e.target.value)} /></label><button className="btn" disabled={busy || !message.trim()} onClick={() => perform(async () => { await sendBookingMessage(booking.id, message); setMessage(""); setMessages(await listBookingMessages(booking.id)); showToast("Message saved."); })}>Send message</button></>}
      {mode === "support" && <><h3>Request support</h3><label className="field">Subject<input className="ctrl" maxLength={200} value={subject} onChange={e => setSubject(e.target.value)} /></label><label className="field">Describe the issue<textarea className="ctrl" maxLength={4000} value={message} onChange={e => setMessage(e.target.value)} /></label><button className="btn" disabled={busy || !subject.trim() || !message.trim()} onClick={() => perform(async () => { const id = await createSupportTicket(booking.id, subject, message); showToast(`Support request saved: ${id.slice(0, 8)}.`); setMessage(""); setSubject(""); setMode("details"); })}>Submit support request</button></>}
    </div>
  </BaseSheet>;
}
