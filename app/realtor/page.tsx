"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { Icon } from "@/components/icon";
import { useStore, type RealtorClient } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { BaseSheet } from "@/components/base-sheet";
import { useCatalog } from "@/lib/catalog";
import { formatInrCrores } from "@/lib/properties";

export default function RealtorPortalPage() {
  const router = useRouter();
  const { clients, addClient, removeClient, presentationMode, setPresentationMode, showToast } = useStore();
  const t = useT();
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
      showToast(t("realtor.toastNeedNamePhone"));
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
    showToast(t("realtor.toastClientOnboarded", { name: newClient.name }));
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
        title={t("realtor.portalTitle")}
        backHref="/buy"
        right={
          <button
            className={`btn sm ${presentationMode ? "accent" : "outline"}`}
            type="button"
            onClick={() => {
              const next = !presentationMode;
              setPresentationMode(next);
              showToast(next ? t("realtor.toastPresentationOn") : t("realtor.toastPresentationOff"));
            }}
          >
            {presentationMode ? t("realtor.presentationActive") : t("realtor.presentationMode")}
          </button>
        }
      />

      {/* Header Banner */}
      <header className="page-head">
        <div className="between">
          <p className="eyebrow">{t("realtor.workspaceEyebrow")}</p>
          <span className="pill ok">{t("realtor.reraVerified")}</span>
        </div>
        <h1 style={{ fontSize: 32, marginTop: 4 }}>{t("realtor.mandatesTitle")}</h1>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>
          {agencyName}{t("realtor.agencyRera", { rera: reraNumber })}
        </p>
      </header>

      {/* Presentation Mode Status Banner (if active) */}
      {presentationMode ? (
        <div className="pad mt">
          <div className="card" style={{ background: "color-mix(in oklch, var(--accent) 12%, var(--surface))", border: "1px solid var(--accent)" }}>
            <div className="between">
              <div>
                <strong>{t("realtor.presentationLive")}</strong>
                <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {t("realtor.presentationLiveBody")}
                </p>
              </div>
              <button className="btn outline sm" type="button" onClick={() => setPresentationMode(false)}>
                {t("realtor.presentationDisable")}
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
            {t("realtor.statOnboardedClients")}
          </p>
          <p className="nb">{clients.length}</p>
          <p className="sub">{t("realtor.statLeadLock")}</p>
        </div>
        <div className="stat">
          <p className="lb">
            <Icon name="wallet" />
            {t("realtor.statActiveMandates")}
          </p>
          <p className="nb">₹{totalMandateValue} Cr</p>
          <p className="sub">{t("realtor.statTotalBuyingPower")}</p>
        </div>
        <div className="stat">
          <p className="lb">
            <Icon name="home" />
            {t("realtor.statCoastalHoldings")}
          </p>
          <p className="nb">{salesProperties.length}</p>
          <p className="sub">{t("realtor.statBeachfrontEstates")}</p>
        </div>
        <div className="stat">
          <p className="lb">
            <Icon name="shield" />
            {t("realtor.statCoBrokingFee")}
          </p>
          <p className="nb">2.0%</p>
          <p className="sub">{t("realtor.statLockedSplit")}</p>
        </div>
      </div>

      {/* Client Roster Management */}
      <div className="pad mt">
        <div className="between">
          <div>
            <h2>{t("realtor.rosterTitle")}</h2>
            <p className="muted" style={{ fontSize: 12 }}>
              {t("realtor.rosterBody")}
            </p>
          </div>
          <button className="btn sm" type="button" onClick={() => setAddModalOpen(true)}>
            {t("realtor.onboardClient")}
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
                      <span className="pill warn" style={{ fontSize: 10 }}>{t("realtor.ndaProtected")}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt" style={{ paddingTop: 10, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 6 }}>
                <p style={{ fontSize: 12.5, margin: 0 }}>
                  <strong style={{ color: "var(--moss)" }}>{t("realtor.labelCorridor")}</strong> {client.preferredStretch}
                </p>
                <p style={{ fontSize: 12.5, margin: 0 }}>
                  <strong style={{ color: "var(--moss)" }}>{t("realtor.labelAutomotiveNeed")}</strong> {client.garageNeed}
                </p>
                {client.notes ? (
                  <p className="muted" style={{ fontSize: 12, fontStyle: "italic", margin: "4px 0 0" }}>
                    &ldquo;{client.notes}&rdquo;
                  </p>
                ) : null}
              </div>

              <div className="between mt" style={{ paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                <span className="tiny">{t("realtor.addedOn", { date: client.createdAt })}</span>
                <div className="row" style={{ gap: 6 }}>
                  <button
                    className="btn outline sm"
                    type="button"
                    onClick={() => {
                      setPresentationMode(true);
                      router.push("/buy");
                    }}
                  >
                    {t("realtor.presentHoldings")}
                  </button>
                  <button
                    className="btn ghost sm"
                    type="button"
                    style={{ color: "var(--danger)" }}
                    onClick={() => {
                      removeClient(client.id);
                      showToast(t("realtor.toastClientRemoved", { name: client.name }));
                    }}
                  >
                    {t("realtor.removeClient")}
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
          <h3>{t("realtor.sellerPrompt")}</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            {t("realtor.sellerBody")}
          </p>
          <div className="row mt">
            <Link href="/host/new?mode=sale" className="btn sm">
              {t("realtor.listForSale")}
            </Link>
            <Link href="/buy" className="btn outline sm">
              {t("realtor.viewAllHoldings")}
            </Link>
          </div>
        </div>
      </section>

      {/* Modal: Onboard Client Form */}
      <BaseSheet
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        title={t("realtor.sheetOnboardTitle")}
      >
        <form className="stack" onSubmit={handleCreateClient}>
          <p className="muted" style={{ fontSize: 13 }}>
            {t("realtor.sheetBody")}
          </p>
          <label className="field">
            <span>{t("realtor.fieldClientName")}</span>
            <input
              className="ctrl"
              type="text"
              placeholder={t("realtor.clientNamePlaceholder")}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>{t("realtor.fieldPhone")}</span>
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
            <span>{t("realtor.fieldEmailOptional")}</span>
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
              <span>{t("realtor.fieldMinBudget")}</span>
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
              <span>{t("realtor.fieldMaxBudget")}</span>
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
            <span>{t("realtor.fieldCoastalStretch")}</span>
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
            <span>{t("realtor.fieldGarageNeed")}</span>
            <select
              className="ctrl"
              value={garageNeed}
              onChange={(e) => setGarageNeed(e.target.value)}
            >
              <option value="Subterranean Collector Vault (<7° Supercar Ramp)">
                {t("realtor.optionCollectorVault")}
              </option>
              <option value="Beach & Marine Port (Jet Ski / Boat Trailer Slip)">
                {t("realtor.optionMarinePort")}
              </option>
              <option value="Executive EV Pavilion (High Output 22-50kW Chargers)">
                {t("realtor.optionEvPavilion")}
              </option>
              <option value="Coastal Teak Portico (Shaded Pergola for Cruisers)">
                {t("realtor.optionTeakPortico")}
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
            <span style={{ fontSize: 13, fontWeight: 600 }}>{t("realtor.enforceNda")}</span>
          </div>

          <label className="field">
            <span>{t("realtor.fieldMandateNotes")}</span>
            <textarea
              className="ctrl"
              rows={2}
              placeholder={t("realtor.mandateNotesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <div className="between mt">
            <span className="pill forest">{t("realtor.leadLockActive")}</span>
            <button className="btn accent" type="submit">
              {t("realtor.completeOnboarding")}
            </button>
          </div>
        </form>
      </BaseSheet>
    </Shell>
  );
}
