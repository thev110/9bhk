"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "./icon";
import { Toast } from "./shell";

export type SpecializedPortalId = "realtor" | "owners" | "admin";

export interface PortalNavItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
}

const PORTAL_META: Record<
  SpecializedPortalId,
  {
    host: string;
    brandTitle: string;
    brandSubtitle: string;
    emblemIcon: string;
    securityNote: string;
  }
> = {
  realtor: {
    host: "realtor.9bhk.app",
    brandTitle: "9bhk Realtor Desk",
    brandSubtitle: "RERA Broker & Co-Broking Terminal",
    emblemIcon: "briefcase",
    securityNote: "RERA-verified co-broking ledger (bps splits) & private buyer mandates.",
  },
  owners: {
    host: "owners.9bhk.app",
    brandTitle: "9bhk Estate Owners",
    brandSubtitle: "3+ BHK Host & Seller Vault",
    emblemIcon: "estate",
    securityNote: "Title-verified 3+ BHK whole-property vault, stays, and formal sale offers.",
  },
  admin: {
    host: "admin.9bhk.app",
    brandTitle: "9bhk Staff Command",
    brandSubtitle: "Compliance, KYC & Escrow Ops",
    emblemIcon: "terminal",
    securityNote: "Zero-trust staff console. All KYC & listing approvals are audit-logged.",
  },
};

export function PortalShell({
  portal,
  title,
  subtitle,
  navItems,
  activeNav,
  statusBadge,
  headerActions,
  userEmail,
  userName,
  onSignOut,
  children,
}: {
  portal: SpecializedPortalId;
  title: string;
  subtitle?: string;
  navItems: PortalNavItem[];
  activeNav: string;
  statusBadge?: React.ReactNode;
  headerActions?: React.ReactNode;
  userEmail?: string | null;
  userName?: string | null;
  onSignOut?: () => void;
  children: React.ReactNode;
}) {
  const meta = PORTAL_META[portal];

  return (
    <div className="portal-shell" data-portal={portal}>
      {/* Windows / Desktop Left Sidebar (>= 1024px) */}
      <aside className="portal-sidebar" aria-label={`${meta.brandTitle} workspace navigation`}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
            <div className="portal-emblem" aria-hidden="true">
              <Icon name={meta.emblemIcon} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="portal-domain-pill">{meta.host}</div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 700, color: "var(--fg)", lineHeight: 1.15 }}>
                {meta.brandTitle}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{meta.brandSubtitle}</div>
            </div>
          </div>

          {navItems.length > 0 && (
            <nav className="portal-nav-list" aria-label={`${meta.brandTitle} primary sections`}>
              {navItems.map((item) => {
                const isActive = item.id === activeNav;
                const content = (
                  <>
                    <span className="portal-nav-btn-left">
                      <Icon name={item.icon} />
                      <span>{item.label}</span>
                    </span>
                    {item.badge !== undefined && item.badge !== null && item.badge !== "" ? (
                      <span className="portal-nav-badge">{item.badge}</span>
                    ) : null}
                  </>
                );

                if (item.href && !item.onClick) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`portal-nav-btn${isActive ? " is-active" : ""}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    className={`portal-nav-btn${isActive ? " is-active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {content}
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
          {userEmail ? (
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--moss)" }}>
                Active Session
              </div>
              {userName ? (
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--fg)", marginTop: 2 }}>{userName}</div>
              ) : null}
              <div
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {userEmail}
              </div>
              {onSignOut ? (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="btn btn-sm btn-ghost"
                  style={{ width: "100%", marginTop: 10, justifyContent: "center" }}
                >
                  <Icon name="log-out" style={{ width: 15, height: 15 }} />
                  Sign out of {meta.host}
                </button>
              ) : null}
            </div>
          ) : null}

          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              fontSize: 11.5,
              color: "var(--muted)",
              lineHeight: 1.45,
            }}
          >
            <div style={{ fontWeight: 800, color: "var(--fg)", marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="shield" style={{ width: 14, height: 14, color: "var(--portal-accent, var(--primary))" }} />
              Isolated Portal Boundary
            </div>
            {meta.securityNote}
          </div>
        </div>
      </aside>

      {/* Main Responsive Workspace */}
      <div className="portal-workspace">
        <header className="portal-topbar">
          <div className="portal-topbar-inner">
            <div className="portal-topbar-title">
              <div className="portal-emblem" aria-hidden="true">
                <Icon name={meta.emblemIcon} />
              </div>
              <div className="portal-heading-wrap">
                <div className="portal-domain-pill">
                  <span>{meta.host}</span>
                  {statusBadge ? <span>·</span> : null}
                  {statusBadge}
                </div>
                <h1 className="portal-h1">{title}</h1>
                {subtitle ? <p className="portal-subtitle">{subtitle}</p> : null}
              </div>
            </div>

            <div className="portal-topbar-actions">
              {headerActions}
              {userEmail && onSignOut ? (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="btn btn-sm btn-outline"
                  aria-label="Sign out"
                >
                  <Icon name="log-out" style={{ width: 15, height: 15 }} />
                  <span>Sign out</span>
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <main className="portal-canvas">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar (< 1024px) */}
      {navItems.length > 0 && (
        <nav className="portal-bottom-nav" aria-label={`${meta.brandTitle} mobile navigation`}>
          {navItems.map((item) => {
            const isActive = item.id === activeNav;
            const inner = (
              <>
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </>
            );

            if (item.href && !item.onClick) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`portal-bottom-tab${isActive ? " is-active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {inner}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`portal-bottom-tab${isActive ? " is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {inner}
              </button>
            );
          })}
        </nav>
      )}

      <Toast />
    </div>
  );
}
