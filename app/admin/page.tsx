"use client";

import { useState } from "react";
import { PageBar, Shell } from "@/components/shell";
import { useStore } from "@/lib/store";

const TABS = ["Overview", "Reviews", "Users", "Bookings", "Verification"] as const;

const QUEUE = [
  {
    id: "LH-2048",
    name: "The Guava House",
    meta: "Chennai · 4 guests · 2 bedrooms · 2 beds · 2 bathrooms",
    host: "Arjun K · host since 2024",
    price: "₹5,950",
    amenities: "Wi-Fi · AC · Pool · Parking",
    when: "Submitted 2 days ago",
    docs: [
      ["Ownership proof", "Verified"],
      ["Property tax receipt", "Pending"],
      ["Host ID", "Verified"],
    ],
  },
  {
    id: "LH-2061",
    name: "Lakeview Courtyard Stay",
    meta: "Pondicherry · 6 guests · 3 bedrooms · 3 beds · 2 bathrooms",
    host: "Meera N · host since 2025",
    price: "₹7,400",
    amenities: "Wi-Fi · AC · BBQ · Bonfire",
    when: "Submitted 1 day ago",
    docs: [["Docs", "Incomplete"]],
  },
  {
    id: "LH-2054",
    name: "Coconut Grove Farmhouse",
    meta: "Mahabalipuram · 3 guests · 1 bedroom · 2 beds · 1 bathroom",
    host: "Dev P · first listing",
    price: "₹4,900",
    amenities: "Wi-Fi · Parking · Kitchenette",
    when: "Submitted 1 day ago",
    docs: [["Ownership proof", "Missing"]],
  },
];

const USERS = [
  { initials: "AR", name: "Ananya R", role: "Guest", meta: "ananya.r@example.com · joined 2025" },
  { initials: "AK", name: "Arjun K", role: "Host", meta: "arjun.k@example.com · host since 2024" },
  { initials: "MN", name: "Meera N", role: "Host", meta: "meera.n@example.com · verified yesterday" },
];

export default function AdminPage() {
  const { showToast } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [queue, setQueue] = useState(QUEUE);

  function act(id: string, action: string) {
    setQueue((rows) => rows.filter((row) => row.id !== id));
    showToast(`${action} · ${id}`);
  }

  return (
    <Shell>
      <PageBar title="Admin" backHref="/profile" right={<span className="muted">Exit</span>} />
      <header className="page-head">
        <p className="eyebrow">Restricted workspace</p>
        <h1>Operations console</h1>
        <p className="sub">Review listings, verify hosts and manage bookings. Access is enforced on the server — the UI only mirrors it.</p>
      </header>
      <div className="pad">
        <div className="seg" style={{ overflowX: "auto" }}>
          {TABS.map((name) => (
            <button key={name} type="button" aria-selected={tab === name} onClick={() => setTab(name)}>
              {name}
            </button>
          ))}
        </div>
      </div>

      {tab === "Overview" ? (
        <div className="pad mt stack">
          <div className="stats">
            <div className="stat">
              <p className="lb">Properties</p>
              <p className="nb">248</p>
              <p className="sub">19 pending review</p>
            </div>
            <div className="stat">
              <p className="lb">Users</p>
              <p className="nb">5,412</p>
              <p className="sub">+182 this week</p>
            </div>
            <div className="stat">
              <p className="lb">Bookings</p>
              <p className="nb">1,036</p>
              <p className="sub">84 active now</p>
            </div>
            <div className="stat">
              <p className="lb">Pending reviews</p>
              <p className="nb">19</p>
              <p className="sub">oldest 2 days ago</p>
            </div>
          </div>
          <div className="card">
            <h3>Queues</h3>
            <button className="mi" type="button" onClick={() => setTab("Reviews")}>
              <span className="lb">Property reviews</span>
              <span className="meta">19 waiting</span>
            </button>
            <button className="mi" type="button" onClick={() => setTab("Verification")}>
              <span className="lb">Verification queue</span>
              <span className="meta">7 waiting</span>
            </button>
            <button className="mi" type="button" onClick={() => setTab("Bookings")}>
              <span className="lb">Flagged bookings</span>
              <span className="meta">3 to check</span>
            </button>
          </div>
          <div className="card">
            <h3>Recent activity</h3>
            <p>Verde Meadow approved · 2h ago</p>
            <p>Changes requested · Coconut Grove · 6h ago</p>
            <p>Host ID verified · Meera N · Yesterday</p>
          </div>
        </div>
      ) : null}

      {tab === "Reviews" || tab === "Verification" ? (
        <div className="pad mt stack">
          <p className="muted">{queue.length} in this batch</p>
          {queue.length === 0 ? (
            <div className="empty">
              <h3>Review queue is clear.</h3>
              <p>New submissions land here the moment a host publishes a listing.</p>
              <button className="btn" type="button" onClick={() => setTab("Overview")}>
                Back to overview
              </button>
            </div>
          ) : (
            queue.map((item) => (
              <article className="card" key={item.id}>
                <p className="muted">{item.when}</p>
                <p className="muted">Listing #{item.id}</p>
                <h3>{item.name}</h3>
                <p>{item.meta}</p>
                <p className="muted">Host · {item.host}</p>
                <p>Nightly price {item.price}</p>
                <p className="muted">Amenities {item.amenities}</p>
                <div className="stack sm mt">
                  {item.docs.map(([doc, state]) => (
                    <div className="between" key={doc}>
                      <span>{doc}</span>
                      <span className={`pill ${state === "Verified" ? "ok" : "warn"}`}>{state}</span>
                    </div>
                  ))}
                </div>
                <div className="row mt wrap">
                  <button className="btn sm" type="button" onClick={() => act(item.id, "Approved")}>
                    Approve
                  </button>
                  <button className="btn outline sm" type="button" onClick={() => act(item.id, "Changes requested")}>
                    Request changes
                  </button>
                  <button className="btn danger sm" type="button" onClick={() => act(item.id, "Rejected")}>
                    Reject
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      ) : null}

      {tab === "Users" ? (
        <div className="stack pad mt">
          <h2>User & host management</h2>
          {USERS.map((person) => (
            <article className="rowcard" key={person.name}>
              <span className="avatar">{person.initials}</span>
              <div>
                <strong>{person.name}</strong>
                <p className="muted">{person.role}</p>
                <p className="muted">{person.meta}</p>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "Bookings" ? (
        <div className="pad mt stack">
          <article className="card">
            <span className="pill warn">Flagged</span>
            <h3 className="mt">Palm Grove · 12–14 Jun</h3>
            <p className="muted">Guest count changed after confirmation. Host asked for a review.</p>
            <button className="btn outline sm mt" type="button" onClick={() => showToast("Booking marked reviewed")}>
              Mark reviewed
            </button>
          </article>
        </div>
      ) : null}
    </Shell>
  );
}
