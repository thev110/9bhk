"use client";

import { useCallback, useEffect, useState } from "react";
import { PageBar, Shell } from "@/components/shell";
import { BaseSheet } from "@/components/base-sheet";
import { useStore } from "@/lib/store";
import { inr, formatBytes, formatRange } from "@/lib/format";
import { browserSupabase } from "@/lib/supabase/browser";
import { operationRequest } from "@/lib/supabase/community";
import { decideListing, loadReviewQueue, type ReviewListing } from "@/lib/supabase/review";
import { openDocument, downloadDocument, reviewDocument, type PropertyDocument } from "@/lib/supabase/documents";
import { useCatalog } from "@/lib/catalog";
import { useT } from "@/lib/i18n";
import type { DictKey } from "@/lib/i18n/en";

type Row = Record<string, any>;
const TABS = ["Overview", "Properties", "Reviews", "Users", "Bookings", "Verification"] as const;
const TAB_LABELS: Record<typeof TABS[number], DictKey> = { Overview: "admin.tabOverview", Properties: "admin.tabProperties", Reviews: "admin.tabReviews", Users: "admin.tabUsers", Bookings: "admin.tabBookings", Verification: "admin.tabVerification" };
const USAGE_EVENTS = ["property_view", "search", "filter", "wishlist", "inquiry", "booking_start", "booking_complete", "guide_view", "location_page_view"] as const;

