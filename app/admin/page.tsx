"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageBar, Shell } from "@/components/shell";
import { Icon } from "@/components/icon";
import { inr } from "@/lib/format";
import { useStore, type Booking } from "@/lib/store";
import { useCatalog } from "@/lib/catalog";
import { browserSupabase, hasSupabase } from "@/lib/supabase/browser";

const TABS = ["Overview", "Properties", "Reviews", "Users", "Bookings", "Verification"] as const;

type ReviewItem = {
  id: string;
  name: string;
  meta: string;
  host: string;
  price: string;
  amenities: string;
  when: string;
  images: string[];
  docs: [string, "Verified" | "Pending" | "Missing"][];
  status: "pending" | "approved" | "changes" | "rejected";
};

const INITIAL_QUEUE: ReviewItem[] = [
  {
    id: "LH-2048",
    name: "The Guava House",
    meta: "Chennai · 4 guests · 2 bedrooms · 2 beds · 2 bathrooms",
    host: "Arjun K · host since 2024",
    price: "₹5,950",
    amenities: "Wi-Fi · AC · Pool · Parking",
    when: "Submitted 2 days ago",
    images: [
      "/assets/prop-guava-house.jpg",
      "/assets/prop-coconut-grove.jpg",
      "/assets/prop-terracotta-courtyard.jpg",
      "/assets/prop-mango-orchard.jpg",
    ],
    docs: [
      ["Ownership proof", "Verified"],
      ["Property tax receipt", "Pending"],
      ["Host ID", "Verified"],
    ],
    status: "pending",
  },
  {
    id: "LH-2061",
    name: "Lakeview Courtyard Stay",
    meta: "Pondicherry · 6 guests · 3 bedrooms · 3 beds · 2 bathrooms",
    host: "Meera N · host since 2025",
    price: "₹7,400",
    amenities: "Wi-Fi · AC · BBQ · Bonfire",
    when: "Submitted 1 day ago",
    images: [
      "/assets/prop-lakeview-courtyard.jpg",
      "/assets/prop-blue-horizon.jpg",
      "/assets/prop-verde-meadow.jpg",
      "/assets/prop-sunset-fields.jpg",
    ],
    docs: [
      ["Ownership proof", "Verified"],
      ["Host ID", "Verified"],
    ],
    status: "pending",
  },
  {
    id: "LH-2054",
    name: "Coconut Grove Farmhouse",
    meta: "Mahabalipuram · 3 guests · 1 bedroom · 2 beds · 1 bathroom",
    host: "Dev P · first listing",
    price: "₹4,900",
    amenities: "Wi-Fi · Parking · Kitchenette",
    when: "Submitted 1 day ago",
    images: [
      "/assets/prop-coconut-grove.jpg",
      "/assets/prop-guava-house.jpg",
      "/assets/prop-mango-orchard.jpg",
      "/assets/prop-terracotta-courtyard.jpg",
    ],
    docs: [
      ["Ownership proof", "Missing"],
      ["Host ID", "Pending"],
    ],
    status: "pending",
  },
];

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
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [queue, setQueue] = useState<ReviewItem[]>(INITIAL_QUEUE);
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
          type: row.type || "Oceanfront Estate",
          guestFavourite: row.guest_favourite,
          group: row.group_name || "popular",
          status: row.status || "published",
          beachFrontage: row.beach_frontage || "120 ft direct beachfront",
          coastalZone: row.coastal_zone || "Direct Oceanfront",
          privateBeachAccess: row.private_beach_access ?? true,
          tideDistanceMeters: row.tide_distance_meters ?? 40,
          garage: {
            type: row.garage_type || "collector_vault",
            name: row.garage_type === "marine_port" ? "Beach & Marine Port" : row.garage_type === "ev_pavilion" ? "Executive EV Pavilion" : row.garage_type === "teak_portico" ? "Coastal Teak Portico" : "Subterranean Collector's Vault",
            capacity: row.garage_capacity ?? 2,
            supercarFriendly: row.supercar_friendly ?? true,
            evChargingKw: row.ev_charging_kw ?? 22,
            washdownStation: row.washdown_station ?? true,
            description: "Protected coastal vehicle bay.",
          },
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

  const pendingReviews = useMemo(() => queue.filter((item) => item.status === "pending"), [queue]);

  function logActivity(text: string) {
    setActivity((prev) => [`${text} · Just now`, ...prev.slice(0, 8)]);
  }

  async function togglePropertyStatus(id: string) {
    const target = adminProps.find((p) => p.id === id);
    if (!target) return;
    const nextStatus = target.status === "published" ? "draft" : "published";
    setAdminProps((list) =>
      list.map((p) => (p.id === id ? { ...p, status: nextStatus } : p))
    );
    const supabase = browserSupabase();
    if (supabase) {
      await supabase.from("bhk_properties").update({ status: nextStatus }).eq("id", id);
    }
    showToast(`${target.name} is now ${nextStatus}`);
    logActivity(`Property ${target.name} status updated to ${nextStatus}`);
  }

  async function savePrice(id: string) {
    const parsed = Number(newPrice);
    if (!parsed || parsed <= 0) {
      showToast("Enter a valid price amount");
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
    showToast(`Updated nightly rate to ₹${parsed.toLocaleString("en-IN")}`);
    logActivity(`Nightly rate for ${target.name} updated to ₹${parsed}`);
    setEditPriceId(null);
    setNewPrice("");
  }

  async function syncCatalogToDatabase() {
    const supabase = browserSupabase();
    if (!supabase) {
      showToast("Supabase environment variables not configured in current environment");
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
      showToast("All farmhouses synced to Supabase database!");
      logActivity("Bulk synchronized catalog to Supabase (bhk_properties)");
      reloadCatalog();
    } catch (err: any) {
      showToast(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  function actReview(id: string, action: "approve" | "changes" | "reject") {
    const labels = {
      approve: "Listing approved and published",
      changes: "Changes requested from the host",
      reject: "Listing rejected",
    };
    const target = queue.find((q) => q.id === id);
    setQueue((items) =>
      items.map((item) => (item.id === id ? { ...item, status: action === "approve" ? "approved" : action === "changes" ? "changes" : "rejected" } : item))
    );
    showToast(labels[action]);
    logActivity(`${target?.name || id} ${action === "approve" ? "approved" : action === "changes" ? "changes requested" : "rejected"}`);
  }

  function toggleSuspendUser(email: string) {
    setUsers((list) =>
      list.map((u) => {
        if (u.email === email) {
          const next = u.status === "active" ? "suspended" : "active";
          showToast(next === "suspended" ? `Suspended ${u.name}` : `Reactivated ${u.name}`);
          logActivity(`User ${u.name} status set to ${next}`);
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
          showToast(`Host ${h.name} verified — access granted`);
          logActivity(`Host ${h.name} verified`);
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
          showToast(`${p.name} verified and ready to publish`);
          logActivity(`Property ${p.name} verification completed`);
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
    showToast("Bookings exported to CSV");
    logActivity("Exported bookings report CSV");
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
    showToast(`Test booking #${code} created!`);
    logActivity(`Test booking #${code} generated`);
  }

  return (
    <Shell>
      <PageBar title="Admin Operations" backHref="/profile" right={<span className="admin-flag"><Icon name="shield" />Staff</span>} />
      
      <header className="page-head">
        <span className="admin-flag">
          <Icon name="shield" />
          Restricted workspace
        </span>
        <h1 style={{ marginTop: 10 }}>Operations console</h1>
        <p className="sub">
          Review listings, verify hosts, manage bookings and run operations tools.
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
              {name}
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
              <span className="lb"><Icon name="home" />Properties</span>
              <span className="nb num">{adminProps.length}</span>
              <span className="sub">{adminProps.filter(p => (p.status || "published") === "published").length} active stays</span>
            </button>
            <button className="stat" type="button" onClick={() => setTab("Users")} style={{ textAlign: "left", background: "none", border: 0, cursor: "pointer", width: "100%" }}>
              <span className="lb"><Icon name="users" />Users</span>
              <span className="nb num">{users.length} active</span>
              <span className="sub">Accounts directory</span>
            </button>
            <button className="stat" type="button" onClick={() => setTab("Bookings")} style={{ textAlign: "left", background: "none", border: 0, cursor: "pointer", width: "100%" }}>
              <span className="lb"><Icon name="calendar" />Bookings</span>
              <span className="nb num">{storeBookings.length}</span>
              <span className="sub">Live marketplace</span>
            </button>
            <button className="stat" type="button" onClick={() => setTab("Verification")} style={{ textAlign: "left", background: "none", border: 0, cursor: "pointer", width: "100%" }}>
              <span className="lb"><Icon name="shield" />Verification</span>
              <span className="nb num">{hostChecks.filter(h => h.status !== "Verified").length + propChecks.filter(p => p.status !== "Verified").length}</span>
              <span className="sub">Queued checks</span>
            </button>
          </div>

          {/* Database Connectivity Banner */}
          <div className="card" style={{ border: dbStatus === "connected" ? "1px solid color-mix(in oklch, var(--ok) 40%, transparent)" : "1px solid var(--border)", background: dbStatus === "connected" ? "color-mix(in oklch, var(--ok) 6%, var(--surface))" : "var(--surface)" }}>
            <div className="between" style={{ alignItems: "center" }}>
              <div className="row" style={{ alignItems: "center", gap: 8 }}>
                <span className={`pill ${dbStatus === "connected" ? "ok" : "warn"}`}>
                  {dbStatus === "connected" ? "🟢 Database Connected" : "🟡 Local Mode"}
                </span>
                <strong style={{ fontSize: 14 }}>
                  {dbStatus === "connected" ? "Live Supabase Connection" : "Local Prototype State"}
                </strong>
              </div>
              <button
                className="btn sm outline"
                type="button"
                disabled={syncing}
                onClick={syncCatalogToDatabase}
              >
                <Icon name="refresh" />
                {syncing ? "Syncing..." : "Sync Catalog to DB"}
              </button>
            </div>
            <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
              {dbStatus === "connected"
                ? "Active tables: bhk_properties, bhk_bookings, bhk_profiles, bhk_notifications. All admin status toggles and price updates persist directly to Supabase."
                : "No remote database URL detected in this environment. Properties, bookings and reviews are managed reactively in local state."}
            </p>
          </div>

          <div className="card">
            <h3>Management & Queues</h3>
            <button className="mi" type="button" onClick={() => setTab("Properties")}>
              <Icon name="home" />
              <span className="lb">Farmhouse directory</span>
              <span className="meta">{adminProps.length} stays</span>
            </button>
            <button className="mi" type="button" onClick={() => setTab("Reviews")}>
              <Icon name="award" />
              <span className="lb">Property reviews</span>
              <span className="meta">{pendingReviews.length} waiting</span>
            </button>
            <button className="mi" type="button" onClick={() => setTab("Verification")}>
              <Icon name="shield" />
              <span className="lb">Verification queue</span>
              <span className="meta">2 checks pending</span>
            </button>
            <button className="mi" type="button" onClick={() => setTab("Bookings")}>
              <Icon name="list" />
              <span className="lb">Bookings manager</span>
              <span className="meta">{storeBookings.length} total</span>
            </button>
          </div>

          {/* Operations Tools Toolbar */}
          <div className="card">
            <h3>Operations Tools</h3>
            <p className="muted" style={{ fontSize: 13, margin: "4px 0 12px" }}>
              Quick administrative triggers and system utilities:
            </p>
            <div className="row wrap" style={{ gap: 8 }}>
              <button
                className="btn sm outline"
                type="button"
                onClick={() => {
                  showToast("Catalog & server cache refreshed");
                  logActivity("System catalog cache flushed");
                }}
              >
                <Icon name="refresh" /> Refresh Cache
              </button>
              <button className="btn sm outline" type="button" onClick={exportCsv}>
                <Icon name="download" /> Export Bookings CSV
              </button>
              <button className="btn sm outline" type="button" onClick={generateDemoBooking}>
                <Icon name="plus" /> New Test Booking
              </button>
              <button
                className="btn sm outline"
                type="button"
                onClick={() => {
                  setQueue(INITIAL_QUEUE);
                  showToast("Review queues restored to sample state");
                  logActivity("Sample review queue reset");
                }}
              >
                Reset Demo Queues
              </button>
            </div>
          </div>

          <div className="card">
            <div className="between">
              <h3>Recent activity</h3>
              <button className="lnk" type="button" onClick={() => setAuditLogOpen(true)}>
                View audit log
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
              <h2>Farmhouses & Database</h2>
              <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                {dbStatus === "connected" ? "🟢 Live connected to Supabase bhk_properties" : "🟡 Local mock catalog mode"}
              </p>
            </div>
            <button
              className="btn sm"
              type="button"
              disabled={syncing}
              onClick={syncCatalogToDatabase}
            >
              <Icon name="refresh" />
              {syncing ? "Syncing..." : "Sync to DB"}
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
                {filter} ({filter === "all" ? adminProps.length : adminProps.filter((p) => (p.status || "published") === filter).length})
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
                            {isPublished ? "Published" : "Draft"}
                          </span>
                        </div>
                        <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                          {p.location} · {p.guests} guests · {p.bedrooms} BHK
                        </p>
                        <div className="row" style={{ alignItems: "center", gap: 8, marginTop: 6 }}>
                          <strong className="num" style={{ fontSize: 14 }}>
                            ₹{p.price.toLocaleString("en-IN")} / night
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
                            Edit rate
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
                          placeholder="New nightly price (₹)"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                        />
                        <button className="btn sm" type="button" onClick={() => savePrice(p.id)}>
                          Save
                        </button>
                        <button className="btn ghost sm" type="button" onClick={() => setEditPriceId(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : null}

                    <div className="row wrap" style={{ gap: 8, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                      <button
                        className={`btn sm grow ${isPublished ? "outline" : ""}`}
                        type="button"
                        onClick={() => togglePropertyStatus(p.id)}
                      >
                        {isPublished ? "Unpublish stay" : "Publish to explore"}
                      </button>
                      <Link className="btn ghost sm grow center" href={`/property/${p.id}`} target="_blank">
                        View stay <Icon name="arrow" />
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
            <h2>Property review queue</h2>
            <span className="pill warn sm">{pendingReviews.length} in this batch</span>
          </div>

          {pendingReviews.length === 0 ? (
            <div className="empty">
              <Icon name="check" />
              <h3>Review queue is clear!</h3>
              <p>All submitted farmhouses have been reviewed and decided.</p>
              <button className="btn sm" type="button" onClick={() => setQueue(INITIAL_QUEUE)}>
                Reload sample queue
              </button>
            </div>
          ) : (
            pendingReviews.map((item) => (
              <article className="card" key={item.id}>
                <div className="gallery-sm">
                  <span className="g-lead">
                    <img src={item.images[0]} alt={item.name} />
                  </span>
                  <span><img src={item.images[1]} alt="" /></span>
                  <span><img src={item.images[2]} alt="" /></span>
                  <span><img src={item.images[3]} alt="" /></span>
                </div>

                <div className="between" style={{ marginTop: 12 }}>
                  <span className="pill info sm">{item.when}</span>
                  <span className="tiny muted">Listing #{item.id}</span>
                </div>

                <h3 style={{ marginTop: 6, fontSize: 18 }}>{item.name}</h3>
                <p className="tiny muted">{item.meta}</p>

                <div className="stack xs mt">
                  <div className="sumline"><span className="k">Host</span><span>{item.host}</span></div>
                  <div className="sumline"><span className="k">Nightly price</span><span className="num">{item.price}</span></div>
                  <div className="sumline"><span className="k">Amenities</span><span className="tiny">{item.amenities}</span></div>
                </div>

                <p className="sec-title" style={{ fontSize: 13, marginTop: 14 }}>Submitted documents</p>
                <div className="card tight" style={{ marginTop: 6 }}>
                  {item.docs.map(([doc, state]) => (
                    <div className="doc-row" key={doc}>
                      <span className="nm"><Icon name="shield" />{doc}</span>
                      <span className={`pill sm ${state === "Verified" ? "ok" : state === "Pending" ? "warn" : "danger"}`}>
                        {state}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="row wrap mt" style={{ gap: 8 }}>
                  <button className="btn sm grow" type="button" onClick={() => actReview(item.id, "approve")}>
                    Approve
                  </button>
                  <button className="btn outline sm grow" type="button" onClick={() => actReview(item.id, "changes")}>
                    Request changes
                  </button>
                  <button className="btn danger sm grow" type="button" onClick={() => actReview(item.id, "reject")}>
                    Reject
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
            <h2>User & host directory</h2>
            <button
              className="btn sm outline"
              type="button"
              onClick={() => showToast("User directory synced with Supabase Auth")}
            >
              <Icon name="refresh" /> Sync Users
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
                      {person.status === "suspended" ? "Suspended" : person.role}
                    </span>
                  </div>
                  <p className="tiny muted" style={{ marginTop: 2 }}>{person.meta}</p>
                  <p className="tiny muted">
                    {person.trips ? `${person.trips} trips · ` : ""}{person.listings ? `${person.listings} listings · ${person.stays} stays` : person.flags || "No flags"}
                  </p>
                  <div className="row mt" style={{ gap: 8 }}>
                    <button
                      className="btn sm outline"
                      type="button"
                      onClick={() => setActiveUserModal(person)}
                    >
                      View record
                    </button>
                    <button
                      className={`btn sm ${person.status === "active" ? "danger" : "outline"}`}
                      type="button"
                      onClick={() => toggleSuspendUser(person.email)}
                    >
                      {person.status === "active" ? "Suspend" : "Reactivate"}
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
            <h2>Bookings manager</h2>
            <button className="btn sm" type="button" onClick={exportCsv}>
              <Icon name="download" /> Export CSV
            </button>
          </div>

          <div className="list-stack">
            {storeBookings.map((b) => (
              <article className="card" key={b.id}>
                <div className="between">
                  <span className={`pill sm ${b.status === "confirmed" ? "ok" : b.status === "awaiting" ? "warn" : "muted"}`}>
                    {b.status === "confirmed" ? "Confirmed" : b.status === "awaiting" ? "Awaiting host" : b.status}
                  </span>
                  <strong className="num">{inr(b.total)}</strong>
                </div>
                <h3 style={{ marginTop: 6, fontSize: 16 }}>{b.propertyName || b.propertyId}</h3>
                <p className="tiny muted">Booking #{b.code} · Guest {b.guestName}</p>
                <p className="tiny muted">{b.checkIn} to {b.checkOut} · {b.adults + b.children} guests</p>
                {b.paymentRef ? <p className="tiny muted">UPI Reference: {b.paymentRef}</p> : null}

                <div className="row wrap mt" style={{ gap: 8 }}>
                  <button className="btn sm outline grow" type="button" onClick={() => setActiveBookingModal(b)}>
                    View details
                  </button>
                  {b.status === "awaiting" ? (
                    <button
                      className="btn sm grow"
                      type="button"
                      onClick={() => {
                        showToast(`Booking #${b.code} confirmed for guest`);
                        logActivity(`Booking #${b.code} manually approved`);
                      }}
                    >
                      Approve stay
                    </button>
                  ) : null}
                  <button
                    className="btn sm danger grow"
                    type="button"
                    onClick={() => {
                      showToast(`Refund issued for booking #${b.code}`);
                      logActivity(`Refund ₹${b.total} issued for #${b.code}`);
                    }}
                  >
                    Issue refund
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
          <h2>Identity & property verification</h2>
          <div className="seg" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={verifySeg === "host"}
              onClick={() => setVerifySeg("host")}
            >
              Host verification
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={verifySeg === "property"}
              onClick={() => setVerifySeg("property")}
            >
              Property verification
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
                    <span className={`pill sm ${host.status === "Verified" ? "ok" : "warn"}`}>{host.status}</span>
                  </div>
                  <div className="card tight mt">
                    {host.docs.map((d) => (
                      <div className="doc-row" key={d.label}>
                        <span className="nm"><Icon name="shield" />{d.label}</span>
                        <span className={`pill sm ${d.state === "Verified" ? "ok" : "warn"}`}>{d.state}</span>
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
                      {host.status === "Verified" ? "Host verified" : "Verify host"}
                    </button>
                    <button
                      className="btn sm outline grow"
                      type="button"
                      onClick={() => {
                        showToast(`Document upload reminder sent to ${host.name}`);
                        logActivity(`Requested docs from ${host.name}`);
                      }}
                    >
                      Request info
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
                      {prop.status}
                    </span>
                  </div>
                  <p className="tiny muted">{prop.location}</p>
                  <div className="card tight mt">
                    {prop.docs.map((d) => (
                      <div className="doc-row" key={d.label}>
                        <span className="nm"><Icon name="shield" />{d.label}</span>
                        <span className={`pill sm ${d.state === "Verified" ? "ok" : d.state === "Pending" ? "warn" : "danger"}`}>
                          {d.state}
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
                      {prop.status === "Verified" ? "Verified" : "Mark verified"}
                    </button>
                    <button
                      className="btn sm outline grow"
                      type="button"
                      onClick={() => {
                        showToast(`Ownership document request sent for ${prop.name}`);
                        logActivity(`Requested deed from host for ${prop.name}`);
                      }}
                    >
                      Request info
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
      <div className={`sheet${activeUserModal ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label="User record">
        <div className="sheet-grab" />
        {activeUserModal ? (
          <div className="pad stack">
            <div className="between">
              <h2>{activeUserModal.name}</h2>
              <span className={`pill sm ${activeUserModal.status === "suspended" ? "danger" : "ok"}`}>
                {activeUserModal.status}
              </span>
            </div>
            <p className="muted">{activeUserModal.role}</p>
            <div className="card">
              <div className="sumline"><span className="k">Email</span><span>{activeUserModal.email}</span></div>
              <div className="sumline"><span className="k">Phone</span><span>{activeUserModal.phone}</span></div>
              <div className="sumline"><span className="k">Trips</span><span>{activeUserModal.trips || 0}</span></div>
              <div className="sumline"><span className="k">Listings</span><span>{activeUserModal.listings || 0}</span></div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button
                className={`btn grow ${activeUserModal.status === "active" ? "danger" : "outline"}`}
                type="button"
                onClick={() => toggleSuspendUser(activeUserModal.email)}
              >
                {activeUserModal.status === "active" ? "Suspend Account" : "Reactivate Account"}
              </button>
              <button className="btn outline" type="button" onClick={() => setActiveUserModal(null)}>
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Booking Record Modal */}
      <div className={`scrim${activeBookingModal ? " is-open" : ""}`} onClick={() => setActiveBookingModal(null)} />
      <div className={`sheet${activeBookingModal ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Booking record">
        <div className="sheet-grab" />
        {activeBookingModal ? (
          <div className="pad stack">
            <div className="between">
              <h2>Booking #{activeBookingModal.code}</h2>
              <span className="pill ok sm">{activeBookingModal.status}</span>
            </div>
            <div className="card">
              <div className="sumline"><span className="k">Property</span><span>{activeBookingModal.propertyName || activeBookingModal.propertyId}</span></div>
              <div className="sumline"><span className="k">Guest name</span><span>{activeBookingModal.guestName}</span></div>
              <div className="sumline"><span className="k">Guest email</span><span>{activeBookingModal.guestEmail}</span></div>
              <div className="sumline"><span className="k">Guest phone</span><span>{activeBookingModal.guestPhone}</span></div>
              <div className="sumline"><span className="k">Dates</span><span>{activeBookingModal.checkIn} to {activeBookingModal.checkOut}</span></div>
              <div className="sumline"><span className="k">UPI Ref</span><span>{activeBookingModal.paymentRef || "Pending host check"}</span></div>
              <div className="sumline total"><span className="k">Total</span><span className="num">{inr(activeBookingModal.total)}</span></div>
            </div>
            <button className="btn block" type="button" onClick={() => setActiveBookingModal(null)}>
              Done
            </button>
          </div>
        ) : null}
      </div>

      {/* Audit Log Modal */}
      <div className={`scrim${auditLogOpen ? " is-open" : ""}`} onClick={() => setAuditLogOpen(false)} />
      <div className={`sheet${auditLogOpen ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Audit log">
        <div className="sheet-grab" />
        <div className="pad stack">
          <h2>Admin audit log</h2>
          <p className="muted">All administrative and operational transactions are logged with staff identity.</p>
          <div className="card">
            {activity.map((item, idx) => (
              <div className="sumline" key={idx} style={{ padding: "6px 0", fontSize: 13 }}>
                <span>{item}</span>
                <span className="pill sm">Staff: admin@9bhk.app</span>
              </div>
            ))}
          </div>
          <button className="btn block" type="button" onClick={() => setAuditLogOpen(false)}>
            Close
          </button>
        </div>
      </div>
    </Shell>
  );
}
