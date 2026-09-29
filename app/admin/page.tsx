"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageBar, Shell } from "@/components/shell";
import { Icon } from "@/components/icon";
import { inr } from "@/lib/format";
import { useStore, type Booking } from "@/lib/store";
import { useCatalog } from "@/lib/catalog";
import { useT } from "@/lib/i18n";
import type { DictKey } from "@/lib/i18n/en";
import { browserSupabase, hasSupabase } from "@/lib/supabase/browser";
import { formatBytes } from "@/lib/format";
import {
  downloadDocument,
  openDocument,
  reviewDocument,
  type DocumentKind,
  type DocumentStatus,
  type PropertyDocument,
} from "@/lib/supabase/documents";
import { decideListing, loadReviewQueue, waitingDays, type ReviewListing } from "@/lib/supabase/review";

const TABS = ["Overview", "Properties", "Reviews", "Users", "Bookings", "Verification"] as const;

/** Tab id -> catalog key. The ids stay literal because state compares them. */
const TAB_KEY: Record<(typeof TABS)[number], DictKey> = {
  Overview: "admin.tabOverview",
  Properties: "admin.tabProperties",
  Reviews: "admin.tabReviews",
  Users: "admin.tabUsers",
  Bookings: "admin.tabBookings",
  Verification: "admin.tabVerification",
};

const PROP_FILTER_KEY: Record<"all" | "published" | "draft", DictKey> = {
  all: "admin.filterAll",
  published: "admin.filterPublished",
  draft: "admin.filterDraft",
};

/**
 * A submission in the review queue.
 *
 * This used to be a hardcoded batch, which is why "Submitted documents" could
 * only ever be decoration. A card now exists because a host really submitted a
 * listing, and its documents are the files that host really uploaded.
 */
type QueueRow = ReviewListing;

/** Document slot -> catalog key. Shared with the host wizard, so a document
 *  carries one name from upload through approval. */
const DOC_KIND_KEY: Record<DocumentKind, DictKey> = {
  ownership_proof: "admin.docOwnershipProof",
  tax_receipt: "admin.docTaxReceipt",
  host_id: "admin.docHostId",
};

/** Document review state -> pill class. */
const DOC_PILL: Record<DocumentStatus, string> = {
  pending: "warn",
  verified: "ok",
  rejected: "danger",
};

/**
 * Verification-checklist label -> catalog key, keyed by the literal English
 * label. Only the Verification tab still uses this: the review queue is keyed
 * by document kind instead.
 */
const DOC_KEY: Record<string, DictKey> = {
  "Ownership proof": "admin.docOwnershipProof",
  "Property tax receipt": "admin.docTaxReceipt",
  "Host ID": "admin.docHostId",
  "Government ID": "admin.docGovernmentId",
  "Phone + email": "admin.docPhoneEmail",
  "Payout account": "admin.docPayoutAccount",
};

/** Document review state -> catalog key. */
const DOC_STATE_KEY: Record<DocumentStatus, DictKey> = {
  pending: "admin.statePending",
  verified: "admin.stateVerified",
  rejected: "admin.stateRejected",
};

/** Document / verification state -> catalog key. */
const STATE_KEY: Record<string, DictKey> = {
  Verified: "admin.stateVerified",
  Pending: "admin.statePending",
  Missing: "admin.stateMissing",
  "Docs in review": "admin.stateDocsInReview",
  "Missing documents": "admin.stateMissingDocs",
};

type AdminUser = {
  initials: string;
  name: string;
  role: "Guest" | "Host" | "Host · verified" | "Host · pending" | "Flagged";
  email: string;
  phone: string;
  meta: string;
  trips?: number;
  listings?: number;
  stays?: number;
  flags?: string;
  status: "active" | "suspended";
};

/** Account role pill label -> catalog key. */
const USER_ROLE_KEY: Record<AdminUser["role"], DictKey> = {
  Guest: "admin.roleGuest",
  Host: "admin.roleHost",
  "Host · verified": "admin.roleHostVerified",
  "Host · pending": "admin.roleHostPending",
  Flagged: "admin.roleFlagged",
};

const INITIAL_USERS: AdminUser[] = [
  {
    initials: "AR",
    name: "Ananya R",
    role: "Guest",
    email: "ananya.r@example.com",
    phone: "98401 22910",
    meta: "ananya.r@example.com · joined 2025",
    trips: 3,
    flags: "No flags recorded",
    status: "active",
  },
  {
    initials: "AK",
    name: "Arjun K",
    role: "Host · verified",
    email: "arjun.k@example.com",
    phone: "98841 88200",
    meta: "arjun.k@example.com · host since 2024",
    listings: 2,
    stays: 48,
    status: "active",
  },
  {
    initials: "DP",
    name: "Dev P",
    role: "Host · pending",
    email: "dev.p@example.com",
    phone: "98410 44211",
    meta: "dev.p@example.com · applied 3 days ago",
    listings: 1,
    flags: "Payout account verification pending",
    status: "active",
  },
  {
    initials: "RV",
    name: "Rahul V",
    role: "Flagged",
    email: "rahul.v@example.com",
    phone: "97900 11922",
    meta: "rahul.v@example.com · joined 2024",
    trips: 2,
    flags: "2 chargebacks · under review",
    status: "suspended",
  },
];

