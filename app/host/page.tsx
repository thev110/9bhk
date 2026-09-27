"use client";

import Link from "next/link";
import { useState } from "react";
import { PageBar, Shell } from "@/components/shell";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/catalog";

export default function HostPage() {
  const { draft, user, updateUser, showToast } = useStore();
  const { properties } = useCatalog();
  const [upi, setUpi] = useState(user?.upiId ?? "");
  return (
    <Shell>
      <PageBar
        title="Hosting"
        backHref="/profile"
        right={
          <Link className="btn sm" href="/">
            Switch to guest
          </Link>
        }
      />
      <header className="page-head">
        <p className="eyebrow">Host workspace</p>
        <h1>Your hosting at a glance</h1>
      </header>
      <div className="pad mt">
        <div className="card">
          <h3>Payout UPI</h3>
          <p className="muted">Guests pay this UPI ID when they book. You confirm the stay after the money arrives.</p>
          <label className="field mt">
            UPI ID
            <input className="ctrl" value={upi} placeholder="name@okhdfcbank" onChange={(e) => setUpi(e.target.value)} />
          </label>
          <button
            className="btn sm mt"
            type="button"
            onClick={() => {
              updateUser({ upiId: upi.trim() });
              showToast("UPI ID saved");
            }}
          >
            Save UPI
          </button>
        </div>
      </div>
      <div className="stats pad mt">
        <div className="stat">
          <p className="lb">Upcoming stays</p>
          <p className="nb">4</p>
          <p className="sub">next check-in in 3 days</p>
        </div>
        <div className="stat">
          <p className="lb">This month</p>
          <p className="nb">₹86,400</p>
          <p className="sub">across 3 farmhouses</p>
        </div>
        <div className="stat">
          <p className="lb">Occupancy</p>
          <p className="nb">68%</p>
          <p className="sub">last 30 days</p>
        </div>
        <div className="stat">
          <p className="lb">Views</p>
          <p className="nb">1,240</p>
          <p className="sub">+18% vs last month</p>
        </div>
      </div>

      <div className="between pad mt">
        <h2>Your properties</h2>
        <Link className="btn sm" href="/host/new">
          Add
        </Link>
      </div>
      <div className="stack pad mt">
        {properties.map((item) => (
          <article className="card" key={item.id}>
            <img src={item.image} alt="" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 12 }} />
            <div className="between mt">
              <h3>{item.name}</h3>
              <span className="pill ok">Published</span>
            </div>
            <p className="muted">{item.location}</p>
            <p>{item.highlights}</p>
            <div className="row mt">
              <Link className="btn outline sm" href={`/property/${item.id}`}>
                View
              </Link>
              <Link className="btn ghost sm" href="/host/bookings">
                Bookings
              </Link>
            </div>
          </article>
        ))}
        {draft ? (
          <article className="card">
            <div className="between">
              <h3>{draft.name || "Untitled farmhouse"}</h3>
              <span className="pill warn">{draft.status === "pending" ? "Pending review" : "Draft"}</span>
            </div>
            <p className="muted">{draft.city}</p>
            <Link className="btn outline sm mt" href="/host/new">
              Resume
            </Link>
          </article>
        ) : null}
        <div className="card">
          <h3>Ready to host your first escape?</h3>
          <p className="muted">Add the details once — guests see it in search straight away.</p>
          <Link className="btn mt" href="/host/new">
            List your farmhouse
          </Link>
        </div>
      </div>

      <div className="pad mt">
        <h2>Hosting tools</h2>
        <div className="menu mt">
          <Link className="mi" href="/host/bookings">
            <span className="lb">Bookings</span>
            <span className="meta">4 upcoming</span>
          </Link>
          <Link className="mi" href="/host/bookings?tab=earnings">
            <span className="lb">Earnings</span>
            <span className="meta">₹86,400</span>
          </Link>
        </div>
      </div>
    </Shell>
  );
}
