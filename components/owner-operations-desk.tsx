"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { inr } from "@/lib/format";
import {
  decidePropertyMandate,
  listPropertyMandates,
  revokePropertyMandate,
  type MandateCapability,
} from "@/lib/supabase/mandates";
import {
  decidePropertyEdits,
  loadPropertyEditProposals,
} from "@/lib/supabase/seller-approvals";
import {
  decideSalesOffer,
  listSalesOffers,
  reviseSalesOffer,
  submitSalesOffer,
  type SalesOfferTerms,
} from "@/lib/supabase/offers";
import {
  grantSaleDocument,
  readSaleDocument,
  uploadSaleDocument,
} from "@/lib/supabase/document-room";
import { DOCUMENT_ACCEPT_ATTR } from "@/lib/supabase/documents";
import {
  loadMyTrialStays,
  loadTrialStayTerms,
  setTrialStayTerms,
} from "@/lib/supabase/trial-stays";

export type OwnerOperationsDeskProps = {
  mode: "seller" | "buyer";
  isKycVerified: boolean;
  properties: Array<{ id: string; name: string }>;
  onToast: (msg: string) => void;
};

type SellerMandateRow = {
  id: string;
  property_id: string;
  broker_id: string;
  capabilities: MandateCapability[];
  status: string;
  starts_at: string;
  expires_at: string;
};

type EditProposalRow = {
  id: string;
  property_id: string;
  proposer_id: string;
  baseline_hash: string;
  proposed_changes: {
    name?: string;
    description?: string;
    sale_price?: number;
  };
  status: string;
  created_at: string;
};

type SalesOfferRow = {
  id: string;
  property_id: string;
  buyer_id: string;
  status: string;
  current_revision: number;
  updated_at: string;
};

type SalesOfferRevisionRow = {
  offer_id: string;
  revision: number;
  price_paise: number;
  financing: SalesOfferTerms["financing"];
  conditions: string;
  proposed_close_date?: string | null;
  valid_until: string;
};

