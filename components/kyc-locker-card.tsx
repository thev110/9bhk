"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { formatBytes } from "@/lib/format";
import {
  DOCUMENT_ACCEPT_ATTR,
  MAX_DOCUMENT_BYTES,
  REQUIRED_KYC_DOCUMENTS,
  downloadDocument,
  listMyKycDocuments,
  openDocument,
  summarizeCategoryKyc,
  uploadKycDocument,
  validateDocument,
  type KycCategory,
  type KycDocument,
  type KycDocumentKind,
} from "@/lib/supabase/documents";

const CATEGORY_COPY: Record<
  KycCategory,
  {
    badge: string;
    title: string;
    subtitle: string;
    lockedNotice: string;
  }
> = {
  guest: {
    badge: "Guest Identity KYC · www.9bhk.app",
    title: "Guest Identity & Arrival Pass Locker",
    subtitle:
      "Upload your government photo ID once. Staff verification unlocks your Digital Estate Arrival Pass for whole-property stays.",
    lockedNotice:
      "Complete Guest Identity KYC before generating a Digital Arrival Pass for confirmed bookings.",
  },
  realtor: {
    badge: "RERA Broker KYC · realtor.9bhk.app",
    title: "Mandatory RERA & Agency Compliance Locker",
    subtitle:
      "All three broker credentials must be verified by 9bhk staff to activate your Verified RERA Broker badge, co-broker tie-ups, and owner mandates.",
    lockedNotice:
      "Realtor-to-Realtor Co-Broker Tie-Ups and Owner Mandate Requests remain locked until all 3 RERA KYC documents are verified.",
  },
  seller: {
    badge: "Property Owner Title KYC · owners.9bhk.app",
    title: "Estate Owner Title & Identity Locker",
    subtitle:
      "Verify your title deed, property tax receipt, and owner photo ID to publish listings, approve broker mandates, and accept purchase offers.",
    lockedNotice:
      "Approving broker mandates, accepting formal offers, and releasing private document room grants require verified Owner KYC.",
  },
  buyer: {
    badge: "Buyer Proof-of-Funds KYC · owners.9bhk.app",
    title: "Qualified Estate Buyer & Proof-of-Funds Locker",
    subtitle:
      "Upload your government ID and banker comfort letter / net-worth certificate to unlock private document vaults and submit formal offers.",
    lockedNotice:
      "Submitting formal acquisition offers and accessing private legal document rooms require verified Buyer KYC.",
  },
};

export type KycLockerCardProps = {
  category: KycCategory;
  onVerifiedChange?: (verified: boolean) => void;
  onToast?: (msg: string) => void;
};

