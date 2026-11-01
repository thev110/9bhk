"use client";

import { PortalShell } from "@/components/portal-shell";
import { PortalAuthCard } from "@/components/portal-auth-card";
import { Icon } from "@/components/icon";
import { useStore } from "@/lib/store";

export function AdminGateScreen({ signedInEmail }: { signedInEmail?: string | null }) {
  const { signOut } = useStore();

  return (
    <PortalShell
      portal="admin"
      title="Staff Command Center Gate"
      subtitle="admin.9bhk.app · Zero-Trust Internal Operations"
      navItems={[]}
      activeNav="Overview"
      userEmail={signedInEmail}
      onSignOut={
        signedInEmail
          ? async () => {
              await signOut();
              window.location.reload();
            }
          : undefined
      }
    >
      <div className="portal-hero-grid">
        <div className="card stack" style={{ padding: 24 }}>
          <p className="eyebrow">9BHK INTERNAL OPERATIONS · ADMIN.9BHK.APP</p>
          <h2
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: 30,
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            Four-Portal KYC Desk, Title Verification &amp; Ledger Operations
          </h2>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
            Restricted internal operations console for 9BHK staff. Review RERA Realtor credentials,
            Property Owner title deeds, Buyer proof-of-funds, and Guest identity documents via
            short-lived signed private vault links.
          </p>

          {signedInEmail && (
            <div
              role="alert"
              className="card stack"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                padding: 16,
              }}
            >
              <div className="row" style={{ gap: 8 }}>
                <Icon name="shield" />
                <strong style={{ fontSize: 13.5 }}>
                  Staff Clearance Required ({signedInEmail})
                </strong>
              </div>
              <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
                Your current session is authenticated as <strong>{signedInEmail}</strong>, which is
                not on the 9BHK staff allowlist. Sign out below and sign in with an authorized staff
                account.
              </p>
              <div>
                <button
                  type="button"
                  className="btn outline sm"
                  onClick={async () => {
                    await signOut();
                    window.location.reload();
                  }}
                >
                  Sign Out &amp; Switch Account
                </button>
              </div>
            </div>
          )}

          <div className="portal-feature-grid">
            <div className="card stack" style={{ background: "var(--surface-2)" }}>
              <Icon name="shield" />
              <strong style={{ fontSize: 14 }}>4-Category KYC Desk</strong>
              <p className="muted" style={{ fontSize: 12.5 }}>
                Verify Realtor RERA certificates, Owner title deeds, Buyer proof-of-funds, and Guest
                IDs with 5-minute signed URLs.
              </p>
            </div>
            <div className="card stack" style={{ background: "var(--surface-2)" }}>
              <Icon name="estate" />
              <strong style={{ fontSize: 14 }}>3+ BHK Catalog Gate</strong>
              <p className="muted" style={{ fontSize: 12.5 }}>
                Enforce the 3-document ownership rule before any whole-home estate is published to
                www.9bhk.app.
              </p>
            </div>
            <div className="card stack" style={{ background: "var(--surface-2)" }}>
              <Icon name="terminal" />
              <strong style={{ fontSize: 14 }}>Immutable Audit Log</strong>
              <p className="muted" style={{ fontSize: 12.5 }}>
                Every verification verdict, payout request, and refund review is recorded in
                bhk_admin_audit.
              </p>
            </div>
          </div>
        </div>

        <PortalAuthCard portal="admin" defaultNext="/admin" />
      </div>
    </PortalShell>
  );
}
