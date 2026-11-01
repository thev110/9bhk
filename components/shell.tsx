"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./icon";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export function FavButton({
  id,
  name,
  small,
}: {
  id: string;
  name: string;
  small?: boolean;
}) {
  const { isSaved, toggleSaved, showToast } = useStore();
  const t = useT();
  const on = isSaved(id);
  const [saving, setSaving] = useState(false);
  return (
    <button
      className={`fav${small ? " sm" : ""}${on ? " is-fav" : ""}`}
      type="button"
      disabled={saving}
      aria-pressed={on}
      aria-label={t(on ? "a11y.removeName" : "a11y.saveName", { name })}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (saving) return;
        setSaving(true);
        try {
          await toggleSaved(id);
          showToast(t(on ? "toast.removed" : "toast.saved", { name }));
        } catch (error) {
          showToast(error instanceof Error ? error.message : "Could not save this property.");
        } finally { setSaving(false); }
      }}
    >
      <Icon name="heart" className="ico h-line" />
      <Icon name="heart-fill" className="ico h-fill" />
    </button>
  );
}

export function TabBar({ current }: { current: "explore" | "buy" | "saved" | "trips" | "profile" }) {
  const t = useT();
  const items = [
    { id: "explore", href: "/", label: t("nav.explore"), icon: "compass" },
    { id: "buy", href: "/buy", label: t("nav.buy"), icon: "key" },
    { id: "saved", href: "/saved", label: t("nav.saved"), icon: "heart" },
    { id: "trips", href: "/trips", label: t("nav.trips"), icon: "map" },
    { id: "profile", href: "/profile", label: t("nav.profile"), icon: "user" },
  ] as const;
  return (
    <nav className="tabbar" aria-label={t("nav.primary")}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="tab"
          aria-current={current === item.id ? "page" : undefined}
        >
          <Icon name={item.icon} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function Toast() {
  const { toast } = useStore();
  return (
    <div className={`toast${toast ? " show" : ""}`} role="status" aria-live="polite">
      {toast}
    </div>
  );
}

export function BrandBar({ onLocation }: { onLocation: () => void }) {
  const { city } = useStore();
  const t = useT();
  return (
    <header className="appbar">
      <div className="appbar-inner">
        <Link href="/" className="brand">
          <span className="brand-mark" style={{ overflow: "hidden", padding: 0 }}>
            {/*
            `next/image` rather than a raw `<img>`. The source PNG is 1.8 MB and
            this renders at 36 px, so the optimiser turns a 1.8 MB header
            download into a couple of kilobytes. `alt=""` is correct: the
            adjacent wordmark already names the brand, so this is decorative.
          */}
          <Image
            src="/logo-mark.png"
            width={36}
            height={36}
            alt=""
            sizes="36px"
            priority
            quality={80}
          />
          </span>
          <span className="brand-name">9bhk.app</span>
        </Link>
        <button className="loc-btn" type="button" onClick={onLocation} aria-label={t("brand.changeLocation", { city })}>
          <Icon name="pin" />
          {city}
          <Icon name="chev" className="chev" />
        </button>
      </div>
    </header>
  );
}

/**
 * Sticky page bar.
 *
 * `titleAs` exists so a page can opt out of the bar title being a heading.
 * `PageBar` renders its title as an `<h1>` by default, which is correct for the
 * many app screens where the bar title *is* the page's subject. On pages that
 * also carry their own document heading — the legal pages, for instance —
 * passing `titleAs="p"` keeps exactly one `<h1>` on the page instead of two
 * competing ones.
 */
export function PageBar({
  title,
  backHref,
  right,
  titleAs: TitleTag = "h1",
}: {
  title: string;
  backHref?: string;
  right?: React.ReactNode;
  titleAs?: "h1" | "p";
}) {
  const router = useRouter();
  const t = useT();
  return (
    <header className="appbar">
      <div className="appbar-inner">
        {backHref ? (
          <Link href={backHref} className="icon-btn" aria-label={t("nav.back")}>
            <Icon name="back" />
          </Link>
        ) : (
          <button className="icon-btn" type="button" aria-label={t("nav.back")} onClick={() => router.back()}>
            <Icon name="back" />
          </button>
        )}
        <TitleTag className="bar-title">{title}</TitleTag>
        {right ?? <span className="bar-spacer" />}
      </div>
    </header>
  );
}

export function GuestDesktopRail({ current }: { current: "explore" | "buy" | "saved" | "trips" | "profile" }) {
  const t = useT();
  const items = [
    { id: "explore", href: "/", label: t("nav.explore"), icon: "compass" },
    { id: "buy", href: "/buy", label: t("nav.buy"), icon: "key" },
    { id: "saved", href: "/saved", label: t("nav.saved"), icon: "heart" },
    { id: "trips", href: "/trips", label: t("nav.trips"), icon: "map" },
    { id: "profile", href: "/profile", label: t("nav.profile"), icon: "user" },
  ] as const;

  return (
    <aside className="guest-desktop-rail" aria-label="Desktop primary navigation">
      <div>
        <Link href="/" className="guest-rail-brand">
          <span className="brand-mark" style={{ overflow: "hidden", padding: 0 }}>
            <Image
              src="/logo-mark.png"
              width={36}
              height={36}
              alt=""
              sizes="36px"
              priority
              quality={80}
            />
          </span>
          <div>
            <span className="brand-name" style={{ display: "block", lineHeight: 1.1 }}>9bhk.app</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--muted)", letterSpacing: ".06em", textTransform: "uppercase" }}>
              3+ BHK Stays &amp; Estates
            </span>
          </div>
        </Link>
        <nav className="guest-rail-nav" aria-label="Guest navigation">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="guest-rail-link"
              aria-current={current === item.id ? "page" : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="guest-rail-footer">
        <div style={{ fontWeight: 800, color: "var(--fg)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="shield" style={{ width: 14, height: 14, color: "var(--primary)" }} />
          Whole-Property Verified
        </div>
        Private 3+ BHK villas, farmhouses &amp; beach estates across ECR, OMR &amp; coastal corridors.
      </div>
    </aside>
  );
}

export function Shell({
  children,
  nav,
  dock = "none",
}: {
  children: React.ReactNode;
  nav?: "explore" | "buy" | "saved" | "trips" | "profile";
  dock?: "nav" | "bar" | "none";
}) {
  const mode = nav ? "nav" : dock;
  const contentClass = mode === "nav" ? "content" : mode === "bar" ? "content has-bar" : "content no-nav";
  return (
    <div className={`app${nav ? " has-desktop-rail" : ""}`}>
      {nav ? <GuestDesktopRail current={nav} /> : null}
      <main className={contentClass}>{children}</main>
      {nav ? <TabBar current={nav} /> : null}
    </div>
  );
}