export function OwnerOperationsDesk({
  mode,
  isKycVerified,
  properties,
  onToast,
}: OwnerOperationsDeskProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    properties[0]?.id ?? "",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [mandates, setMandates] = useState<SellerMandateRow[]>([]);
  const [editProposals, setEditProposals] = useState<EditProposalRow[]>([]);
  const [offers, setOffers] = useState<SalesOfferRow[]>([]);
  const [offerRevisions, setOfferRevisions] = useState<SalesOfferRevisionRow[]>(
    [],
  );

  // Offer submission / counter-offer form state
  const [offerPriceCr, setOfferPriceCr] = useState("12.5");
  const [offerFinancing, setOfferFinancing] =
    useState<SalesOfferTerms["financing"]>("cash_self_reported");
  const [offerConditions, setOfferConditions] = useState(
    "Subject to 14-day legal title inspection in the private document room.",
  );
  const [offerValidUntil, setOfferValidUntil] = useState(() =>
    new Date(Date.now() + 14 * 86400 * 1000).toISOString().slice(0, 16),
  );

  // Document room state
  const [docIdSlug, setDocIdSlug] = useState("title-deed-pack");
  const [docLabel, setDocLabel] = useState(
    "Certified Mother Deed & Encumbrance Certificate",
  );
  const [lastVersionId, setLastVersionId] = useState("");
  const [grantRecipientId, setGrantRecipientId] = useState("");
  const [grantExpiresAt, setGrantExpiresAt] = useState(() =>
    new Date(Date.now() + 7 * 86400 * 1000).toISOString().slice(0, 16),
  );
  const [buyerVersionIdInput, setBuyerVersionIdInput] = useState("");

  // Trial stay terms state
  const [trialCreditInr, setTrialCreditInr] = useState("150000");
  const [trialMinNights, setTrialMinNights] = useState("2");
  const [trialTermsText, setTrialTermsText] = useState(
    "Completed trial-stay booking fee credited toward final sale deed closing within 90 days.",
  );
  const [trialVersion, setTrialVersion] = useState(0);
  const [trialStayCount, setTrialStayCount] = useState(0);

  useEffect(() => {
    if (!selectedPropertyId && properties[0]?.id) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [mandateRows, editData, offerData, trialData] = await Promise.all([
        listPropertyMandates().catch(() => [] as SellerMandateRow[]),
        loadPropertyEditProposals().catch(() => [] as EditProposalRow[]),
        listSalesOffers().catch(() => ({
          offers: [],
          revisions: [],
          events: [],
        })),
        loadMyTrialStays().catch(() => ({
          enrollments: [],
          credits: [],
          events: [],
        })),
      ]);
      setMandates(mandateRows as SellerMandateRow[]);
      setEditProposals(
        (Array.isArray(editData) ? editData : []) as EditProposalRow[],
      );
      setOffers(offerData.offers as SalesOfferRow[]);
      setOfferRevisions(offerData.revisions as SalesOfferRevisionRow[]);
      setTrialStayCount(trialData.enrollments.length);

      if (selectedPropertyId) {
        const terms = await loadTrialStayTerms(selectedPropertyId).catch(
          () => [],
        );
        if (terms[0]?.version) {
          setTrialVersion(Number(terms[0].version));
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load owner & buyer operations records.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  function propertyLabel(propertyId: string) {
    const found = properties.find((p) => p.id === propertyId);
    return found ? found.name : propertyId;
  }

  async function handleMandateDecision(id: string, approve: boolean) {
    if (!isKycVerified) {
      onToast("Complete Owner Title KYC before approving broker mandates.");
      return;
    }
    setBusyId(id);
    try {
      await decidePropertyMandate(id, approve);
      onToast(approve ? "Broker mandate approved." : "Broker mandate declined.");
      await refreshAll();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Could not update mandate.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevokeMandate(id: string) {
    setBusyId(id);
    try {
      await revokePropertyMandate(id);
      onToast("Broker mandate revoked.");
      await refreshAll();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Could not revoke mandate.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleEditDecision(ep: EditProposalRow, approve: boolean) {
    setBusyId(ep.id);
    try {
      await decidePropertyEdits(
        ep.id,
        ep.baseline_hash,
        approve,
        approve
          ? "Owner approved broker proposed edits."
          : "Owner declined proposed edits.",
      );
      onToast(
        approve
          ? "Listing edit proposal approved."
          : "Listing edit proposal rejected.",
      );
      await refreshAll();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Could not decide edit proposal.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleSubmitOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!isKycVerified) {
      onToast(
        "Complete Buyer Proof-of-Funds KYC before submitting a formal acquisition offer.",
      );
      return;
    }
    if (!selectedPropertyId) {
      onToast("Select an estate first.");
      return;
    }
    const crores = Number(offerPriceCr);
    if (!Number.isFinite(crores) || crores <= 0) {
      onToast("Enter a valid offer amount in Crores.");
      return;
    }
    const pricePaise = Math.round(crores * 10000000) * 100;
    setBusyId("submit-offer");
    try {
      await submitSalesOffer(selectedPropertyId, {
        pricePaise,
        financing: offerFinancing,
        conditions: offerConditions.trim(),
        validUntil: new Date(offerValidUntil).toISOString(),
      });
      onToast("Formal acquisition offer submitted in integer paise.");
      await refreshAll();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Could not submit sales offer.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleOfferDecision(
    offer: SalesOfferRow,
    action: "accepted" | "rejected" | "withdrawn",
  ) {
    if (action === "accepted" && !isKycVerified) {
      onToast("Complete KYC verification before accepting formal offers.");
      return;
    }
    setBusyId(offer.id);
    try {
      await decideSalesOffer(
        offer.id,
        offer.current_revision,
        action,
        `Offer ${action} at revision v${offer.current_revision}.`,
      );
      onToast(`Offer marked as ${action}.`);
      await refreshAll();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Could not update offer status.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleCounterOffer(offer: SalesOfferRow) {
    if (!isKycVerified) {
      onToast("Complete KYC verification before submitting a counter-offer.");
      return;
    }
    const crores = Number(offerPriceCr);
    if (!Number.isFinite(crores) || crores <= 0) {
      onToast("Enter a valid counter-offer amount in Crores.");
      return;
    }
    const pricePaise = Math.round(crores * 10000000) * 100;
    setBusyId(offer.id);
    try {
      await reviseSalesOffer(offer.id, offer.current_revision, {
        pricePaise,
        financing: offerFinancing,
        conditions: offerConditions.trim(),
        validUntil: new Date(offerValidUntil).toISOString(),
      });
      onToast("Counter-offer revision recorded.");
      await refreshAll();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Could not submit counter-offer.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleUploadRoomDoc(file: File | undefined) {
    if (!file || !selectedPropertyId) return;
    setBusyId("upload-doc");
    try {
      const versionId = await uploadSaleDocument({
        propertyId: selectedPropertyId,
        documentId: docIdSlug.trim() || "title-pack",
        label: docLabel.trim() || file.name,
        file,
      });
      setLastVersionId(versionId);
      onToast(`Document uploaded to private vault (Version ID: ${versionId}).`);
    } catch (err) {
      onToast(
        err instanceof Error
          ? err.message
          : "Could not upload sale document.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleGrantDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!isKycVerified) {
      onToast(
        "Complete Owner KYC verification before releasing private document room grants.",
      );
      return;
    }
    if (!lastVersionId.trim() || !grantRecipientId.trim()) {
      onToast("Provide both Document Version UUID and Recipient UUID.");
      return;
    }
    setBusyId("grant-doc");
    try {
      await grantSaleDocument(
        lastVersionId.trim(),
        grantRecipientId.trim(),
        new Date(grantExpiresAt).toISOString(),
        true,
      );
      onToast("Time-boxed document room access granted.");
      setGrantRecipientId("");
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Could not grant document access.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleBuyerOpenDoc() {
    if (!buyerVersionIdInput.trim()) {
      onToast("Enter the Document Version UUID shared by the seller or broker.");
      return;
    }
    setBusyId("open-buyer-doc");
    try {
      const blob = await readSaleDocument(buyerVersionIdInput.trim(), false);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      onToast(
        err instanceof Error
          ? err.message
          : "Could not open watermarked sale document.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveTrialTerms(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPropertyId) return;
    const creditPaise = Math.round(Number(trialCreditInr) || 0) * 100;
    setBusyId("save-trial");
    try {
      const nextVer = await setTrialStayTerms(
        selectedPropertyId,
        trialVersion,
        {
          enabled: true,
          terms: trialTermsText.trim(),
          creditPaise,
          minNights: Number(trialMinNights) || 2,
          validUntil: new Date(Date.now() + 180 * 86400 * 1000).toISOString(),
          creditValidDays: 90,
        },
      );
      setTrialVersion(nextVer);
      onToast(`Trial-stay purchase credit terms published (v${nextVer}).`);
    } catch (err) {
      onToast(
        err instanceof Error
          ? err.message
          : "Could not save trial-stay credit terms.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section
      className="stack"
      aria-label={
        mode === "seller"
          ? "Property Owner Operations Desk"
          : "Buyer Acquisition & Offer Desk"
      }
    >
      <div className="card stack">
        <div className="between wrap">
          <div>
            <span className="pill forest">
              {mode === "seller"
                ? "Owner Control Desk · owners.9bhk.app"
                : "Buyer Deal Desk · owners.9bhk.app"}
            </span>
            <h3 style={{ fontSize: 18, marginTop: 6 }}>
              {mode === "seller"
                ? "Mandates, Edit Approvals, Offers & Private Document Room"
                : "Formal Acquisition Offers, Private Vault & Trial Stays"}
            </h3>
          </div>
          {properties.length > 0 && (
            <label className="field" style={{ minWidth: 220 }}>
              <span>Active Estate</span>
              <select
                className="ctrl"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {error && (
          <p role="alert" style={{ color: "var(--danger)", fontSize: 12.5 }}>
            {error}
          </p>
        )}
      </div>

      {mode === "seller" && (
        <>
          {/* 1. Broker Mandate Approvals */}
          <div className="card stack">
            <div className="between wrap">
              <h3>1. Broker Mandate Requests ({mandates.length})</h3>
              <span className="pill info">Capability-Scoped</span>
            </div>
            {loading ? (
              <p className="muted">Loading broker mandate requests…</p>
            ) : mandates.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                No pending or active broker mandates yet.
              </p>
            ) : (
              mandates.map((m) => (
                <article
                  key={m.id}
                  className="card stack"
                  style={{ background: "var(--surface-2)", padding: 12 }}
                >
                  <div className="between wrap">
                    <strong>
                      {propertyLabel(m.property_id)} · Broker{" "}
                      {m.broker_id.slice(0, 8)}
                    </strong>
                    <span className="pill">{m.status}</span>
                  </div>
                  <div className="row wrap" style={{ gap: 6 }}>
                    {(m.capabilities ?? []).map((cap) => (
                      <span key={cap} className="pill" style={{ fontSize: 11 }}>
                        {cap}
                      </span>
                    ))}
                  </div>
                  <div className="row wrap" style={{ gap: 8 }}>
                    <button
                      type="button"
                      className="btn sm"
                      disabled={busyId === m.id}
                      onClick={() => void handleMandateDecision(m.id, true)}
                    >
                      Approve Mandate
                    </button>
                    <button
                      type="button"
                      className="btn outline sm"
                      disabled={busyId === m.id}
                      onClick={() => void handleMandateDecision(m.id, false)}
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      className="btn ghost sm"
                      style={{ color: "var(--danger)" }}
                      disabled={busyId === m.id}
                      onClick={() => void handleRevokeMandate(m.id)}
                    >
                      Revoke
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* 2. Broker Listing Edit Proposals */}
          <div className="card stack">
            <div className="between wrap">
              <h3>2. Listing Edit Proposals ({editProposals.length})</h3>
              <span className="pill">Baseline-Hash Guarded</span>
            </div>
            {editProposals.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                No pending broker edit proposals. Brokers cannot modify your
                public listing without your explicit approval.
              </p>
            ) : (
              editProposals.map((ep) => (
                <article
                  key={ep.id}
                  className="card stack"
                  style={{ background: "var(--surface-2)", padding: 12 }}
                >
                  <div className="between wrap">
                    <strong>{propertyLabel(ep.property_id)}</strong>
                    <span className="pill">{ep.status}</span>
                  </div>
                  <p className="muted" style={{ fontSize: 12 }}>
                    Proposed changes: {JSON.stringify(ep.proposed_changes)}
                  </p>
                  <div className="row wrap" style={{ gap: 8 }}>
                    <button
                      type="button"
                      className="btn sm"
                      disabled={busyId === ep.id}
                      onClick={() => void handleEditDecision(ep, true)}
                    >
                      Approve Changes
                    </button>
                    <button
                      type="button"
                      className="btn outline sm"
                      disabled={busyId === ep.id}
                      onClick={() => void handleEditDecision(ep, false)}
                    >
                      Reject Changes
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* 3. Private Legal Document Vault & Grants */}
          <div className="card stack">
            <div className="between wrap">
              <h3>3. Private Sale Document Room & Access Grants</h3>
              <span className="pill forest">Watermarked & Time-Boxed</span>
            </div>
            <div className="stats">
              <label className="field">
                <span>Document Slot Slug</span>
                <input
                  className="ctrl"
                  value={docIdSlug}
                  onChange={(e) => setDocIdSlug(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Document Title</span>
                <input
                  className="ctrl"
                  value={docLabel}
                  onChange={(e) => setDocLabel(e.target.value)}
                />
              </label>
            </div>
            <div className="row wrap" style={{ gap: 8 }}>
              <label className="btn outline sm" style={{ cursor: "pointer" }}>
                <span>
                  {busyId === "upload-doc"
                    ? "Uploading…"
                    : "Upload Legal Document Version"}
                </span>
                <input
                  type="file"
                  accept={DOCUMENT_ACCEPT_ATTR}
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.currentTarget.value = "";
                    void handleUploadRoomDoc(f);
                  }}
                />
              </label>
            </div>

            <form
              className="stack"
              style={{
                paddingTop: 10,
                borderTop: "1px solid var(--border)",
              }}
              onSubmit={handleGrantDoc}
            >
              <div className="stats">
                <label className="field">
                  <span>Document Version UUID</span>
                  <input
                    className="ctrl"
                    placeholder="Version UUID from upload"
                    value={lastVersionId}
                    onChange={(e) => setLastVersionId(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Qualified Buyer / Broker UUID</span>
                  <input
                    className="ctrl"
                    placeholder="00000000-0000-0000-0000-000000000000"
                    value={grantRecipientId}
                    onChange={(e) => setGrantRecipientId(e.target.value)}
                  />
                </label>
              </div>
              <label className="field">
                <span>Grant Expiry</span>
                <input
                  type="datetime-local"
                  className="ctrl"
                  value={grantExpiresAt}
                  onChange={(e) => setGrantExpiresAt(e.target.value)}
                />
              </label>
              <button
                type="submit"
                className="btn sm"
                disabled={busyId === "grant-doc"}
              >
                Grant Time-Boxed Vault Access
              </button>
            </form>
          </div>

          {/* 4. Trial-Stay Purchase Credit Terms */}
          <form className="card stack" onSubmit={handleSaveTrialTerms}>
            <div className="between wrap">
              <h3>4. Trial-Stay Purchase Credit Policy</h3>
              <span className="pill ok">v{trialVersion}</span>
            </div>
            <div className="stats">
              <label className="field">
                <span>Purchase Credit Cap (INR)</span>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  className="ctrl"
                  value={trialCreditInr}
                  onChange={(e) => setTrialCreditInr(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Minimum Trial Stay Nights</span>
                <input
                  type="number"
                  min={1}
                  max={14}
                  className="ctrl"
                  value={trialMinNights}
                  onChange={(e) => setTrialMinNights(e.target.value)}
                />
              </label>
            </div>
            <label className="field">
              <span>Credit Terms</span>
              <textarea
                className="ctrl"
                value={trialTermsText}
                onChange={(e) => setTrialTermsText(e.target.value)}
              />
            </label>
            <button
              type="submit"
              className="btn outline sm"
              disabled={busyId === "save-trial"}
            >
              Publish Trial-Stay Credit Terms
            </button>
          </form>
        </>
      )}

      {/* Shared / Buyer Offer & Counter-Offer Desk */}
      <div className="card stack">
        <div className="between wrap">
          <h3>
            {mode === "buyer"
              ? "Submit Formal Estate Acquisition Offer"
              : `Incoming Offers & Counter-Offers (${offers.length})`}
          </h3>
          <span className="pill forest">Integer-Paise Ledger</span>
        </div>

        <form className="stack" onSubmit={handleSubmitOffer}>
          <div className="stats">
            <label className="field">
              <span>Offer Price (INR Crores)</span>
              <input
                type="number"
                step="0.05"
                min="0.5"
                className="ctrl"
                value={offerPriceCr}
                onChange={(e) => setOfferPriceCr(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Financing Readiness</span>
              <select
                className="ctrl"
                value={offerFinancing}
                onChange={(e) =>
                  setOfferFinancing(
                    e.target.value as SalesOfferTerms["financing"],
                  )
                }
              >
                <option value="cash_self_reported">
                  All-Cash / Liquid Funds (Self-Reported)
                </option>
                <option value="preapproved_self_reported">
                  Bank Pre-Approved Sanction
                </option>
                <option value="loan_needed">Financing Required</option>
                <option value="unknown">Undisclosed</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>Offer Conditions & Closing Timeline</span>
            <textarea
              className="ctrl"
              value={offerConditions}
              onChange={(e) => setOfferConditions(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Offer Valid Until</span>
            <input
              type="datetime-local"
              className="ctrl"
              value={offerValidUntil}
              onChange={(e) => setOfferValidUntil(e.target.value)}
            />
          </label>
          {mode === "buyer" && (
            <button
              type="submit"
              className="btn accent"
              disabled={!isKycVerified || busyId === "submit-offer"}
            >
              <Icon name="shield" />{" "}
              {busyId === "submit-offer"
                ? "Submitting Offer…"
                : isKycVerified
                  ? "Submit Formal Offer"
                  : "Complete Buyer KYC to Submit Offer"}
            </button>
          )}
        </form>

        {offers.length > 0 && (
          <div className="stack" style={{ marginTop: 12 }}>
            {offers.map((o) => {
              const rev = offerRevisions.find(
                (r) =>
                  r.offer_id === o.id && r.revision === o.current_revision,
              );
              return (
                <article
                  key={o.id}
                  className="card stack"
                  style={{ background: "var(--surface-2)", padding: 12 }}
                >
                  <div className="between wrap">
                    <strong>
                      {propertyLabel(o.property_id)} · Revision v
                      {o.current_revision}
                    </strong>
                    <span className="pill">{o.status}</span>
                  </div>
                  {rev && (
                    <p style={{ margin: 0, fontSize: 13 }}>
                      <strong>
                        {inr(Math.round(rev.price_paise / 100))}
                      </strong>{" "}
                      · {rev.financing.replace(/_/g, " ")} ·{" "}
                      {rev.conditions}
                    </p>
                  )}
                  <div className="row wrap" style={{ gap: 8 }}>
                    {mode === "seller" && (
                      <>
                        <button
                          type="button"
                          className="btn sm"
                          disabled={busyId === o.id}
                          onClick={() =>
                            void handleOfferDecision(o, "accepted")
                          }
                        >
                          Accept Offer
                        </button>
                        <button
                          type="button"
                          className="btn outline sm"
                          disabled={busyId === o.id}
                          onClick={() => void handleCounterOffer(o)}
                        >
                          Send Counter-Offer
                        </button>
                        <button
                          type="button"
                          className="btn ghost sm"
                          style={{ color: "var(--danger)" }}
                          disabled={busyId === o.id}
                          onClick={() =>
                            void handleOfferDecision(o, "rejected")
                          }
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {mode === "buyer" && (
                      <>
                        <button
                          type="button"
                          className="btn outline sm"
                          disabled={busyId === o.id}
                          onClick={() => void handleCounterOffer(o)}
                        >
                          Revise Offer
                        </button>
                        <button
                          type="button"
                          className="btn ghost sm"
                          style={{ color: "var(--danger)" }}
                          disabled={busyId === o.id}
                          onClick={() =>
                            void handleOfferDecision(o, "withdrawn")
                          }
                        >
                          Withdraw Offer
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {mode === "buyer" && (
        <div className="card stack">
          <div className="between wrap">
            <h3>Private Legal Document Vault Reader</h3>
            <span className="pill info">
              Trial Stays Enrolled: {trialStayCount}
            </span>
          </div>
          <p className="muted" style={{ fontSize: 12.5 }}>
            Enter a Document Version UUID granted to your account by an estate
            owner or mandate holder to view watermarked title documents.
          </p>
          <div className="between wrap" style={{ gap: 8 }}>
            <input
              className="ctrl"
              style={{ flex: 1 }}
              placeholder="Document Version UUID"
              value={buyerVersionIdInput}
              onChange={(e) => setBuyerVersionIdInput(e.target.value)}
            />
            <button
              type="button"
              className="btn outline sm"
              disabled={busyId === "open-buyer-doc"}
              onClick={() => void handleBuyerOpenDoc()}
            >
              Open Vault Document
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
