"use client";

import Link from "next/link";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { Icon } from "@/components/icon";
import { CITIES } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { KycLockerCard } from "@/components/kyc-locker-card";

export default function ProfilePage() {
  const { user, signOut, updateUser, bookings, saved, showToast } = useStore();
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(user);

  if (!user) {
    return (
      <Shell nav="profile">
        <header className="page-head">
          <h1>{t("profile.title")}</h1>
        </header>
        <div className="pad mt stack">
          <LanguageSwitcher />
        </div>
        <div className="empty">
          <h3>{t("profile.signInPrompt")}</h3>
          <Link className="btn" href="/login">
            {t("auth.signIn")}
          </Link>
          <Link className="btn outline" href="/signup">
            {t("auth.createAccount")}
          </Link>
        </div>
      </Shell>
    );
  }

  const upcoming = bookings.filter((b) => b.status === "confirmed" || b.status === "awaiting").length;
  const roleLabel = t("role.buyer");

  return (
    <Shell nav="profile">
      <header className="page-head">
        <p className="eyebrow">{t("profile.title")}</p>
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
            <strong>{user.name || t("profile.explorer")}</strong>
            <p className="muted"><a href={`mailto:${user.email}`}>{user.email}</a></p>
            {user.phone ? <p className="muted"><a href={`tel:${user.phone.replace(/\s/g, "")}`}>{user.phone}</a></p> : (
              <p className="muted" style={{ color: "var(--moss)", fontWeight: 600 }}>{t("profile.phoneNotAdded")}</p>
            )}
            <div className="row mt" style={{ gap: 6, marginTop: 4 }}>
              <span className="pill forest" style={{ fontSize: 10, textTransform: "capitalize" }}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {!user.phone ? (
          <div className="card" style={{ border: "1px solid color-mix(in oklch, var(--moss) 40%, transparent)", background: "color-mix(in oklch, var(--moss) 6%, var(--surface))" }}>
            <div className="between">
              <strong>{t("profile.addPhoneTitle")}</strong>
              <span className="pill warn">{t("profile.actionNeeded")}</span>
            </div>
            <p className="muted mt" style={{ fontSize: 13 }}>
              {t("profile.addPhoneBody")}
            </p>
            <button
              className="btn sm mt"
              type="button"
              onClick={() => {
                setForm(user);
                setEditing(true);
              }}
            >
              {t("profile.addMobile")}
            </button>
          </div>
        ) : null}

        <LanguageSwitcher />

        <KycLockerCard category="guest" onToast={showToast} />

        <div className="row wrap" style={{ gap: 10 }}>
          <Link href="/" className="card" style={{ flex: 1, minWidth: 140, textDecoration: "none" }}>
            <strong>Explore 3+ BHK Stays</strong>
            <p className="muted" style={{ fontSize: 12 }}>Private villas, farmhouses &amp; coastal retreats</p>
          </Link>
          <Link href="/buy" className="card" style={{ flex: 1, minWidth: 140, textDecoration: "none" }}>
            <strong>Acquire 3+ BHK Estates</strong>
            <p className="muted" style={{ fontSize: 12 }}>Verified freehold estates &amp; trial stays</p>
          </Link>
        </div>

        <div className="menu">
          <button className="mi" type="button" onClick={() => { setForm(user); setEditing(true); }}>
            <Icon name="user" />
            <span className="lb">{t("profile.personalDetails")}</span>
          </button>
          <Link className="mi" href="/trips">
            <Icon name="map" />
            <span className="lb">{t("nav.trips")}</span>
            <span className="meta">{t("profile.upcomingCount", { n: upcoming })}</span>
          </Link>
          <Link className="mi" href="/saved">
            <Icon name="heart" />
            <span className="lb">{t("saved.sub")}</span>
            <span className="meta">{saved.length}</span>
          </Link>
          <Link className="mi" href="/notifications">
            <Icon name="bell" />
            <span className="lb">{t("profile.notifications")}</span>
          </Link>
          <Link className="mi" href="/legal/privacy">
            <Icon name="award" />
            <span className="lb">{t("profile.privacyTerms")}</span>
          </Link>
        </div>

        <button
          className="btn outline"
          type="button"
          onClick={async () => {
            try { await signOut(); } catch (e) { showToast(e instanceof Error ? e.message : "Could not sign out."); return; }
            showToast(t("toast.signedOut"));
          }}
        >
          {t("auth.signOut")}
        </button>
        <p className="muted center">
          <a href="mailto:hello@9bhk.app">hello@9bhk.app</a>
        </p>
      </div>

      <div className={`scrim${editing ? " is-open" : ""}`} onClick={() => setEditing(false)} />
      <div className={`sheet${editing ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label={t("profile.personalDetails")}>
        <div className="sheet-grab" />
        <div className="sheet-head">
          <h2>{t("profile.personalDetails")}</h2>
        </div>
        {form ? (
          <div className="stack">
            <label className="field">
              {t("profile.fieldFullName")}
              <input className="ctrl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="field">
              {t("profile.fieldEmail")}
              <input type="email" className="ctrl" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <span className="help">{t("profile.fieldEmailHelp")}</span>
            </label>
            <label className="field">
              {t("profile.fieldMobile")}
              <input className="ctrl" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label className="field">
              <span>{t("profile.fieldHomeCity")}</span>
              <select className="ctrl" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                {[...CITIES, "Bengaluru"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <button
              className="btn block"
              type="button"
              onClick={async () => {
                try { await updateUser({ ...form, role: "buyer" }); setEditing(false); showToast(t("toast.savedChanges")); }
                catch (e) { showToast(e instanceof Error ? e.message : "Profile was not saved."); }
              }}
            >
              {t("action.saveChanges")}
            </button>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
