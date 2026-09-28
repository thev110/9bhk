"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "./icon";
import { useStore } from "@/lib/store";

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
  const on = isSaved(id);
  return (
    <button
      className={`fav${small ? " sm" : ""}${on ? " is-fav" : ""}`}
      type="button"
      aria-pressed={on}
      aria-label={`${on ? "Remove" : "Save"} ${name}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSaved(id);
        showToast(on ? `Removed ${name}` : `Saved ${name}`);
      }}
    >
      <Icon name="heart" className="ico h-line" />
      <Icon name="heart-fill" className="ico h-fill" />
    </button>
  );
}

export function TabBar({ current }: { current: "explore" | "buy" | "saved" | "trips" | "profile" }) {
  const items = [
    { id: "explore", href: "/", label: "Stays", icon: "compass" },
    { id: "buy", href: "/buy", label: "Buy", icon: "key" },
    { id: "saved", href: "/saved", label: "Wishlists", icon: "heart" },
    { id: "trips", href: "/trips", label: "Trips", icon: "map" },
    { id: "profile", href: "/profile", label: "Profile", icon: "user" },
  ] as const;
  return (
    <nav className="tabbar" aria-label="Primary">
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
  return (
    <header className="appbar">
      <div className="appbar-inner">
        <Link href="/" className="brand">
          <span className="brand-mark" style={{ overflow: "hidden", padding: 0 }}>
            <img src="/logo-mark.png" width={36} height={36} alt="" style={{ width: 36, height: 36, display: "block" }} />
          </span>
          <span className="brand-name">9bhk.app</span>
        </Link>
        <button className="loc-btn" type="button" onClick={onLocation} aria-label={`Change location, currently ${city}`}>
          <Icon name="pin" />
          {city}
          <Icon name="chev" className="chev" />
        </button>
      </div>
    </header>
  );
}

export function PageBar({
  title,
  backHref,
  right,
}: {
  title: string;
  backHref?: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="appbar">
      <div className="appbar-inner">
        {backHref ? (
          <Link href={backHref} className="icon-btn" aria-label="Back">
            <Icon name="back" />
          </Link>
        ) : (
          <button className="icon-btn" type="button" aria-label="Back" onClick={() => router.back()}>
            <Icon name="back" />
          </button>
        )}
        <h1 className="bar-title">{title}</h1>
        {right ?? <span className="bar-spacer" />}
      </div>
    </header>
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
    <div className="app">
      <main className={contentClass}>{children}</main>
      {nav ? <TabBar current={nav} /> : null}
    </div>
  );
}