export default function AdminPage() {
  const { showToast } = useStore();
  const { reload: reloadCatalog } = useCatalog();
  const t = useT();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [properties, setProperties] = useState<Row[]>([]);
  const [users, setUsers] = useState<Row[]>([]);
  const [bookings, setBookings] = useState<Row[]>([]);
  const [queue, setQueue] = useState<ReviewListing[]>([]);
  const [reviews, setReviews] = useState<Row[]>([]);
  const [tickets, setTickets] = useState<Row[]>([]);
  const [payouts, setPayouts] = useState<Row[]>([]);
  const [refunds, setRefunds] = useState<Row[]>([]);
  const [audit, setAudit] = useState<Row[]>([]);
  const [usage, setUsage] = useState<Array<{ event: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);
  const [priceId, setPriceId] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const reload = useCallback(async () => {
    const db = browserSupabase();
    if (!db) { setError("Online services are not configured."); setLoading(false); return; }
    setLoading(true);
    try {
      const [propertyRows, profileRows, bookingRows, waiting, reviewRows, supportRows, payoutRows, refundRows, auditRows, usageRows] = await Promise.all([
        db.from("bhk_properties").select("id,name,status,host_id,price,bedrooms,location,verification_status,image_urls").order("created_at", { ascending: false }),
        db.from("bhk_profiles").select("id,full_name,email,phone,created_at,role,verified_broker").order("created_at", { ascending: false }),
        db.from("bhk_bookings").select("*").order("created_at", { ascending: false }),
        loadReviewQueue(),
        db.from("bhk_stay_reviews").select("id,booking_id,property_id,rating,body,verified_stay,published,created_at").order("created_at", { ascending: false }),
        db.from("bhk_support_tickets").select("id,booking_id,subject,body,status,created_at").order("created_at", { ascending: false }),
        db.from("bhk_payout_requests").select("id,host_id,amount,status,created_at").order("created_at", { ascending: false }),
        db.from("bhk_refund_requests").select("id,booking_id,amount,status,created_at").order("created_at", { ascending: false }),
        db.from("bhk_admin_audit").select("id,actor_id,entity_type,entity_id,action,created_at").order("created_at", { ascending: false }).limit(100),
        Promise.all(USAGE_EVENTS.map(async event => {
          const result = await db.from("bhk_usage_events").select("id", { count: "exact", head: true }).eq("event", event)
            .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());
          if (result.error) throw result.error;
          return { event, count: result.count || 0 };
        })),
      ]);
      for (const result of [propertyRows, profileRows, bookingRows, reviewRows, supportRows, payoutRows, refundRows, auditRows]) if (result.error) throw result.error;
      setProperties(propertyRows.data ?? []); setUsers(profileRows.data ?? []); setBookings(bookingRows.data ?? []); setQueue(waiting); setReviews(reviewRows.data ?? []);
      setTickets(supportRows.data ?? []); setPayouts(payoutRows.data ?? []); setRefunds(refundRows.data ?? []); setAudit(auditRows.data ?? []); setError("");
      setUsage(usageRows);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load operations data."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  async function perform(action: () => Promise<void>, message: string) {
    if (busy) return; setBusy(true);
    try { await action(); await reload(); reloadCatalog(); showToast(message); }
    catch (reason) { showToast(reason instanceof Error ? reason.message : "Could not save changes."); }
    finally { setBusy(false); }
  }
  async function updateRow(table: string, id: string, values: Row) {
    const db = browserSupabase(); if (!db) throw new Error("Services unavailable.");
    const result = await db.from(table).update(values).eq("id", id).select("id").single();
    if (result.error) throw result.error;
  }
  async function decide(item: ReviewListing, decision: "approve" | "changes" | "reject") {
    if (decision === "approve" && !["ownership_proof", "tax_receipt", "host_id"].every(kind => item.documents.some(doc => doc.kind === kind && doc.status === "verified"))) {
      throw new Error("Verify all three required documents before approving.");
    }
    if (decision !== "approve" && !notes[item.id]?.trim()) throw new Error("Add a reason for changes or rejection.");
    if (!await decideListing({ id: item.id, decision, note: notes[item.id] })) throw new Error("Could not save the listing decision.");
  }
  async function documentVerdict(doc: PropertyDocument, status: "verified" | "rejected") {
    if (status === "rejected" && !notes[doc.id]?.trim()) throw new Error("Add a reason for rejecting this document.");
    if (!await reviewDocument({ id: doc.id, status, note: notes[doc.id] })) throw new Error("Could not save document review.");
  }
  function exportBookings() {
    const cell = (value: unknown) => `"${String(value ?? "").replace(/^[=+@-]/, "'$&").replace(/"/g, '""')}"`;
    const rows = [["Code", "Property", "Guest", "Check-in", "Check-out", "Total", "Status", "Payment", "Refund"], ...bookings.map(b => [b.code, b.property_name, b.guest_name, b.check_in, b.check_out, b.total, b.status, b.payment_status, b.refund_status])];
    const url = URL.createObjectURL(new Blob([rows.map(row => row.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "9bhk-bookings.csv"; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }
  return <Shell><PageBar title={t("admin.pageBarTitle")} backHref="/profile" right={<span className="pill">{t("admin.staff")}</span>} />
    <header className="page-head"><p className="eyebrow">{t("admin.restrictedWorkspace")}</p><h1>{t("admin.operationsConsole")}</h1></header>
    <div className="pad"><div className="seg" role="tablist">{TABS.map(name => <button key={name} role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>{t(TAB_LABELS[name])}</button>)}</div></div>
    <div className="pad mt stack"><button className="btn outline sm" disabled={loading || busy} onClick={reload}>Refresh database records</button>{loading && <p role="status">Loading operations records…</p>}{error && <p role="alert">{error}</p>}
      {tab === "Overview" && <><div className="stats">{[["Properties", properties.length], ["Users", users.length], ["Bookings", bookings.length], ["Pending listings", queue.length]].map(([label, count]) => <div className="stat" key={label}><p className="lb">{label}</p><p className="nb">{loading || error ? "—" : count}</p></div>)}</div>
        <div className="card"><h3>Usage in the last seven days</h3>{usage.map(row => <div className="sumline" key={row.event}><span>{row.event.replace(/_/g, " ")}</span><strong>{row.count}</strong></div>)}</div>
        <div className="card"><h3>Payout and refund requests</h3><p className="muted">Requests are persisted for financial review. A request does not mean that a transfer or refund has been completed.</p>
          {payouts.map(row => <p key={row.id}>Payout · {row.host_id} · {inr(row.amount)} · {row.status}</p>)}{refunds.map(row => <p key={row.id}>Refund · {row.booking_id} · {inr(row.amount)} · {row.status}</p>)}{!payouts.length && !refunds.length && <p>No financial requests.</p>}
        </div><div className="card"><h3>Support requests</h3>{!tickets.length && <p className="muted">No requests.</p>}{tickets.map(row => <article className="mt" key={row.id}><strong>{row.subject}</strong><p>{row.body}</p><p className="tiny muted">Booking {row.booking_id}</p><label className="field">Status<select className="ctrl" value={row.status} disabled={busy} onChange={e => perform(() => updateRow("bhk_support_tickets", row.id, { status: e.target.value }), "Support status saved.")}>{["open", "in_progress", "resolved"].map(status => <option key={status}>{status}</option>)}</select></label></article>)}</div>
        <div className="card"><h3>Audit log</h3>{!audit.length && <p className="muted">No recorded staff changes.</p>}{audit.map(row => <p className="tiny" key={row.id}>{new Date(row.created_at).toLocaleString()} · {row.action} · {row.entity_type} · {row.entity_id} · {row.actor_id || "Server"}</p>)}</div>
      </>}
      {tab === "Properties" && <>{properties.map(row => <article className="card" key={row.id}><h3>{row.name}</h3><p>{row.location} · {row.bedrooms} bedrooms · {row.status}</p><p className="muted">Host: {row.host_id || "Unassigned"}</p><strong>{inr(row.price)} / night</strong><div className="row mt"><button className="btn outline sm" disabled={busy || row.status !== "published"} onClick={() => perform(() => updateRow("bhk_properties", row.id, { status: "draft" }), "Listing unpublished.")}>Unpublish</button><button className="btn ghost sm" onClick={() => { setPriceId(row.id); setPrice(String(row.price)); }}>Edit price</button></div>{priceId === row.id && <div className="row mt"><input className="ctrl" aria-label="Nightly price" type="number" min="1" value={price} onChange={e => setPrice(e.target.value)} /><button className="btn" disabled={busy} onClick={() => perform(async () => { const amount = Number(price); if (!Number.isInteger(amount) || amount <= 0) throw new Error("Enter a positive whole-rupee nightly price."); await updateRow("bhk_properties", row.id, { price: amount }); setPriceId(null); }, "Price saved.")}>Save</button></div>}</article>)}</>}
      {(tab === "Reviews" || tab === "Verification") && <><h2>Listing submissions</h2>{!loading && !queue.length && <p className="muted">No pending submissions.</p>}{queue.map(item => <article className="card stack" key={item.id}><h3>{item.name}</h3><p>{item.meta} · {item.price}</p><p className="muted">{item.host}</p><div className="gal">{item.images.map((image, i) => <img key={`${image}-${i}`} src={image} alt={`${item.name} photo ${i + 1}`} loading="lazy" />)}</div>
        {item.documents.map(doc => <div className="card stack" key={doc.id}><strong>{doc.kind.replace(/_/g, " ")}</strong><p>{doc.fileName} · {formatBytes(doc.sizeBytes)} · {doc.status}</p><div className="row"><button className="btn outline sm" onClick={() => perform(async () => { if (!await openDocument(doc.path)) throw new Error("Could not open document."); }, "Document link opened.")}>Open</button><button className="btn ghost sm" onClick={() => perform(async () => { if (!await downloadDocument(doc)) throw new Error("Could not download document."); }, "Document downloaded.")}>Download</button></div><label className="field">Reviewer note<input className="ctrl" value={notes[doc.id] || ""} onChange={e => setNotes(curr => ({ ...curr, [doc.id]: e.target.value }))} /></label><div className="row"><button className="btn sm" disabled={busy} onClick={() => perform(() => documentVerdict(doc, "verified"), "Document verified.")}>Verify</button><button className="btn outline sm" disabled={busy} onClick={() => perform(() => documentVerdict(doc, "rejected"), "Document rejected.")}>Reject</button></div></div>)}
        <label className="field">Listing decision note<textarea className="ctrl" value={notes[item.id] || ""} onChange={e => setNotes(curr => ({ ...curr, [item.id]: e.target.value }))} /></label><div className="row wrap">{["approve", "changes", "reject"].map(action => <button key={action} className="btn outline sm" disabled={busy} onClick={() => perform(() => decide(item, action as "approve" | "changes" | "reject"), "Listing decision saved.")}>{action === "approve" ? "Approve and publish" : action === "changes" ? "Request changes" : "Reject"}</button>)}</div>
      </article>)}
        {tab === "Reviews" && <><h2>Completed-stay reviews</h2>{!reviews.length && <p className="muted">No stay reviews.</p>}{reviews.map(row => <article className="card" key={row.id}><strong>{row.rating} stars · {row.property_id}</strong><p>{row.body}</p><p className="muted">Booking {row.booking_id} · {row.published && row.verified_stay ? "Published verified stay" : "Awaiting verification"}</p><div className="row"><button className="btn" disabled={busy} onClick={() => perform(() => updateRow("bhk_stay_reviews", row.id, { verified_stay: true, published: true }), "Review verified and published.")}>Verify and publish</button><button className="btn outline" disabled={busy} onClick={() => perform(() => updateRow("bhk_stay_reviews", row.id, { published: false }), "Review unpublished.")}>Unpublish</button></div></article>)}</>}
      </>}
      {tab === "Users" && <><p className="muted">Account suspension is managed in the identity provider; no local suspension controls are shown.</p>{users.map(row => <article className="card" key={row.id}><h3>{row.full_name || "Account"}</h3><p>{row.email}</p><p className="muted">{row.role || "guest"} · Joined {new Date(row.created_at).toLocaleDateString()}</p><p>{row.phone || "No phone recorded"}</p></article>)}</>}
      {tab === "Bookings" && <><button className="btn outline" disabled={loading || Boolean(error)} onClick={exportBookings}>Export bookings CSV</button>{bookings.map(row => <article className="card" key={row.id}><div className="between"><span className="pill">{row.status}</span><strong>{inr(row.total)}</strong></div><h3>{row.property_name}</h3><p>{row.code} · {row.guest_name}</p><p className="muted">{formatRange(row.check_in, row.check_out)} · Payment {row.payment_status} · Refund {row.refund_status}</p><div className="row"><button className="btn outline" onClick={() => setSelected(row)}>Details</button><button className="btn outline" disabled={busy || row.payment_status !== "paid" || row.refund_status !== "none"} onClick={() => perform(async () => { await operationRequest("/api/admin/refunds", { bookingCode: row.code }); }, "Refund request saved for financial review.")}>Request refund review</button></div></article>)}</>}
    </div>
    <BaseSheet open={Boolean(selected)} onOpenChange={value => { if (!value) setSelected(null); }} title="Booking record">{selected && <div className="stack"><h3>{selected.property_name}</h3><p>{selected.code} · {selected.guest_name}</p><p>{selected.guest_email} · {selected.guest_phone}</p><p>{formatRange(selected.check_in, selected.check_out)}</p><p>Payment reference: {selected.payment_ref || "None"}</p><p>Total: {inr(selected.total)}</p><p>Payment: {selected.payment_status} · Refund: {selected.refund_status}</p></div>}</BaseSheet>
  </Shell>;
}
