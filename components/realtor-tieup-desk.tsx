"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { inr } from "@/lib/format";
import {
  acceptCobrokerAgreement,
  claimCobrokerMilestone,
  disputeCobrokerAgreement,
  loadCobrokerAgreements,
  loadCobrokerMilestones,
  proposeCobrokerAgreement,
  proposeCobrokerMilestone,
} from "@/lib/supabase/cobroker-agreements";
import {
  listPropertyMandates,
  requestPropertyMandate,
  revokePropertyMandate,
  type MandateCapability,
} from "@/lib/supabase/mandates";
import {
  listViewingAppointments,
  proposeViewingAppointment,
  recordViewingAttendance,
  updateViewingAppointment,
  type ViewingAction,
} from "@/lib/supabase/viewing-appointments";

export type RealtorTieUpDeskProps = {
  userId: string;
  isKycVerified: boolean;
  properties: Array<{ id: string; name: string; location: string }>;
  onToast: (msg: string) => void;
};

type CobrokerAgreementRow = {
  id: string;
  property_id: string;
  broker_a_id: string;
  broker_b_id: string;
  status: string;
  current_version: number;
  updated_at: string;
};

type CobrokerRevisionRow = {
  agreement_id: string;
  version: number;
  payer_id: string;
  commission_paise: number;
  broker_a_paise: number;
  broker_b_paise: number;
  milestones: string;
  attribution: string;
  terms: string;
};

type CobrokerMilestoneRow = {
  id: string;
  agreement_id: string;
  version: number;
  title: string;
  description: string;
  amount_paise: number;
  status: string;
  receipt_reference?: string | null;
};

type MandateRow = {
  id: string;
  property_id: string;
  broker_id: string;
  capabilities: MandateCapability[];
  status: string;
  starts_at: string;
  expires_at: string;
  created_at: string;
};

type ViewingRow = {
  id: string;
  request_id: string;
  property_id?: string;
  starts_at: string;
  ends_at: string;
  status: string;
  version: number;
  attendance?: string | null;
};

const ALL_CAPABILITIES: MandateCapability[] = [
  "marketing",
  "viewings",
  "documents",
  "offers",
  "edit-proposal",
];