export function KycLockerCard({
  category,
  onVerifiedChange,
  onToast,
}: KycLockerCardProps) {
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingKind, setUploadingKind] = useState<KycDocumentKind | null>(
    null,
  );
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const copy = CATEGORY_COPY[category];
  const slots = REQUIRED_KYC_DOCUMENTS[category];

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listMyKycDocuments(category);
      setDocuments(rows);
      const summary = summarizeCategoryKyc(category, rows);
      onVerifiedChange?.(summary.verified);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load KYC verification locker.",
      );
    } finally {
      setLoading(false);
    }
  }, [category, onVerifiedChange]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const summary = summarizeCategoryKyc(category, documents);
  const docByKind = new Map<KycDocumentKind, KycDocument>();
  for (const doc of documents) {
    docByKind.set(doc.kind, doc);
  }

  async function handleFileSelect(
    kind: KycDocumentKind,
    file: File | undefined,
  ) {
    if (!file) return;
    setError("");
    const invalid = validateDocument(file);
    if (invalid === "too_large") {
      const msg = `File exceeds maximum size of ${formatBytes(MAX_DOCUMENT_BYTES)}. Upload a PDF, JPEG, PNG, or WebP under 15 MB.`;
      setError(msg);
      onToast?.(msg);
      return;
    }
    if (invalid === "bad_type") {
      const msg =
        "Unsupported file format. Please select a PDF, JPEG, PNG, or WebP file.";
      setError(msg);
      onToast?.(msg);
      return;
    }

    setUploadingKind(kind);
    try {
      await uploadKycDocument({ category, kind, file });
      onToast?.("KYC document uploaded to encrypted vault for staff review.");
      await reload();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not upload KYC document.";
      setError(msg);
      onToast?.(msg);
    } finally {
      setUploadingKind(null);
    }
  }

  async function handleOpen(doc: KycDocument) {
    setOpeningId(doc.id);
    setError("");
    try {
      const ok = await openDocument(doc.path);
      if (!ok) {
        throw new Error("Could not generate signed preview link.");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not open document.";
      setError(msg);
      onToast?.(msg);
    } finally {
      setOpeningId(null);
    }
  }

  async function handleDownload(doc: KycDocument) {
    setOpeningId(doc.id);
    setError("");
    try {
      const ok = await downloadDocument({
        path: doc.path,
        fileName: doc.fileName,
      });
      if (!ok) {
        throw new Error("Could not download signed document.");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not download document.";
      setError(msg);
      onToast?.(msg);
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <section
      className="card stack"
      aria-label={copy.title}
      data-kyc-category={category}
    >
      <div className="between wrap" style={{ gap: 8 }}>
        <span className="pill forest">
          <Icon name="shield" /> {copy.badge}
        </span>
        <span className={`pill ${summary.verified ? "ok" : "warn"}`}>
          {summary.verified
            ? `✓ All ${summary.totalRequired} KYC Verified`
            : `${summary.verifiedCount} / ${summary.totalRequired} Verified`}
        </span>
      </div>

      <div>
        <h3 style={{ fontSize: 18, margin: 0 }}>{copy.title}</h3>
        <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
          {copy.subtitle}
        </p>
      </div>

      {!summary.verified && (
        <div
          className="card"
          role="status"
          style={{
            background: "color-mix(in oklch, var(--warn) 8%, var(--surface))",
            border: "1px dashed var(--warn)",
            padding: 12,
          }}
        >
          <p style={{ fontSize: 12.5, margin: 0 }}>
            <strong>Mandatory Verification Gate:</strong> {copy.lockedNotice}
          </p>
        </div>
      )}

      {error && (
        <p role="alert" style={{ color: "var(--danger)", fontSize: 12.5, margin: 0 }}>
          {error}
        </p>
      )}

      {loading ? (
        <p role="status" className="muted" style={{ fontSize: 13 }}>
          Checking encrypted KYC vault status…
        </p>
      ) : (
        <div className="stack" style={{ gap: 10 }}>
          {slots.map((slot) => {
            const doc = docByKind.get(slot.kind);
            const isUploading = uploadingKind === slot.kind;
            const status = doc?.status;

            let pillClass = "pill";
            let pillLabel = "Upload Required";
            if (status === "verified") {
              pillClass = "pill ok";
              pillLabel = "Verified by Staff";
            } else if (status === "pending") {
              pillClass = "pill warn";
              pillLabel = "Pending Staff Review";
            } else if (status === "rejected") {
              pillClass = "pill danger";
              pillLabel = "Rejected — Re-upload";
            }

            return (
              <article
                key={slot.kind}
                className="card stack"
                style={{
                  padding: 14,
                  background: "var(--surface-2)",
                  gap: 8,
                }}
              >
                <div className="between wrap" style={{ gap: 8 }}>
                  <div>
                    <strong style={{ fontSize: 14 }}>{slot.label}</strong>
                    <p
                      className="muted"
                      style={{ fontSize: 12, margin: "2px 0 0" }}
                    >
                      {slot.description}
                    </p>
                  </div>
                  <span className={pillClass} style={{ fontSize: 11 }}>
                    {pillLabel}
                  </span>
                </div>

                {doc && (
                  <div
                    className="between wrap"
                    style={{
                      gap: 8,
                      paddingTop: 6,
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <span className="muted" style={{ fontSize: 12 }}>
                      {doc.fileName} · {formatBytes(doc.sizeBytes)}
                    </span>
                    <div className="row" style={{ gap: 6 }}>
                      <button
                        type="button"
                        className="btn outline sm"
                        disabled={openingId === doc.id}
                        onClick={() => void handleOpen(doc)}
                      >
                        {openingId === doc.id ? "Opening…" : "Preview"}
                      </button>
                      <button
                        type="button"
                        className="btn ghost sm"
                        disabled={openingId === doc.id}
                        onClick={() => void handleDownload(doc)}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                )}

                {doc?.status === "rejected" && doc.note && (
                  <p
                    role="alert"
                    style={{
                      fontSize: 12,
                      color: "var(--danger)",
                      margin: 0,
                    }}
                  >
                    Staff Reviewer Note: {doc.note}
                  </p>
                )}

                <div className="between wrap" style={{ gap: 8 }}>
                  <label
                    className={`btn sm ${doc ? "outline" : "accent"}`}
                    style={{ cursor: isUploading ? "wait" : "pointer" }}
                  >
                    <span>
                      {isUploading
                        ? "Uploading…"
                        : doc
                          ? "Replace File"
                          : "Upload Document"}
                    </span>
                    <input
                      type="file"
                      accept={DOCUMENT_ACCEPT_ATTR}
                      disabled={isUploading}
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const chosen = e.target.files?.[0];
                        e.currentTarget.value = "";
                        void handleFileSelect(slot.kind, chosen);
                      }}
                    />
                  </label>
                  <span className="muted" style={{ fontSize: 11 }}>
                    PDF, JPEG, PNG, WebP · Max 15 MB · 5-min signed URL
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
