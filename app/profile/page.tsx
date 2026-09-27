"use client";

import Link from "next/link";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { Icon } from "@/components/icon";
import { CITIES } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function ProfilePage() {
  const { user, signOut, updateUser, bookings, saved, showToast } = useStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(user);

  if (!user) {
    return (
      <Shell nav="profile">
        <header className="page-head">
          <h1>Profile</h1>
        </header>
        <div className="empty">
          <h3>Sign in to save stays, manage trips and book farmhouses.</h3>
          <Link className="btn" href="/login">
            Sign in
          </Link>
          <Link className="btn outline" href="/signup">
            Create account
          </Link>
        </div>
      </Shell>
    );
  }

  const upcoming = bookings.filter((b) => b.status === "confirmed" || b.status === "awaiting").length;

  return (
    <Shell nav="profile">
      <header className="page-head">
        <p className="eyebrow">Profile</p>
        <h1>{user.name}</h1>
      </header>
      <div className="pad mt stack">
        <div className="row">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="avatar" style={{ objectFit: "cover" }} />
          ) : (
            <span className="avatar">{user.name ? user.name.slice(0, 2).toUpperCase() : "ME"}</span>
          )}
          <div>
            <strong>{user.name || "Explorer"}</strong>
            <p className="muted"><a href={`mailto:${user.email}`}>{user.email}</a></p>
            {user.phone ? <p className="muted"><a href={`tel:${user.phone.replace(/\s/g, "")}`}>{user.phone}</a></p> : (
              <p className="muted" style={{ color: "var(--moss)", fontWeight: 600 }}>Phone not added</p>
            )}
            <p className="muted">Verified member</p>
          </div>
        </div>

        {!user.phone ? (
          <div className="card" style={{ border: "1px solid color-mix(in oklch, var(--moss) 40%, transparent)", background: "color-mix(in oklch, var(--moss) 6%, var(--surface))" }}>
            <div className="between">
              <strong>Add your phone number</strong>
              <span className="pill warn">Action needed</span>
            </div>
            <p className="muted mt" style={{ fontSize: 13 }}>
              Your Google account is connected, but we need your mobile number to send check-in pin codes and gate directions.
            </p>
            <button
              className="btn sm mt"
              type="button"
              onClick={() => {
                setForm(user);
                setEditing(true);
              }}
            >
              Add mobile number
            </button>
          </div>
        ) : null}

        <Link href="/host" className="card" style={{ textDecoration: "none" }}>
          <strong>Become a host</strong>
          <p className="muted">Turn empty dates into bookings.</p>
        </Link>

        <div className="menu">
          <button className="mi" type="button" onClick={() => { setForm(user); setEditing(true); }}>
            <Icon name="user" />
            <span className="lb">Personal details</span>
          </button>
          <Link className="mi" href="/trips">
            <Icon name="map" />
            <span className="lb">Trips</span>
            <span className="meta">{upcoming} upcoming</span>
          </Link>
          <Link className="mi" href="/saved">
            <Icon name="heart" />
            <span className="lb">Saved</span>
            <span className="meta">{saved.length}</span>
          </Link>
          <Link className="mi" href="/notifications">
            <Icon name="bell" />
            <span className="lb">Notifications</span>
          </Link>
          <Link className="mi" href="/legal/privacy">
            <Icon name="award" />
            <span className="lb">Privacy, terms and refunds</span>
          </Link>
          <Link className="mi" href="/admin">
            <Icon name="award" />
            <span className="lb">Admin workspace</span>
            <span className="meta">Staff only</span>
          </Link>
        </div>

        <button
          className="btn outline"
          type="button"
          onClick={() => {
            signOut();
            showToast("Signed out successfully");
          }}
        >
          Sign out
        </button>
        <p className="muted center">
          <a href="mailto:hello@9bhk.app">hello@9bhk.app</a>
        </p>
      </div>

      <div className={`scrim${editing ? " is-open" : ""}`} onClick={() => setEditing(false)} />
      <div className={`sheet${editing ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Personal details">
        <div className="sheet-grab" />
        <div className="sheet-head">
          <h2>Personal details</h2>
        </div>
        {form ? (
          <div className="stack">
            <label className="field">
              Full name
              <input className="ctrl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="field">
              Email
              <input className="ctrl" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <span className="help">Used for booking updates.</span>
            </label>
            <label className="field">
              Mobile number
              <input className="ctrl" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label className="field">
              Home city
              <select className="ctrl" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                {[...CITIES, "Bengaluru"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <button
              className="btn block"
              type="button"
              onClick={() => {
                updateUser(form);
                setEditing(false);
                showToast("Saved changes");
              }}
            >
              Save changes
            </button>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