export default function AdminPage() {
  const { showToast, bookings: storeBookings, addBooking } = useStore();
  const { properties: catalogProps, reload: reloadCatalog } = useCatalog();
  const t = useT();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  // Reviewer notes, keyed by document id, so a refusal can say why.
  const [docNotes, setDocNotes] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<AdminUser[]>(INITIAL_USERS);
  const [verifySeg, setVerifySeg] = useState<"host" | "property">("host");
  const [activity, setActivity] = useState<string[]>([
    "Verde Meadow approved · 2h ago",
    "Changes requested · Coconut Grove · 6h ago",
    "Host ID verified · Meera N · Yesterday",
  ]);

  // Live database & properties state
  const [adminProps, setAdminProps] = useState(catalogProps);
  const [dbStatus, setDbStatus] = useState<"connected" | "disconnected">("disconnected");
  const [syncing, setSyncing] = useState(false);
  const [propFilter, setPropFilter] = useState<"all" | "published" | "draft">("all");
  const [editPriceId, setEditPriceId] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    const supabase = browserSupabase();
    if (!supabase) {
      setDbStatus("disconnected");
      setAdminProps(catalogProps.map((p) => ({ ...p, status: "published" })));
      return;
    }
    setDbStatus("connected");
    supabase.from("bhk_properties").select("*").then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        const fromDb = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          location: row.location || row.city || "",
          city: row.city || "",
          rating: Number(row.rating) || 0,
          reviews: row.reviews || 0,
          guests: row.guests,
          bedrooms: row.bedrooms,
          beds: row.beds,
          bathrooms: row.bathrooms,
          price: row.price,
          cleaning: row.cleaning,
          highlights: row.highlights || "",
          searchLine: row.highlights || "",
          amenities: row.amenities ?? [],
          vibes: row.vibes ?? [],
          image: (row.image_urls && row.image_urls[0]) || "/assets/prop-palm-grove.jpg",
          alt: row.alt || row.name,
          blurb: row.blurb || row.description || "",
          type: row.type || "Villa",
          guestFavourite: row.guest_favourite,
          group: row.group_name || "popular",
          status: row.status || "published",
          setting: row.setting || "seaside",
          settingName: row.setting_name || row.location || row.city || "",
          settingDetail: row.setting_detail || row.highlights || "",
          // Coastal and garage fields are optional — only carry them across
          // when the row actually has them, so the admin table never invents
          // a shoreline or a garage for a hill or city listing.
          ...(row.setting === "seaside"
            ? {
                beachFrontage: row.beach_frontage || undefined,
                coastalZone: row.coastal_zone || undefined,
                privateBeachAccess: row.private_beach_access ?? true,
                tideDistanceMeters: row.tide_distance_meters ?? 40,
              }
            : {}),
          garage: row.garage_type
            ? {
                type: row.garage_type,
                name: row.garage_type === "marine_port" ? "Beach & Marine Port" : row.garage_type === "ev_pavilion" ? "Executive EV Pavilion" : row.garage_type === "teak_portico" ? "Teak Portico" : "Subterranean Collector's Vault",
                capacity: row.garage_capacity ?? 2,
                supercarFriendly: row.supercar_friendly ?? false,
                evChargingKw: row.ev_charging_kw ?? 0,
                washdownStation: row.washdown_station ?? false,
                description: "Protected covered vehicle bay.",
              }
            : undefined,
          isForSale: Boolean(row.is_for_sale),
          salePrice: row.sale_price,
          landArea: row.land_area,
        }));
        setAdminProps(fromDb);
      } else {
        setAdminProps(catalogProps.map((p) => ({ ...p, status: "published" })));
      }
    });
  }, [catalogProps]);

  // Modal / sheet states
  const [activeUserModal, setActiveUserModal] = useState<AdminUser | null>(null);
  const [activeBookingModal, setActiveBookingModal] = useState<Booking | null>(null);
  const [auditLogOpen, setAuditLogOpen] = useState(false);

  // Verification state
  const [hostChecks, setHostChecks] = useState([
    {
      id: "v-host-1",
      name: "Dev P",
      initials: "DP",
      status: "Pending",
      docs: [
        { label: "Government ID", state: "Verified" },
        { label: "Phone + email", state: "Verified" },
        { label: "Payout account", state: "Pending" },
      ],
    },
    {
      id: "v-host-2",
      name: "Meera N",
      initials: "MN",
      status: "Verified",
      docs: [
        { label: "Government ID", state: "Verified" },
        { label: "Phone + email", state: "Verified" },
        { label: "Payout account", state: "Verified" },
      ],
    },
  ]);

  const [propChecks, setPropChecks] = useState([
    {
      id: "v-prop-1",
      name: "The Guava House",
      location: "Chennai · Host Arjun K",
      status: "Docs in review",
      docs: [
        { label: "Ownership proof", state: "Verified" },
        { label: "Property tax receipt", state: "Pending" },
      ],
    },
    {
      id: "v-prop-2",
      name: "Coconut Grove Farmhouse",
      location: "Mahabalipuram · Host Dev P",
      status: "Missing documents",
      docs: [{ label: "Ownership proof", state: "Missing" }],
    },
  ]);

  // Every row in the queue is awaiting a decision by construction — it is a
  // query for `status = 'pending'` — so there is nothing left to filter on.
  const pendingReviews = queue;

  function logActivity(text: string) {
    setActivity((prev) => [`${text} · ${t("note.justNow")}`, ...prev.slice(0, 8)]);
  }

  async function togglePropertyStatus(id: string) {
    const target = adminProps.find((p) => p.id === id);
    if (!target) return;
    const nextStatus = target.status === "published" ? "draft" : "published";
    const nextLabel = nextStatus === "published" ? t("admin.statePublished") : t("admin.stateDraft");
    setAdminProps((list) =>
      list.map((p) => (p.id === id ? { ...p, status: nextStatus } : p))
    );
    const supabase = browserSupabase();
    if (supabase) {
      await supabase.from("bhk_properties").update({ status: nextStatus }).eq("id", id);
    }
    showToast(t("admin.toastStatusNow", { name: target.name, status: nextLabel }));
    logActivity(t("admin.logStatusUpdated", { name: target.name, status: nextLabel }));
  }

  async function savePrice(id: string) {
    const parsed = Number(newPrice);
    if (!parsed || parsed <= 0) {
      showToast(t("admin.toastErrPrice"));
      return;
    }
    const target = adminProps.find((p) => p.id === id);
    if (!target) return;
    setAdminProps((list) =>
      list.map((p) => (p.id === id ? { ...p, price: parsed } : p))
    );
    const supabase = browserSupabase();
    if (supabase) {
      await supabase.from("bhk_properties").update({ price: parsed }).eq("id", id);
    }
    showToast(t("admin.toastPriceUpdated", { amount: parsed.toLocaleString("en-IN") }));
    logActivity(t("admin.logPriceUpdated", { name: target.name, amount: parsed }));
    setEditPriceId(null);
    setNewPrice("");
  }

  async function syncCatalogToDatabase() {
    const supabase = browserSupabase();
    if (!supabase) {
      showToast(t("admin.toastNoSupabase"));
      return;
    }
    setSyncing(true);
    try {
      const rows = catalogProps.map((p) => ({
        id: p.id,
        name: p.name,
        location: p.location,
        city: p.city,
        guests: p.guests,
        bedrooms: p.bedrooms,
        beds: p.beds,
        bathrooms: p.bathrooms,
        price: p.price,
        cleaning: p.cleaning,
        amenities: p.amenities,
        vibes: p.vibes,
        image_urls: [p.image],
        rating: p.rating,
        reviews: p.reviews,
        highlights: p.highlights,
        blurb: p.blurb,
        alt: p.alt,
        guest_favourite: p.guestFavourite,
        group_name: p.group,
        status: "published",
      }));
      const { error } = await supabase.from("bhk_properties").upsert(rows, { onConflict: "id" });
      if (error) throw error;
      showToast(t("admin.toastSynced"));
      logActivity(t("admin.logBulkSynced"));
      reloadCatalog();
    } catch (err: any) {
      showToast(t("admin.toastSyncFailed", { message: err.message }));
    } finally {
      setSyncing(false);
    }
  }

  /**
   * How long a submission has been waiting, as a sentence.
   *
   * A listing submitted before the review columns existed has no timestamp, so
   * it says so rather than claiming to be brand new.
   */
  function submittedLabel(submittedAt: string | null): string {
    const days = waitingDays(submittedAt);
    if (days === null) return t("admin.submittedUnknown");
    if (days === 0) return t("admin.submittedToday");
    return t("admin.submittedDaysAgo", { n: days });
  }

  /** Re-read the queue. A submission appears here the moment it is submitted. */
  const reloadQueue = useCallback(async () => {
    setQueueLoading(true);
    setQueue(await loadReviewQueue());
    setQueueLoading(false);
  }, []);

  useEffect(() => {
    void reloadQueue();
  }, [reloadQueue]);

  /**
   * Decide a whole listing.
   *
   * The row leaves the queue either way: a rejection and a request for changes
   * both stop it from being "waiting", and only 'approve' publishes it.
   */
  async function actReview(id: string, action: "approve" | "changes" | "reject") {
    const target = queue.find((item) => item.id === id);
    const saved = await decideListing({ id, decision: action });
    if (!saved) {
      showToast(t("admin.toastReviewFailed"));
      return;
    }

    const labels = {
      approve: t("admin.reviewApprovedPublished"),
      changes: t("admin.reviewChangesRequested"),
      reject: t("admin.reviewRejected"),
    };
    setQueue((items) => items.filter((item) => item.id !== id));
    showToast(labels[action]);
    logActivity(
      `${target?.name || id} ${
        action === "approve"
          ? t("admin.logApproved")
          : action === "changes"
            ? t("admin.logChangesRequested")
            : t("admin.logRejected")
      }`
    );
  }

  /** Record a verdict on a single document, with an optional reviewer note. */
  async function actOnDocument(doc: PropertyDocument, status: "verified" | "rejected") {
    const note = docNotes[doc.id] ?? "";
    const saved = await reviewDocument({ id: doc.id, status, note });
    if (!saved) {
      showToast(t("admin.toastDocReviewFailed"));
      return;
    }
    setQueue((items) =>
      items.map((item) => ({
        ...item,
        documents: item.documents.map((entry) =>
          entry.id === doc.id ? { ...entry, status, note: note.trim() || undefined } : entry,
        ),
      })),
    );
    showToast(status === "verified" ? t("admin.toastDocVerified") : t("admin.toastDocRejected"));
  }

  /**
   * Open a document for reading.
   *
   * The bucket is private, so this mints a short-lived signed URL rather than
   * linking straight at a path — which is also why it can fail, and why that
   * failure is reported instead of silently doing nothing.
   */
  async function openDoc(doc: PropertyDocument) {
    if (!(await openDocument(doc.path))) showToast(t("admin.errDocLink"));
  }

  async function downloadDoc(doc: PropertyDocument) {
    if (!(await downloadDocument(doc))) showToast(t("admin.errDocLink"));
  }

  function toggleSuspendUser(email: string) {
    setUsers((list) =>
      list.map((u) => {
        if (u.email === email) {
          const next = u.status === "active" ? "suspended" : "active";
          showToast(next === "suspended" ? t("admin.toastUserSuspended", { name: u.name }) : t("admin.toastUserReactivated", { name: u.name }));
          logActivity(
            t("admin.logUserStatus", {
              name: u.name,
              status: next === "suspended" ? t("admin.stateSuspended") : t("admin.stateActive"),
            })
          );
          return { ...u, status: next };
        }
        return u;
      })
    );
    if (activeUserModal?.email === email) {
      setActiveUserModal((curr) => curr ? { ...curr, status: curr.status === "active" ? "suspended" : "active" } : null);
    }
  }

  function handleVerifyHost(hostId: string) {
    setHostChecks((list) =>
      list.map((h) => {
        if (h.id === hostId) {
          showToast(t("admin.toastHostVerified", { name: h.name }));
          logActivity(t("admin.logHostVerified", { name: h.name }));
          return {
            ...h,
            status: "Verified",
            docs: h.docs.map((d) => ({ ...d, state: "Verified" })),
          };
        }
        return h;
      })
    );
  }

  function handleVerifyProperty(propId: string) {
    setPropChecks((list) =>
      list.map((p) => {
        if (p.id === propId) {
          showToast(t("admin.toastPropertyVerified", { name: p.name }));
          logActivity(t("admin.logPropertyVerification", { name: p.name }));
          return {
            ...p,
            status: "Verified",
            docs: p.docs.map((d) => ({ ...d, state: "Verified" })),
          };
        }
        return p;
      })
    );
  }

  function exportCsv() {
    const rows = [
      ["Code", "Property", "Guest", "CheckIn", "CheckOut", "Total", "Status"],
      ...storeBookings.map((b) => [b.code, b.propertyName || b.propertyId, b.guestName, b.checkIn, b.checkOut, String(b.total), b.status]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `9bhk-bookings-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(t("admin.toastExported"));
    logActivity(t("admin.logExported"));
  }

  function generateDemoBooking() {
    const code = `9B-${Math.floor(50000 + Math.random() * 5000)}`;
    addBooking({
      id: code,
      code,
      propertyId: "guava-house",
      propertyName: "The Guava House",
      checkIn: "2026-11-14",
      checkOut: "2026-11-16",
      adults: 4,
      children: 1,
      total: 14800,
      status: "awaiting",
      guestName: "Priya Sundaram",
      guestEmail: "priya.s@example.com",
      guestPhone: "98402 77112",
      upiId: "9bhk@okhdfcbank",
      paymentRef: `UPI-${Math.floor(10000 + Math.random() * 90000)}`,
    });
    showToast(t("admin.toastTestBooking", { code }));
    logActivity(t("admin.logTestBooking", { code }));
  }

  return (
    <Shell>
      <PageBar title={t("admin.pageBarTitle")} backHref="/profile" right={<span className="admin-flag"><Icon name="shield" />{t("admin.staff")}</span>} />
      
      <header className="page-head">
        <span className="admin-flag">
          <Icon name="shield" />
          {t("admin.restrictedWorkspace")}
        </span>
        <h1 style={{ marginTop: 10 }}>{t("admin.operationsConsole")}</h1>
        <p className="sub">
          {t("admin.consoleSub")}
        </p>
      </header>

      <div className="pad">
        <div className="seg" style={{ overflowX: "auto" }} role="tablist">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
            >
              {t(TAB_KEY[name])}
              {name === "Reviews" && pendingReviews.length > 0 ? (
                <span className="pill warn sm" style={{ marginLeft: 6, fontSize: 10 }}>{pendingReviews.length}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW TAB ────────────────────────────────────────── */}
      {tab === "Overview" ? (
        <div className="pad mt stack">
          <div className="stats">
            <button className="stat" type="button" onClick={() => setTab("Properties")} style={{ textAlign: "left", background: "none", border: 0, cursor: "pointer", width: "100%" }}>
              <span className="lb"><Icon name="home" />{t("admin.statProperties")}</span>
              <span className="nb num">{adminProps.length}</span>
              <span className="sub">{t("admin.activeStays", { n: adminProps.filter(p => (p.status || "published") === "published").length })}</span>
            </button>
            <button className="stat" type="button" onClick={() => setTab("Users")} style={{ textAlign: "left", background: "none", border: 0, cursor: "pointer", width: "100%" }}>
              <span className="lb"><Icon name="users" />{t("admin.statUsers")}</span>
              <span className="nb num">{t("admin.usersActive", { n: users.length })}</span>
              <span className="sub">{t("admin.accountsDirectory")}</span>
            </button>
            <button className="stat" type="button" onClick={() => setTab("Bookings")} style={{ textAlign: "left", background: "none", border: 0, cursor: "pointer", width: "100%" }}>
              <span className="lb"><Icon name="calendar" />{t("admin.statBookings")}</span>
              <span className="nb num">{storeBookings.length}</span>
              <span className="sub">{t("admin.liveMarketplace")}</span>
            </button>
            <button className="stat" type="button" onClick={() => setTab("Verification")} style={{ textAlign: "left", background: "none", border: 0, cursor: "pointer", width: "100%" }}>
              <span className="lb"><Icon name="shield" />{t("admin.statVerification")}</span>
              <span className="nb num">{hostChecks.filter(h => h.status !== "Verified").length + propChecks.filter(p => p.status !== "Verified").length}</span>
              <span className="sub">{t("admin.queuedChecks")}</span>
            </button>
          </div>

          {/* Database Connectivity Banner */}
          <div className="card" style={{ border: dbStatus === "connected" ? "1px solid color-mix(in oklch, var(--ok) 40%, transparent)" : "1px solid var(--border)", background: dbStatus === "connected" ? "color-mix(in oklch, var(--ok) 6%, var(--surface))" : "var(--surface)" }}>
            <div className="between" style={{ alignItems: "center" }}>
              <div className="row" style={{ alignItems: "center", gap: 8 }}>
                <span className={`pill ${dbStatus === "connected" ? "ok" : "warn"}`}>
                  {dbStatus === "connected" ? `🟢 ${t("admin.dbConnected")}` : `🟡 ${t("admin.dbLocalMode")}`}
                </span>
                <strong style={{ fontSize: 14 }}>
                  {dbStatus === "connected" ? t("admin.liveSupabase") : t("admin.localPrototype")}
                </strong>
              </div>
              <button
                className="btn sm outline"
                type="button"
                disabled={syncing}
                onClick={syncCatalogToDatabase}
              >
                <Icon name="refresh" />
                {syncing ? t("admin.syncing") : t("admin.syncCatalogToDb")}
              </button>
            </div>
            <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
              {dbStatus === "connected" ? t("admin.dbActiveTables") : t("admin.dbNoRemote")}
            </p>
          </div>

          <div className="card">
            <h3>{t("admin.managementQueues")}</h3>
            <button className="mi" type="button" onClick={() => setTab("Properties")}>
              <Icon name="home" />
              <span className="lb">{t("admin.farmhouseDirectory")}</span>
              <span className="meta">{t("search.staysCount", { n: adminProps.length })}</span>
            </button>
            <button className="mi" type="button" onClick={() => setTab("Reviews")}>
              <Icon name="award" />
              <span className="lb">{t("admin.propertyReviews")}</span>
              <span className="meta">{t("admin.waitingCount", { n: pendingReviews.length })}</span>
            </button>
            <button className="mi" type="button" onClick={() => setTab("Verification")}>
              <Icon name="shield" />
              <span className="lb">{t("admin.verificationQueue")}</span>
              <span className="meta">{t("admin.checksPending", { n: 2 })}</span>
            </button>
            <button className="mi" type="button" onClick={() => setTab("Bookings")}>
              <Icon name="list" />
              <span className="lb">{t("admin.bookingsManager")}</span>
              <span className="meta">{t("admin.totalCount", { n: storeBookings.length })}</span>
            </button>
          </div>

          {/* Operations Tools Toolbar */}
          <div className="card">
            <h3>{t("admin.operationsTools")}</h3>
            <p className="muted" style={{ fontSize: 13, margin: "4px 0 12px" }}>
              {t("admin.toolsIntro")}
            </p>
            <div className="row wrap" style={{ gap: 8 }}>
              <button
                className="btn sm outline"
                type="button"
                onClick={() => {
                  showToast(t("admin.toastCacheRefreshed"));
                  logActivity(t("admin.logCacheFlushed"));
                }}
              >
                <Icon name="refresh" /> {t("admin.refreshCache")}
              </button>
              <button className="btn sm outline" type="button" onClick={exportCsv}>
                <Icon name="download" /> {t("admin.exportBookingsCsv")}
              </button>
              <button className="btn sm outline" type="button" onClick={generateDemoBooking}>
                <Icon name="plus" /> {t("admin.newTestBooking")}
              </button>
              <button
                className="btn sm outline"
                type="button"
                onClick={() => {
                  void reloadQueue();
                  showToast(t("admin.toastQueueRefreshed"));
                  logActivity(t("admin.logQueueRefreshed"));
                }}
              >
                {t("admin.refreshQueue")}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="between">
              <h3>{t("admin.recentActivity")}</h3>
              <button className="lnk" type="button" onClick={() => setAuditLogOpen(true)}>
                {t("admin.viewAuditLog")}
              </button>
            </div>
            {activity.map((line, i) => (
              <p key={i} style={{ margin: "6px 0", fontSize: 13 }}>
                <Icon name="check" style={{ width: 14, height: 14, display: "inline", marginRight: 6, color: "var(--ok)" }} />
                {line}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── PROPERTIES TAB ───────────────────────────────────────── */}
      {tab === "Properties" ? (
        <div className="pad mt stack">
          <div className="between" style={{ alignItems: "center" }}>
            <div>
              <h2>{t("admin.farmhousesDatabase")}</h2>
              <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                {dbStatus === "connected" ? `🟢 ${t("admin.liveSupabaseTable")}` : `🟡 ${t("admin.localMockMode")}`}
              </p>
            </div>
            <button
              className="btn sm"
              type="button"
              disabled={syncing}
              onClick={syncCatalogToDatabase}
            >
              <Icon name="refresh" />
              {syncing ? t("admin.syncing") : t("admin.syncToDb")}
            </button>
          </div>

          <div className="seg" role="tablist">
            {(["all", "published", "draft"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                role="tab"
                aria-selected={propFilter === filter}
                onClick={() => setPropFilter(filter)}
                style={{ textTransform: "capitalize" }}
              >
                {t(PROP_FILTER_KEY[filter])} ({filter === "all" ? adminProps.length : adminProps.filter((p) => (p.status || "published") === filter).length})
              </button>
            ))}
          </div>

          <div className="stack" style={{ gap: 12 }}>
            {adminProps
              .filter((p) => propFilter === "all" || (p.status || "published") === propFilter)
              .map((p) => {
                const isPublished = (p.status || "published") === "published";
                return (
                  <article className="card" key={p.id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{ width: 84, height: 84, borderRadius: 12, objectFit: "cover", flex: "none" }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="between" style={{ alignItems: "flex-start" }}>
                          <h3 style={{ fontSize: 16, margin: 0 }}>{p.name}</h3>
                          <span className={`pill sm ${isPublished ? "ok" : "warn"}`}>
                            {isPublished ? t("admin.statePublished") : t("admin.stateDraft")}
                          </span>
                        </div>
                        <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                          {p.location} · {t("home.guestCount", { n: p.guests })} · {p.bedrooms} BHK
                        </p>
                        <div className="row" style={{ alignItems: "center", gap: 8, marginTop: 6 }}>
                          <strong className="num" style={{ fontSize: 14 }}>
                            {t("admin.pricePerNight", { amount: p.price.toLocaleString("en-IN") })}
                          </strong>
                          <button
                            className="lnk"
                            type="button"
                            style={{ fontSize: 12, padding: "2px 6px" }}
                            onClick={() => {
                              setEditPriceId(p.id);
                              setNewPrice(String(p.price));
                            }}
                          >
                            {t("admin.editRate")}
                          </button>
                        </div>
                      </div>
                    </div>

                    {editPriceId === p.id ? (
                      <div className="row" style={{ gap: 8, background: "var(--surface-2)", padding: 8, borderRadius: 10 }}>
                        <input
                          type="number"
                          className="ctrl"
                          style={{ minHeight: 36, padding: "6px 10px", fontSize: 13 }}
                          placeholder={t("admin.newPricePlaceholder")}
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                        />
                        <button className="btn sm" type="button" onClick={() => savePrice(p.id)}>
                          {t("action.save")}
                        </button>
                        <button className="btn ghost sm" type="button" onClick={() => setEditPriceId(null)}>
                          {t("action.cancel")}
                        </button>
                      </div>
                    ) : null}

                    <div className="row wrap" style={{ gap: 8, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                      <button
                        className={`btn sm grow ${isPublished ? "outline" : ""}`}
                        type="button"
                        onClick={() => togglePropertyStatus(p.id)}
                      >
                        {isPublished ? t("admin.unpublishStay") : t("admin.publishToExplore")}
                      </button>
                      <Link className="btn ghost sm grow center" href={`/property/${p.id}`} target="_blank">
                        {t("admin.viewStay")} <Icon name="arrow" />
                      </Link>
                    </div>
                  </article>
                );
              })}
          </div>
        </div>
      ) : null}

      {/* ── REVIEWS TAB ─────────────────────────────────────────── */}
      {tab === "Reviews" ? (
        <div className="pad mt stack">
          <div className="between">
            <h2>{t("admin.reviewQueue")}</h2>
            <span className="pill warn sm">{t("admin.inThisBatch", { n: pendingReviews.length })}</span>
          </div>

          <button className="btn outline sm" type="button" onClick={reloadQueue} disabled={queueLoading}>
            <Icon name="refresh" /> {t("admin.refreshQueue")}
          </button>

          {queueLoading ? (
            <div className="empty">
              <Icon name="refresh" />
              <h3>{t("admin.queueLoading")}</h3>
            </div>
          ) : pendingReviews.length === 0 ? (
            <div className="empty">
              <Icon name="check" />
              <h3>{t("admin.queueClear")}</h3>
              <p>{t("admin.queueClearBody")}</p>
            </div>
          ) : (
            pendingReviews.map((item) => (
              <article className="card" key={item.id}>
                <div className="gallery-sm">
                  <span className="g-lead">
                    <img src={item.images[0]} alt={item.name} />
                  </span>
                  {/* A real submission may carry fewer than four photos. */}
                  {[1, 2, 3].map((slot) =>
                    item.images[slot] ? (
                      <span key={slot}>
                        <img src={item.images[slot]} alt="" />
                      </span>
                    ) : null,
                  )}
                </div>

                <div className="between" style={{ marginTop: 12 }}>
                  <span className="pill info sm">{submittedLabel(item.submittedAt)}</span>
                  <span className="tiny muted">{t("admin.listingRef", { id: item.id })}</span>
                </div>

                <h3 style={{ marginTop: 6, fontSize: 18 }}>{item.name}</h3>
                <p className="tiny muted">{item.meta}</p>

                <div className="stack xs mt">
                  <div className="sumline"><span className="k">{t("admin.fieldHost")}</span><span>{item.host}</span></div>
                  <div className="sumline"><span className="k">{t("admin.fieldNightlyPrice")}</span><span className="num">{item.price}</span></div>
                  <div className="sumline"><span className="k">{t("admin.fieldAmenities")}</span><span className="tiny">{item.amenities}</span></div>
                </div>

                <p className="sec-title" style={{ fontSize: 13, marginTop: 14 }}>{t("admin.submittedDocuments")}</p>
                {item.documents.length === 0 ? (
                  <div className="card tight" style={{ marginTop: 6 }}>
                    <p className="tiny muted">{t("admin.noDocuments")}</p>
                  </div>
                ) : (
                  item.documents.map((doc) => (
                    <div className="card tight" key={doc.id} style={{ marginTop: 6 }}>
                      <div className="between">
                        <span className="nm"><Icon name="shield" />{t(DOC_KIND_KEY[doc.kind])}</span>
                        <span className={`pill sm ${DOC_PILL[doc.status]}`}>{t(DOC_STATE_KEY[doc.status])}</span>
                      </div>
                      <p className="tiny muted" style={{ marginTop: 2 }}>
                        {doc.fileName} · {formatBytes(doc.sizeBytes)}
                      </p>
                      <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
                        <button className="btn outline sm" type="button" onClick={() => openDoc(doc)}>
                          {t("admin.docView")}
                        </button>
                        <button className="btn outline sm" type="button" onClick={() => downloadDoc(doc)}>
                          <Icon name="download" /> {t("admin.docDownload")}
                        </button>
                        <button className="btn sm" type="button" onClick={() => actOnDocument(doc, "verified")}>
                          {t("admin.docVerify")}
                        </button>
                        <button className="btn danger sm" type="button" onClick={() => actOnDocument(doc, "rejected")}>
                          {t("admin.reject")}
                        </button>
                      </div>
                      <input
                        className="ctrl"
                        style={{ marginTop: 8 }}
                        placeholder={t("admin.docNotePlaceholder")}
                        aria-label={t("admin.docNotePlaceholder")}
                        value={docNotes[doc.id] ?? doc.note ?? ""}
                        onChange={(event) =>
                          setDocNotes((curr) => ({ ...curr, [doc.id]: event.target.value }))
                        }
                      />
                    </div>
                  ))
                )}

                <div className="row wrap mt" style={{ gap: 8 }}>
                  <button className="btn sm grow" type="button" onClick={() => actReview(item.id, "approve")}>
                    {t("admin.approve")}
                  </button>
                  <button className="btn outline sm grow" type="button" onClick={() => actReview(item.id, "changes")}>
                    {t("admin.requestChanges")}
                  </button>
                  <button className="btn danger sm grow" type="button" onClick={() => actReview(item.id, "reject")}>
                    {t("admin.reject")}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      ) : null}

      {/* ── USERS TAB ───────────────────────────────────────────── */}
      {tab === "Users" ? (
        <div className="stack pad mt">
          <div className="between">
            <h2>{t("admin.userHostDirectory")}</h2>
            <button
              className="btn sm outline"
              type="button"
              onClick={() => showToast(t("admin.toastUsersSynced"))}
            >
              <Icon name="refresh" /> {t("admin.syncUsers")}
            </button>
          </div>

          <div className="list-stack">
            {users.map((person) => (
              <article className="rowcard" key={person.email}>
                <span className="avatar">{person.initials}</span>
                <div className="grow">
                  <div className="between">
                    <strong>{person.name}</strong>
                    <span className={`pill sm ${person.status === "suspended" ? "danger" : person.role.includes("verified") ? "ok" : person.role.includes("pending") ? "warn" : "forest"}`}>
                      {person.status === "suspended" ? t("admin.stateSuspended") : t(USER_ROLE_KEY[person.role])}
                    </span>
                  </div>
                  <p className="tiny muted" style={{ marginTop: 2 }}>{person.meta}</p>
                  <p className="tiny muted">
                    {person.trips ? `${t("admin.tripsCount", { n: person.trips })} · ` : ""}{person.listings ? `${t("admin.listingsCount", { n: person.listings })} · ${t("search.staysCount", { n: String(person.stays) })}` : person.flags || t("admin.noFlags")}
                  </p>
                  <div className="row mt" style={{ gap: 8 }}>
                    <button
                      className="btn sm outline"
                      type="button"
                      onClick={() => setActiveUserModal(person)}
                    >
                      {t("admin.viewRecord")}
                    </button>
                    <button
                      className={`btn sm ${person.status === "active" ? "danger" : "outline"}`}
                      type="button"
                      onClick={() => toggleSuspendUser(person.email)}
                    >
                      {person.status === "active" ? t("admin.suspend") : t("admin.reactivate")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── BOOKINGS TAB ────────────────────────────────────────── */}
      {tab === "Bookings" ? (
        <div className="pad mt stack">
          <div className="between">
            <h2>{t("admin.bookingsManager")}</h2>
            <button className="btn sm" type="button" onClick={exportCsv}>
              <Icon name="download" /> {t("admin.exportCsv")}
            </button>
          </div>

          <div className="list-stack">
            {storeBookings.map((b) => (
              <article className="card" key={b.id}>
                <div className="between">
                  <span className={`pill sm ${b.status === "confirmed" ? "ok" : b.status === "awaiting" ? "warn" : "muted"}`}>
                    {b.status === "confirmed" ? t("booking.statusConfirmed") : b.status === "awaiting" ? t("booking.statusAwaiting") : b.status}
                  </span>
                  <strong className="num">{inr(b.total)}</strong>
                </div>
                <h3 style={{ marginTop: 6, fontSize: 16 }}>{b.propertyName || b.propertyId}</h3>
                <p className="tiny muted">{t("trips.bookingRef", { code: b.code })} · {t("admin.guestNamed", { name: b.guestName })}</p>
                <p className="tiny muted">{t("admin.dateRange", { from: b.checkIn, to: b.checkOut })} · {t("home.guestCount", { n: b.adults + b.children })}</p>
                {b.paymentRef ? <p className="tiny muted">{t("admin.upiReference", { ref: b.paymentRef })}</p> : null}

                <div className="row wrap mt" style={{ gap: 8 }}>
                  <button className="btn sm outline grow" type="button" onClick={() => setActiveBookingModal(b)}>
                    {t("admin.viewDetails")}
                  </button>
                  {b.status === "awaiting" ? (
                    <button
                      className="btn sm grow"
                      type="button"
                      onClick={() => {
                        showToast(t("admin.toastBookingConfirmed", { code: b.code }));
                        logActivity(t("admin.logBookingApproved", { code: b.code }));
                      }}
                    >
                      {t("admin.approveStay")}
                    </button>
                  ) : null}
                  <button
                    className="btn sm danger grow"
                    type="button"
                    onClick={() => {
                      showToast(t("admin.toastRefundIssued", { code: b.code }));
                      logActivity(t("admin.logRefundIssued", { amount: b.total, code: b.code }));
                    }}
                  >
                    {t("admin.issueRefund")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── VERIFICATION TAB ────────────────────────────────────── */}
      {tab === "Verification" ? (
        <div className="pad mt stack">
          <h2>{t("admin.identityVerification")}</h2>
          <div className="seg" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={verifySeg === "host"}
              onClick={() => setVerifySeg("host")}
            >
              {t("admin.hostVerification")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={verifySeg === "property"}
              onClick={() => setVerifySeg("property")}
            >
              {t("admin.propertyVerification")}
            </button>
          </div>

          {verifySeg === "host" ? (
            <div className="list-stack mt">
              {hostChecks.map((host) => (
                <article className="card" key={host.id}>
                  <div className="between">
                    <span className="row" style={{ gap: 8 }}>
                      <span className="avatar sm">{host.initials}</span>
                      <strong>{host.name}</strong>
                    </span>
                    <span className={`pill sm ${host.status === "Verified" ? "ok" : "warn"}`}>{STATE_KEY[host.status] ? t(STATE_KEY[host.status]) : host.status}</span>
                  </div>
                  <div className="card tight mt">
                    {host.docs.map((d) => (
                      <div className="doc-row" key={d.label}>
                        <span className="nm"><Icon name="shield" />{DOC_KEY[d.label] ? t(DOC_KEY[d.label]) : d.label}</span>
                        <span className={`pill sm ${d.state === "Verified" ? "ok" : "warn"}`}>{STATE_KEY[d.state] ? t(STATE_KEY[d.state]) : d.state}</span>
                      </div>
                    ))}
                  </div>
                  <div className="row wrap mt" style={{ gap: 8 }}>
                    <button
                      className="btn sm grow"
                      type="button"
                      disabled={host.status === "Verified"}
                      onClick={() => handleVerifyHost(host.id)}
                    >
                      {host.status === "Verified" ? t("admin.hostVerifiedBtn") : t("admin.verifyHost")}
                    </button>
                    <button
                      className="btn sm outline grow"
                      type="button"
                      onClick={() => {
                        showToast(t("admin.toastDocReminder", { name: host.name }));
                        logActivity(t("admin.logDocsRequested", { name: host.name }));
                      }}
                    >
                      {t("admin.requestInfo")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="list-stack mt">
              {propChecks.map((prop) => (
                <article className="card" key={prop.id}>
                  <div className="between">
                    <strong>{prop.name}</strong>
                    <span className={`pill sm ${prop.status === "Verified" ? "ok" : prop.status === "Missing documents" ? "danger" : "info"}`}>
                      {STATE_KEY[prop.status] ? t(STATE_KEY[prop.status]) : prop.status}
                    </span>
                  </div>
                  <p className="tiny muted">{prop.location}</p>
                  <div className="card tight mt">
                    {prop.docs.map((d) => (
                      <div className="doc-row" key={d.label}>
                        <span className="nm"><Icon name="shield" />{DOC_KEY[d.label] ? t(DOC_KEY[d.label]) : d.label}</span>
                        <span className={`pill sm ${d.state === "Verified" ? "ok" : d.state === "Pending" ? "warn" : "danger"}`}>
                          {STATE_KEY[d.state] ? t(STATE_KEY[d.state]) : d.state}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="row wrap mt" style={{ gap: 8 }}>
                    <button
                      className="btn sm grow"
                      type="button"
                      disabled={prop.status === "Verified"}
                      onClick={() => handleVerifyProperty(prop.id)}
                    >
                      {prop.status === "Verified" ? t("admin.stateVerified") : t("admin.markVerified")}
                    </button>
                    <button
                      className="btn sm outline grow"
                      type="button"
                      onClick={() => {
                        showToast(t("admin.toastOwnershipRequest", { name: prop.name }));
                        logActivity(t("admin.logDeedRequested", { name: prop.name }));
                      }}
                    >
                      {t("admin.requestInfo")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* User Record Modal */}
      <div className={`scrim${activeUserModal ? " is-open" : ""}`} onClick={() => setActiveUserModal(null)} />
      <div className={`sheet${activeUserModal ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label={t("admin.a11yUserRecord")}>
        <div className="sheet-grab" />
        {activeUserModal ? (
          <div className="pad stack">
            <div className="between">
              <h2>{activeUserModal.name}</h2>
              <span className={`pill sm ${activeUserModal.status === "suspended" ? "danger" : "ok"}`}>
                {activeUserModal.status}
              </span>
            </div>
            <p className="muted">{t(USER_ROLE_KEY[activeUserModal.role])}</p>
            <div className="card">
              <div className="sumline"><span className="k">{t("profile.fieldEmail")}</span><span>{activeUserModal.email}</span></div>
              <div className="sumline"><span className="k">{t("admin.fieldPhone")}</span><span>{activeUserModal.phone}</span></div>
              <div className="sumline"><span className="k">{t("nav.trips")}</span><span>{activeUserModal.trips || 0}</span></div>
              <div className="sumline"><span className="k">{t("admin.fieldListings")}</span><span>{activeUserModal.listings || 0}</span></div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button
                className={`btn grow ${activeUserModal.status === "active" ? "danger" : "outline"}`}
                type="button"
                onClick={() => toggleSuspendUser(activeUserModal.email)}
              >
                {activeUserModal.status === "active" ? t("admin.suspendAccount") : t("admin.reactivateAccount")}
              </button>
              <button className="btn outline" type="button" onClick={() => setActiveUserModal(null)}>
                {t("action.close")}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Booking Record Modal */}
      <div className={`scrim${activeBookingModal ? " is-open" : ""}`} onClick={() => setActiveBookingModal(null)} />
      <div className={`sheet${activeBookingModal ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label={t("admin.a11yBookingRecord")}>
        <div className="sheet-grab" />
        {activeBookingModal ? (
          <div className="pad stack">
            <div className="between">
              <h2>{t("trips.bookingRef", { code: activeBookingModal.code })}</h2>
              <span className="pill ok sm">{activeBookingModal.status}</span>
            </div>
            <div className="card">
              <div className="sumline"><span className="k">{t("admin.fieldProperty")}</span><span>{activeBookingModal.propertyName || activeBookingModal.propertyId}</span></div>
              <div className="sumline"><span className="k">{t("admin.fieldGuestName")}</span><span>{activeBookingModal.guestName}</span></div>
              <div className="sumline"><span className="k">{t("admin.fieldGuestEmail")}</span><span>{activeBookingModal.guestEmail}</span></div>
              <div className="sumline"><span className="k">{t("admin.fieldGuestPhone")}</span><span>{activeBookingModal.guestPhone}</span></div>
              <div className="sumline"><span className="k">{t("admin.fieldDates")}</span><span>{t("admin.dateRange", { from: activeBookingModal.checkIn, to: activeBookingModal.checkOut })}</span></div>
              <div className="sumline"><span className="k">{t("admin.fieldUpiRef")}</span><span>{activeBookingModal.paymentRef || t("admin.pendingHostCheck")}</span></div>
              <div className="sumline total"><span className="k">{t("admin.fieldTotal")}</span><span className="num">{inr(activeBookingModal.total)}</span></div>
            </div>
            <button className="btn block" type="button" onClick={() => setActiveBookingModal(null)}>
              {t("action.done")}
            </button>
          </div>
        ) : null}
      </div>

      {/* Audit Log Modal */}
      <div className={`scrim${auditLogOpen ? " is-open" : ""}`} onClick={() => setAuditLogOpen(false)} />
      <div className={`sheet${auditLogOpen ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label={t("admin.a11yAuditLog")}>
        <div className="sheet-grab" />
        <div className="pad stack">
          <h2>{t("admin.auditLog")}</h2>
          <p className="muted">{t("admin.auditLogBody")}</p>
          <div className="card">
            {activity.map((item, idx) => (
              <div className="sumline" key={idx} style={{ padding: "6px 0", fontSize: 13 }}>
                <span>{item}</span>
                <span className="pill sm">{t("admin.auditActor")}</span>
              </div>
            ))}
          </div>
          <button className="btn block" type="button" onClick={() => setAuditLogOpen(false)}>
            {t("action.close")}
          </button>
        </div>
      </div>
    </Shell>
  );
}
