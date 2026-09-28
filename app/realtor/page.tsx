"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { Icon } from "@/components/icon";
import { useStore, type RealtorClient } from "@/lib/store";
import { BaseSheet } from "@/components/base-sheet";
import { useCatalog } from "@/lib/catalog";
import { formatInrCrores } from "@/lib/properties";

export default function RealtorPortalPage() {
  const router = useRouter();
  const { clients, addClient, removeClient, presentationMode, setPresentationMode, showToast } = useStore();
  const { properties } = useCatalog();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [agencyName, setAgencyName] = useState("Coromandel Coastal Advisory");
  const [reraNumber, setReraNumber] = useState("TN/AGT/2026/0894");

  // New Client Form State
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [budgetMin, setBudgetMin] = useState(15);
  const [budgetMax, setBudgetMax] = useState(35);
  const [preferredStretch, setPreferredStretch] = useState("ECR · Mahabalipuram Coastal Strip");
  const [garageNeed, setGarageNeed] = useState("Subterranean Collector Vault (<7° Supercar Ramp)");
  const [confidential, setConfidential] = useState(true);
  const [notes, setNotes] = useState("");

  const salesProperties = properties.filter((p) => p.isForSale || p.salePrice);
  const totalMandateValue = clients.reduce((acc, c) => acc + c.budgetMaxCr, 0);

  function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      showToast("Please provide client name and phone number.");
      return;
    }
    const newClient: RealtorClient = {
      id: `client-${Date.now().toString(36)}`,
      name: clientName.trim(),
      phone: clientPhone.trim(),
      email: clientEmail.trim() || undefined,
      budgetMinCr: Number(budgetMin) || 10,
      budgetMaxCr: Number(budgetMax) || 30,
      preferredStretch,
      garageNeed,
      confidential,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString().split("T")[0],
    };
    addClient(newClient);
    showToast(`Client "${newClient.name}" onboarded. Commission rights locked.`);
    setAddModalOpen(false);
    // Reset form
    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setNotes("");
  }

  return (
    <Shell>
      <PageBar
        title="Realtor Portal"
        backHref="/buy"
        right={
          <button
            className={`btn sm ${presentationMode ? "accent" : "outline"}`}
            type="button"
            onClick={() => {
              const next = !presentationMode;
              setPresentationMode(next);
              showToast(next ? "Presentation Mode Activated: Direct owner contacts hidden." : "Presentation Mode Deactivated.");
            }}
          >
            {presentationMode ? "Presentation Active" : "Presentation Mode"}
          </button>
        }
      />

      {/* Header Banner */}
      <header className="page-head">
        <div className="between">
          <p className="eyebrow">Broker & Agency Workspace</p>
          <span className="pill ok">RERA Verified</span>
        </div>
        <h1 style={{ fontSize: 32, marginTop: 4 }}>Client Onboarding & Mandates</h1>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>
          {agencyName} · RERA #{reraNumber}
        </p>
      </header>

      {/* Presentation Mode Status Banner (if active) */}
      {presentationMode ? (
        <div className="pad mt">
          <div className="card" style={{ background: "color-mix(in oklch, var(--accent) 12%, var(--surface))", border: "1px solid var(--accent)" }}>
            <div className="between">
              <div>
                <strong>Client Presentation Mode is Live</strong>
                <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  Direct host contacts and internal margins are masked. When you present listings to your client, your agency credentials will appear.
                </p>
              </div>
              <button className="btn outline sm" type="button" onClick={() => setPresentationMode(false)}>
                Disable
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Performance & Mandate Metrics */}
      <div className="stats pad mt">
        <div className="stat">
          <p className="lb">
            <Icon name="users" />
            Onboarded Clients
          </p>
          <p className="nb">{clients.length}</p>
          <p className="sub">Lead lock guaranteed</p>
        </div>
        <div className="stat">
          <p className="lb">
            <Icon name="wallet" />
            Active Mandates
          </p>
          <p className="nb">₹{totalMandateValue} Cr</p>
          <p className="sub">Total buying power</p>
        </div>
        <div className="stat">
          <p className="lb">
            <Icon name="home" />
            Coastal Holdings
          </p>
          <p className="nb">{salesProperties.length}</p>
          <p className="sub">Direct beachfront estates</p>
        </div>
        <div className="stat">
          <p className="lb">
            <Icon name="shield" />
            Co-Broking Fee
          </p>
          <p className="nb">2.0%</p>
          <p className="sub">Standard locked split</p>
        </div>
      </div>

      {/* Client Roster Management */}
      <div className="pad mt">
        <div className="between">
          <div>
            <h2>Private Client Roster</h2>
            <p className="muted" style={{ fontSize: 12 }}>
              Clients onboarded here are cryptographically bound to your agency profile.
            </p>
          </div>
          <button className="btn sm" type="button" onClick={() => setAddModalOpen(true)}>
            + Onboard Client
          </button>
        </div>

        <div className="stack mt">
          {clients.map((client) => (
            <article key={client.id} className="card" style={{ padding: 16 }}>
              <div className="between">
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800 }}>{client.name}</h3>
                  <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                    {client.phone} {client.email ? `· ${client.email}` : ""}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="pill info" style={{ fontWeight: 800, fontSize: 11 }}>
                    ₹{client.budgetMinCr} - ₹{client.budgetMaxCr} Cr
                  </span>
                  {client.confidential ? (
                    <div style={{ marginTop: 4 }}>
                      <span className="pill warn" style={{ fontSize: 10 }}>NDA Protected</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt" style={{ paddingTop: 10, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 6 }}>
                <p style={{ fontSize: 12.5, margin: 0 }}>
                  <strong style={{ color: "var(--moss)" }}>Corridor:</strong> {client.preferredStretch}
                </p>
                <p style={{ fontSize: 12.5, margin: 0 }}>
                  <strong style={{ color: "var(--moss)" }}>Automotive Need:</strong> {client.garageNeed}
                </p>
                {client.notes ? (
                  <p className="muted" style={{ fontSize: 12, fontStyle: "italic", margin: "4px 0 0" }}>
                    &ldquo;{client.notes}&rdquo;
                  </p>
                ) : null}
              </div>

              <div className="between mt" style={{ paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                <span className="tiny">Added on {client.createdAt}</span>
                <div className="row" style={{ gap: 6 }}>
                  <button
                    className="btn outline sm"
                    type="button"
                    onClick={() => {
                      setPresentationMode(true);
                      router.push("/buy");
                    }}
                  >
                    Present Holdings
                  </button>
                  <button
                    className="btn ghost sm"
                    type="button"
                    style={{ color: "var(--danger)" }}
                    onClick={() => {
                      removeClient(client.id);
                      showToast(`Removed client ${client.name}`);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Listing Action for Realtors */}
      <section className="pad mt" style={{ marginBottom: 30 }}>
        <div className="card" style={{ background: "var(--surface-2)" }}>
          <h3>Representing a coastal estate seller?</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            List your client&apos;s beachfront property with verified title documentation, garage specs, and exclusive co-broking visibility.
          </p>
          <div className="row mt">
            <Link href="/host/new?mode=sale" className="btn sm">
              List Property for Sale
            </Link>
            <Link href="/buy" className="btn outline sm">
              View All Holdings
            </Link>
          </div>
        </div>
      </section>

      {/* Modal: Onboard Client Form */}
      <BaseSheet
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        title="Onboard Private Client"
      >
        <form className="stack" onSubmit={handleCreateClient}>
          <p className="muted" style={{ fontSize: 13 }}>
            Onboarding binds this buyer mandate to your agency ID, safeguarding your co-broking commission across all 9bhk coastal estates.
          </p>
          <label className="field">
            <span>Client Full Name / Entity Alias</span>
            <input
              className="ctrl"
              type="text"
              placeholder="e.g. Vikramaditya K or Sovereign Family Trust"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Direct Phone / WhatsApp</span>
            <input
              className="ctrl"
              type="tel"
              placeholder="+91 98400 00000"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Direct Email (Optional)</span>
            <input
              className="ctrl"
              type="email"
              placeholder="principal@capital.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </label>

          <div className="between">
            <label className="field" style={{ flex: 1 }}>
              <span>Min Budget (₹ Cr)</span>
              <input
                className="ctrl"
                type="number"
                min="5"
                max="100"
                value={budgetMin}
                onChange={(e) => setBudgetMin(Number(e.target.value))}
              />
            </label>
            <label className="field" style={{ flex: 1 }}>
              <span>Max Budget (₹ Cr)</span>
              <input
                className="ctrl"
                type="number"
                min="5"
                max="150"
                value={budgetMax}
                onChange={(e) => setBudgetMax(Number(e.target.value))}
              />
            </label>
          </div>

          <label className="field">
            <span>Preferred Coastal Stretch</span>
            <select
              className="ctrl"
              value={preferredStretch}
              onChange={(e) => setPreferredStretch(e.target.value)}
            >
              <option value="ECR · Mahabalipuram Coastal Strip">ECR · Mahabalipuram Coastal Strip</option>
              <option value="Neelankarai & Palavakkam Beach Front">Neelankarai & Palavakkam Beach Front</option>
              <option value="Kovalam & Muttukadu Dune Edge">Kovalam & Muttukadu Dune Edge</option>
              <option value="Pondicherry & Auroville Oceanfront">Pondicherry & Auroville Oceanfront</option>
            </select>
          </label>

          <label className="field">
            <span>Automotive & Garage Requirement</span>
            <select
              className="ctrl"
              value={garageNeed}
              onChange={(e) => setGarageNeed(e.target.value)}
            >
              <option value="Subterranean Collector Vault (<7° Supercar Ramp)">
                Subterranean Collector Vault (&lt;7° Supercar Ramp)
              </option>
              <option value="Beach & Marine Port (Jet Ski / Boat Trailer Slip)">
                Beach & Marine Port (Jet Ski / Boat Trailer Slip)
              </option>
              <option value="Executive EV Pavilion (High Output 22-50kW Chargers)">
                Executive EV Pavilion (High Output 22-50kW Chargers)
              </option>
              <option value="Coastal Teak Portico (Shaded Pergola for Cruisers)">
                Coastal Teak Portico (Shaded Pergola for Cruisers)
              </option>
            </select>
          </label>

          <div
            className="checkline"
            onClick={() => setConfidential(!confidential)}
            style={{ cursor: "pointer" }}
          >
            <div className="box" aria-checked={confidential}>
              {confidential ? <Icon name="check" style={{ color: "var(--on-primary)" }} /> : null}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Enforce Buyer NDA & Confidentiality</span>
          </div>

          <label className="field">
            <span>Mandate Notes & Vehicle Types</span>
            <textarea
              className="ctrl"
              rows={2}
              placeholder="e.g. Collector of vintage Italian sports cars; requires zero salt mist intrusion..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <div className="between mt">
            <span className="pill forest">Lead Lock Active</span>
            <button className="btn accent" type="submit">
              Complete Onboarding
            </button>
          </div>
        </form>
      </BaseSheet>
    </Shell>
  );
}