export function RealtorTieUpDesk({
  userId,
  isKycVerified,
  properties,
  onToast,
}: RealtorTieUpDeskProps) {
  const [subTab, setSubTab] = useState<"cobroker" | "mandates" | "viewings">(
    "cobroker",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [agreements, setAgreements] = useState<CobrokerAgreementRow[]>([]);
  const [revisions, setRevisions] = useState<CobrokerRevisionRow[]>([]);
  const [milestones, setMilestones] = useState<CobrokerMilestoneRow[]>([]);

  const [cbPropertyId, setCbPropertyId] = useState(properties[0]?.id ?? "");
  const [counterpartyId, setCounterpartyId] = useState("");
  const [initiatorRole, setInitiatorRole] = useState<
    "listing_broker" | "buyer_broker"
  >("listing_broker");
  const [totalPoolInr, setTotalPoolInr] = useState("500000");
  const [initiatorShareBps, setInitiatorShareBps] = useState("5000");
  const [cbTerms, setCbTerms] = useState(
    "Mutual introduction protection with milestone settlement upon registered sale deed.",
  );
  const [utrInputs, setUtrInputs] = useState<Record<string, string>>({});
  const [disputeInputs, setDisputeInputs] = useState<Record<string, string>>(
    {},
  );

  const [mandates, setMandates] = useState<MandateRow[]>([]);
  const [mPropertyId, setMPropertyId] = useState(properties[0]?.id ?? "");
  const [mTier, setMTier] = useState<"exclusive" | "non_exclusive">(
    "exclusive",
  );
  const [mStartsAt, setMStartsAt] = useState(() =>
    new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16),
  );
  const [mEndsAt, setMEndsAt] = useState(() =>
    new Date(Date.now() + 90 * 86400 * 1000).toISOString().slice(0, 16),
  );

  const [viewings, setViewings] = useState<ViewingRow[]>([]);
  const [vRequestId, setVRequestId] = useState("");
  const [vStartsAt, setVStartsAt] = useState(() =>
    new Date(Date.now() + 86400 * 1000).toISOString().slice(0, 16),
  );
  const [vDurationHours, setVDurationHours] = useState("2");
  const [vReason, setVReason] = useState(
    "Confirmed principal buyer site inspection with architect.",
  );

  useEffect(() => {
    if (!cbPropertyId && properties[0]?.id) setCbPropertyId(properties[0].id);
    if (!mPropertyId && properties[0]?.id) setMPropertyId(properties[0].id);
  }, [properties, cbPropertyId, mPropertyId]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [cbData, msData, mandateRows, viewingData] = await Promise.all([
        loadCobrokerAgreements().catch(() => ({
          agreements: [],
          revisions: [],
          acceptances: [],
          events: [],
        })),
        loadCobrokerMilestones().catch(() => ({
          milestones: [],
          acknowledgements: [],
        })),
        listPropertyMandates().catch(() => []),
        listViewingAppointments().catch(() => ({
          appointments: [],
          events: [],
        })),
      ]);
      setAgreements(cbData.agreements as CobrokerAgreementRow[]);
      setRevisions(cbData.revisions as CobrokerRevisionRow[]);
      setMilestones(msData.milestones as CobrokerMilestoneRow[]);
      setMandates(mandateRows as MandateRow[]);
      setViewings(viewingData.appointments as ViewingRow[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load realtor tie-up records.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  function propertyLabel(propertyId: string) {
    const found = properties.find((p) => p.id === propertyId);
    return found ? `${found.name} (${found.location})` : propertyId;
  }

  async function handleProposeTieup(e: React.FormEvent) {
    e.preventDefault();
    if (!isKycVerified) {
      onToast(
        "Complete RERA Broker KYC verification before proposing a realtor tie-up.",
      );
      return;
    }
    if (!cbPropertyId || !counterpartyId.trim()) {
      onToast("Select an estate and enter the counterparty broker UUID.");
      return;
    }
    const bps = Number(initiatorShareBps);
    if (!Number.isInteger(bps) || bps < 0 || bps > 10000) {
      onToast(
        "Share in basis points must be an integer between 0 and 10000 bps.",
      );
      return;
    }
    const poolInr = Number(totalPoolInr);
    if (!Number.isFinite(poolInr) || poolInr <= 0) {
      onToast("Enter a positive whole-rupee pool amount.");
      return;
    }

    const totalPaise = Math.round(poolInr) * 100;
    const myPaise = Math.round((totalPaise * bps) / 10000);
    const counterPaise = totalPaise - myPaise;

    const brokerA =
      initiatorRole === "listing_broker" ? userId : counterpartyId.trim();
    const brokerB =
      initiatorRole === "listing_broker" ? counterpartyId.trim() : userId;
    const brokerAPaise =
      initiatorRole === "listing_broker" ? myPaise : counterPaise;
    const brokerBPaise =
      initiatorRole === "listing_broker" ? counterPaise : myPaise;

    setBusyId("propose-cb");
    try {
      await proposeCobrokerAgreement(cbPropertyId, brokerA, brokerB, {
        payerId: brokerA,
        commissionPaise: totalPaise,
        brokerAPaise,
        brokerBPaise,
        milestones: `Initiator role: ${initiatorRole} · Split: ${bps} bps / ${10000 - bps} bps`,
        attribution: `Initiated by ${initiatorRole}`,
        terms: cbTerms.trim(),
      });
      onToast("Realtor-to-Realtor Tie-Up proposal recorded.");
      setCounterpartyId("");
      await refreshAll();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Could not propose tie-up.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleAcceptAgreement(ag: CobrokerAgreementRow) {
    setBusyId(ag.id);
    try {
      await acceptCobrokerAgreement(ag.id, ag.current_version);
      onToast("Tie-up revision accepted.");
      await refreshAll();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Could not accept tie-up.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDisputeAgreement(
    ag: CobrokerAgreementRow,
    mode: "decline" | "dispute",
  ) {
    const note =
      disputeInputs[ag.id]?.trim() ||
      (mode === "decline"
        ? "Counterparty declined proposed split terms."
        : "Dispute raised for staff review.");
    setBusyId(ag.id);
    try {
      await disputeCobrokerAgreement(ag.id, ag.current_version, note);
      onToast(
        mode === "decline"
          ? "Tie-up proposal declined."
          : "Dispute recorded on agreement.",
      );
      await refreshAll();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Could not update agreement.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleRecordUtr(ag: CobrokerAgreementRow) {
    const utr = utrInputs[ag.id]?.trim();
    if (!utr) {
      onToast("Enter a bank UTR or settlement reference number first.");
      return;
    }
    const rev = revisions.find(
      (r) => r.agreement_id === ag.id && r.version === ag.current_version,
    );
    const existingMs = milestones.find(
      (m) => m.agreement_id === ag.id && m.version === ag.current_version,
    );

    setBusyId(`utr-${ag.id}`);
    try {
      let milestoneId = existingMs?.id;
      if (!milestoneId) {
        milestoneId = await proposeCobrokerMilestone(ag.id, ag.current_version, {
          title: "Settlement Tranche",
          description: "External bank settlement recorded by broker",
          amountPaise: rev?.commission_paise ?? 10000,
        });
      }
      await claimCobrokerMilestone(
        milestoneId,
        "payment",
        `Recorded external settlement reference ${utr}`,
        utr,
      );
      onToast("UTR reference recorded against tie-up milestone.");
      setUtrInputs((prev) => ({ ...prev, [ag.id]: "" }));
      await refreshAll();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Could not record UTR receipt.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleRequestMandate(e: React.FormEvent) {
    e.preventDefault();
    if (!isKycVerified) {
      onToast(
        "Complete RERA Broker KYC verification before requesting mandates.",
      );
      return;
    }
    if (!mPropertyId) {
      onToast("Select an estate for the owner mandate request.");
      return;
    }
    const capabilities: MandateCapability[] =
      mTier === "exclusive"
        ? ALL_CAPABILITIES
        : ["marketing", "viewings", "offers"];

    setBusyId("req-mandate");
    try {
      await requestPropertyMandate(
        mPropertyId,
        capabilities,
        new Date(mStartsAt).toISOString(),
        new Date(mEndsAt).toISOString(),
      );
      onToast("Owner mandate request submitted for seller approval.");
      await refreshAll();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Could not request owner mandate.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleWithdrawMandate(id: string) {
    setBusyId(id);
    try {
      await revokePropertyMandate(id);
      onToast("Mandate withdrawn.");
      await refreshAll();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Could not withdraw mandate.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleScheduleViewing(e: React.FormEvent) {
    e.preventDefault();
    if (!vRequestId.trim()) {
      onToast("Enter the enquiry or viewing request UUID.");
      return;
    }
    const hrs = Number(vDurationHours);
    if (!Number.isFinite(hrs) || hrs <= 0 || hrs > 4) {
      onToast("Viewing window must be at most 4 hours.");
      return;
    }
    const startMs = Date.parse(vStartsAt);
    if (!Number.isFinite(startMs)) {
      onToast("Choose a valid start date and time.");
      return;
    }
    const endIso = new Date(startMs + hrs * 3600 * 1000).toISOString();

    setBusyId("propose-viewing");
    try {
      await proposeViewingAppointment(
        vRequestId.trim(),
        new Date(startMs).toISOString(),
        endIso,
        vReason.trim() || "Scheduled buyer inspection.",
      );
      onToast("Viewing appointment proposed (max 4h window enforced).");
      setVRequestId("");
      await refreshAll();
    } catch (err) {
      onToast(
        err instanceof Error
          ? err.message
          : "Could not schedule viewing window.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleViewingStatus(
    v: ViewingRow,
    nextStatus: "confirmed" | "completed" | "no_show" | "cancelled",
  ) {
    setBusyId(v.id);
    try {
      if (nextStatus === "completed") {
        await recordViewingAttendance(
          v.id,
          v.version,
          "attended",
          "Buyer completed scheduled inspection.",
        );
      } else if (nextStatus === "no_show") {
        await recordViewingAttendance(
          v.id,
          v.version,
          "no_show",
          "Party did not attend scheduled viewing window.",
        );
      } else {
        const action: ViewingAction = nextStatus;
        await updateViewingAppointment(
          v.id,
          v.version,
          action,
          `Status updated to ${nextStatus}`,
        );
      }
      onToast(`Viewing marked as ${nextStatus.replace("_", " ")}.`);
      await refreshAll();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Could not update viewing status.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section
      className="stack"
      aria-label="Realtor Tie-Up, Mandate & Viewing Desk"
    >
      {!isKycVerified && (
        <div
          className="card stack"
          role="status"
          style={{
            borderColor: "var(--warn)",
            background: "color-mix(in oklch, var(--warn) 8%, var(--surface))",
            padding: 14,
          }}
        >
          <div className="between wrap">
            <span className="pill warn">RERA Broker KYC Required</span>
            <span className="muted" style={{ fontSize: 12 }}>
              Verification Gate Active
            </span>
          </div>
          <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
            Initiating new Realtor-to-Realtor Tie-Up agreements and Owner Mandate
            requests requires verified RERA certificate, PAN, and Agency Proof in
            your RERA KYC Locker tab.
          </p>
        </div>
      )}

      <div className="seg" role="tablist" aria-label="Realtor Desk Sections">
        <button
          type="button"
          role="tab"
          aria-selected={subTab === "cobroker"}
          onClick={() => setSubTab("cobroker")}
        >
          Realtor Tie-Ups ({agreements.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={subTab === "mandates"}
          onClick={() => setSubTab("mandates")}
        >
          Owner Mandates ({mandates.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={subTab === "viewings"}
          onClick={() => setSubTab("viewings")}
        >
          Viewing Scheduler ({viewings.length})
        </button>
      </div>

      {error && (
        <p role="alert" style={{ color: "var(--danger)", fontSize: 12.5 }}>
          {error}
        </p>
      )}

      {subTab === "cobroker" && (
        <div className="stack">
          <form className="card stack" onSubmit={handleProposeTieup}>
            <div className="between wrap">
              <h3>Propose Realtor-to-Realtor Tie-Up</h3>
              <span className="pill forest">10000 bps = Full Pool</span>
            </div>
            <p className="muted" style={{ fontSize: 12.5 }}>
              Connect two RERA-verified realtors on an estate transaction. Lock
              bilateral attribution and basis-points split before introducing a
              client.
            </p>

            <label className="field">
              <span>Select Estate</span>
              <select
                className="ctrl"
                value={cbPropertyId}
                onChange={(e) => setCbPropertyId(e.target.value)}
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.location}
                  </option>
                ))}
              </select>
            </label>

            <div className="stats">
              <label className="field">
                <span>Counterparty Broker UUID</span>
                <input
                  className="ctrl"
                  placeholder="00000000-0000-0000-0000-000000000000"
                  value={counterpartyId}
                  onChange={(e) => setCounterpartyId(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Initiator Side</span>
                <select
                  className="ctrl"
                  value={initiatorRole}
                  onChange={(e) =>
                    setInitiatorRole(
                      e.target.value as "listing_broker" | "buyer_broker",
                    )
                  }
                >
                  <option value="listing_broker">
                    Listing Mandate Holder (listing_broker)
                  </option>
                  <option value="buyer_broker">
                    Buyer Representative (buyer_broker)
                  </option>
                </select>
              </label>
            </div>

            <div className="stats">
              <label className="field">
                <span>Your Share (0 – 10000 bps)</span>
                <input
                  type="number"
                  min={0}
                  max={10000}
                  step={50}
                  className="ctrl"
                  value={initiatorShareBps}
                  onChange={(e) => setInitiatorShareBps(e.target.value)}
                />
                <span className="help">
                  Counterparty receives{" "}
                  {Math.max(0, 10000 - (Number(initiatorShareBps) || 0))} bps
                  (equal split = 5000 bps each).
                </span>
              </label>
              <label className="field">
                <span>Agreed Pool Value (INR)</span>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  className="ctrl"
                  value={totalPoolInr}
                  onChange={(e) => setTotalPoolInr(e.target.value)}
                />
                <span className="help">
                  Persisted in integer paise on the ledger.
                </span>
              </label>
            </div>

            <label className="field">
              <span>Tie-Up Protection & Settlement Terms</span>
              <textarea
                className="ctrl"
                value={cbTerms}
                onChange={(e) => setCbTerms(e.target.value)}
              />
            </label>

            <button
              type="submit"
              className="btn accent"
              disabled={!isKycVerified || busyId === "propose-cb"}
            >
              <Icon name="shield" />{" "}
              {busyId === "propose-cb"
                ? "Submitting Proposal…"
                : isKycVerified
                  ? "Propose Realtor Tie-Up"
                  : "Complete RERA KYC to Propose Tie-Up"}
            </button>
          </form>

          <div className="stack">
            <h3>Active & Proposed Realtor Tie-Ups</h3>
            {loading ? (
              <p role="status" className="muted">
                Loading realtor tie-ups…
              </p>
            ) : agreements.length === 0 ? (
              <div className="card">
                <p className="muted" style={{ margin: 0 }}>
                  No realtor-to-realtor tie-ups recorded yet. Propose a bilateral
                  basis-points split above to connect with a partner broker.
                </p>
              </div>
            ) : (
              agreements.map((ag) => {
                const rev = revisions.find(
                  (r) =>
                    r.agreement_id === ag.id &&
                    r.version === ag.current_version,
                );
                const totalPaise = rev?.commission_paise ?? 0;
                const aBps =
                  totalPaise > 0
                    ? Math.round(
                        ((rev?.broker_a_paise ?? 0) * 10000) / totalPaise,
                      )
                    : 5000;
                const bBps = 10000 - aBps;

                return (
                  <article key={ag.id} className="card stack">
                    <div className="between wrap">
                      <div>
                        <strong>{propertyLabel(ag.property_id)}</strong>
                        <p className="muted" style={{ fontSize: 12 }}>
                          Revision v{ag.current_version} · Listing Broker:{" "}
                          {ag.broker_a_id.slice(0, 8)} · Buyer Broker:{" "}
                          {ag.broker_b_id.slice(0, 8)}
                        </p>
                      </div>
                      <span
                        className={`pill ${
                          ag.status === "accepted"
                            ? "ok"
                            : ag.status === "disputed"
                              ? "danger"
                              : "warn"
                        }`}
                      >
                        {ag.status}
                      </span>
                    </div>

                    {rev && (
                      <div className="stats">
                        <div className="stat">
                          <p className="lb">Total Pool</p>
                          <p className="nb">
                            {inr(Math.round(rev.commission_paise / 100))}
                          </p>
                        </div>
                        <div className="stat">
                          <p className="lb">Basis Points Split</p>
                          <p className="nb">
                            {aBps} bps / {bBps} bps
                          </p>
                        </div>
                      </div>
                    )}

                    {rev?.terms && <p className="muted">{rev.terms}</p>}

                    <div className="row wrap" style={{ gap: 8 }}>
                      <button
                        type="button"
                        className="btn sm"
                        disabled={busyId === ag.id}
                        onClick={() => void handleAcceptAgreement(ag)}
                      >
                        Accept Tie-Up
                      </button>
                      <button
                        type="button"
                        className="btn outline sm"
                        disabled={busyId === ag.id}
                        onClick={() => void handleDisputeAgreement(ag, "decline")}
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        className="btn outline sm"
                        style={{ color: "var(--danger)" }}
                        disabled={busyId === ag.id}
                        onClick={() => void handleDisputeAgreement(ag, "dispute")}
                      >
                        Raise Dispute
                      </button>
                    </div>

                    <div className="between wrap" style={{ gap: 8 }}>
                      <input
                        className="ctrl"
                        style={{ flex: 1 }}
                        placeholder="External Bank UTR / Reference or Dispute Reason"
                        value={utrInputs[ag.id] ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUtrInputs((prev) => ({ ...prev, [ag.id]: val }));
                          setDisputeInputs((prev) => ({
                            ...prev,
                            [ag.id]: val,
                          }));
                        }}
                      />
                      <button
                        type="button"
                        className="btn outline sm"
                        disabled={busyId === `utr-${ag.id}`}
                        onClick={() => void handleRecordUtr(ag)}
                      >
                        Record UTR Receipt
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}

      {subTab === "mandates" && (
        <div className="stack">
          <form className="card stack" onSubmit={handleRequestMandate}>
            <div className="between wrap">
              <h3>Request Property Owner Mandate</h3>
              <span className="pill info">Seller Approval Required</span>
            </div>
            <p className="muted" style={{ fontSize: 12.5 }}>
              Request capability-scoped authorization from the property owner to
              market the estate, schedule viewings, and present offers.
            </p>

            <div className="stats">
              <label className="field">
                <span>Property</span>
                <select
                  className="ctrl"
                  value={mPropertyId}
                  onChange={(e) => setMPropertyId(e.target.value)}
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.location}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Mandate Tier</span>
                <select
                  className="ctrl"
                  value={mTier}
                  onChange={(e) =>
                    setMTier(e.target.value as "exclusive" | "non_exclusive")
                  }
                >
                  <option value="exclusive">
                    Exclusive Mandate (All 5 Capabilities)
                  </option>
                  <option value="non_exclusive">
                    Non-Exclusive Mandate (Marketing, Viewings & Offers)
                  </option>
                </select>
              </label>
            </div>

            <div className="stats">
              <label className="field">
                <span>Starts At</span>
                <input
                  type="datetime-local"
                  className="ctrl"
                  value={mStartsAt}
                  onChange={(e) => setMStartsAt(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Expires At</span>
                <input
                  type="datetime-local"
                  className="ctrl"
                  value={mEndsAt}
                  onChange={(e) => setMEndsAt(e.target.value)}
                />
              </label>
            </div>

            <button
              type="submit"
              className="btn accent"
              disabled={!isKycVerified || busyId === "req-mandate"}
            >
              {busyId === "req-mandate"
                ? "Requesting Mandate…"
                : isKycVerified
                  ? "Submit Owner Mandate Request"
                  : "Complete RERA KYC to Request Mandate"}
            </button>
          </form>

          <div className="stack">
            <h3>Requested & Active Owner Mandates</h3>
            {loading ? (
              <p role="status" className="muted">
                Loading mandates…
              </p>
            ) : mandates.length === 0 ? (
              <div className="card">
                <p className="muted" style={{ margin: 0 }}>
                  No property mandates found. Submit a mandate request above to
                  obtain owner authorization.
                </p>
              </div>
            ) : (
              mandates.map((m) => (
                <article key={m.id} className="card stack">
                  <div className="between wrap">
                    <div>
                      <strong>{propertyLabel(m.property_id)}</strong>
                      <p className="muted" style={{ fontSize: 12 }}>
                        Valid {new Date(m.starts_at).toLocaleDateString("en-IN")}{" "}
                        – {new Date(m.expires_at).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <span
                      className={`pill ${
                        m.status === "approved" || m.status === "active"
                          ? "ok"
                          : m.status === "rejected" || m.status === "revoked"
                            ? "danger"
                            : "warn"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <div className="row wrap" style={{ gap: 6 }}>
                    {(m.capabilities ?? []).map((cap) => (
                      <span key={cap} className="pill" style={{ fontSize: 11 }}>
                        {cap}
                      </span>
                    ))}
                  </div>
                  {m.status !== "revoked" && m.status !== "rejected" && (
                    <div>
                      <button
                        type="button"
                        className="btn outline sm"
                        disabled={busyId === m.id}
                        onClick={() => void handleWithdrawMandate(m.id)}
                      >
                        Withdraw Mandate
                      </button>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      )}

      {subTab === "viewings" && (
        <div className="stack">
          <form className="card stack" onSubmit={handleScheduleViewing}>
            <div className="between wrap">
              <h3>Schedule Buyer Viewing Window</h3>
              <span className="pill forest">Max 4 Hours Window</span>
            </div>
            <p className="muted" style={{ fontSize: 12.5 }}>
              Propose a conflict-checked site visit window of up to 4 hours for a
              qualified buyer request.
            </p>

            <div className="stats">
              <label className="field">
                <span>Buyer Enquiry / Request UUID</span>
                <input
                  className="ctrl"
                  placeholder="00000000-0000-0000-0000-000000000000"
                  value={vRequestId}
                  onChange={(e) => setVRequestId(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Window Start</span>
                <input
                  type="datetime-local"
                  className="ctrl"
                  value={vStartsAt}
                  onChange={(e) => setVStartsAt(e.target.value)}
                />
              </label>
            </div>

            <div className="stats">
              <label className="field">
                <span>Duration (Hours, max 4h)</span>
                <select
                  className="ctrl"
                  value={vDurationHours}
                  onChange={(e) => setVDurationHours(e.target.value)}
                >
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="3">3 hours</option>
                  <option value="4">4 hours (Maximum)</option>
                </select>
              </label>
              <label className="field">
                <span>Visit Agenda / Note</span>
                <input
                  className="ctrl"
                  value={vReason}
                  onChange={(e) => setVReason(e.target.value)}
                />
              </label>
            </div>

            <button
              type="submit"
              className="btn accent"
              disabled={busyId === "propose-viewing"}
            >
              <Icon name="calendar" />{" "}
              {busyId === "propose-viewing"
                ? "Scheduling Window…"
                : "Propose Viewing Window"}
            </button>
          </form>

          <div className="stack">
            <h3>Scheduled Viewing Windows</h3>
            {loading ? (
              <p role="status" className="muted">
                Loading viewing appointments…
              </p>
            ) : viewings.length === 0 ? (
              <div className="card">
                <p className="muted" style={{ margin: 0 }}>
                  No viewing appointments scheduled yet.
                </p>
              </div>
            ) : (
              viewings.map((v) => (
                <article key={v.id} className="card stack">
                  <div className="between wrap">
                    <div>
                      <strong>Request {v.request_id.slice(0, 8)}</strong>
                      <p className="muted" style={{ fontSize: 12 }}>
                        {new Date(v.starts_at).toLocaleString("en-IN")} →{" "}
                        {new Date(v.ends_at).toLocaleTimeString("en-IN")}
                      </p>
                    </div>
                    <span
                      className={`pill ${
                        v.status === "confirmed" || v.attendance === "attended"
                          ? "ok"
                          : v.status === "cancelled" ||
                              v.attendance === "no_show"
                            ? "danger"
                            : "warn"
                      }`}
                    >
                      {v.attendance ? `${v.status} · ${v.attendance}` : v.status}
                    </span>
                  </div>

                  <div className="row wrap" style={{ gap: 8 }}>
                    <button
                      type="button"
                      className="btn sm"
                      disabled={busyId === v.id}
                      onClick={() => void handleViewingStatus(v, "confirmed")}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className="btn outline sm"
                      disabled={busyId === v.id}
                      onClick={() => void handleViewingStatus(v, "completed")}
                    >
                      Mark Completed
                    </button>
                    <button
                      type="button"
                      className="btn outline sm"
                      disabled={busyId === v.id}
                      onClick={() => void handleViewingStatus(v, "no_show")}
                    >
                      Mark No-Show
                    </button>
                    <button
                      type="button"
                      className="btn outline sm"
                      style={{ color: "var(--danger)" }}
                      disabled={busyId === v.id}
                      onClick={() => void handleViewingStatus(v, "cancelled")}
                    >
                      Cancel
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
