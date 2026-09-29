"use client";

import { useState } from "react";
import { inr } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { buildSplit, payoutState, splitProgress, type SplitShare } from "@/lib/split";
import { todayIso } from "@/lib/availability";
import { accessToken } from "@/lib/supabase/browser";

/**
 * Split Pay — the group funds the stay instead of one organiser fronting it.
 *
 * The panel is deliberately optimistic about *who has paid* locally, because
 * the authoritative settlement runs through the gateway webhook. What it must
 * never be optimistic about is the payout: that follows `payoutState()`, which
 * requires the group to be fully funded **and** the check-in day to have
 * arrived.
 *
 * Invite links are minted server-side — the signing secret must never reach the
 * browser — so each share is sent via `/api/split/invite` using the organiser's
 * own session token, which is what lets row level security authorise it.
 */
export function SplitPayPanel({
  total,
  code,
  organiser,
  checkIn,
  shares,
  onCreate,
  onMarkPaid,
  onError,
}: {
  total: number;
  code: string;
  organiser: string;
  checkIn: string;
  shares?: SplitShare[];
  onCreate: (shares: SplitShare[]) => void;
  onMarkPaid: (share: SplitShare) => void;
  onError: () => void;
}) {
  const t = useT();
  const [roster, setRoster] = useState("");
  const [invited, setInvited] = useState<number | null>(null);
  const [sending, setSending] = useState<number | null>(null);

  if (!shares || shares.length === 0) {
    return (
      <div className="card mt">
        <h3>{t("split.title")}</h3>
        <p className="muted" style={{ lineHeight: 1.6 }}>
          {t("split.body")}
        </p>
        <label className="field mt">
          {t("split.roster")}
          <input
            className="ctrl"
            value={roster}
            placeholder={t("split.rosterPlaceholder")}
            onChange={(event) => setRoster(event.target.value)}
          />
        </label>
        <button
          className="btn block mt"
          type="button"
          onClick={() => {
            const members = roster
              .split(",")
              .map((name) => name.trim())
              .filter(Boolean);
            if (!members.length) return;
            onCreate(buildSplit(total, members, organiser));
          }}
        >
          {t("split.title")}
        </button>
      </div>
    );
  }

  const progress = splitProgress(shares);
  const payout = payoutState(shares, checkIn, todayIso());
  const payoutCopy =
    payout.reason === "ready"
      ? t("split.payoutReady")
      : payout.reason === "too-early"
        ? t("split.payoutTooEarly")
        : t("split.payoutUnfunded", { n: payout.outstandingCount });

  async function sendInvite(slot: number) {
    setSending(slot);
    try {
      const token = await accessToken();
      if (!token) {
        onError();
        return;
      }
      const response = await fetch("/api/split/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bookingCode: code,
          slot,
          shares: shares?.map((share) => ({ name: share.name, amount: share.amount })) ?? [],
        }),
      });
      const result = (await response.json()) as { url?: string };
      if (!response.ok || !result.url) {
        onError();
        return;
      }
      await navigator.clipboard?.writeText(`${window.location.origin}${result.url}`);
      setInvited(slot);
      window.setTimeout(() => setInvited(null), 2500);
    } catch {
      onError();
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="card mt">
      <div className="between">
        <h3>{t("split.title")}</h3>
        <span className={`pill ${progress.funded ? "ok" : "warn"}`} style={{ fontSize: 11 }}>
          {t("split.progress", { n: progress.paidCount, m: progress.headcount })}
        </span>
      </div>

      <div className="pbar mt" aria-hidden>
        <i style={{ width: `${progress.percent}%` }} />
      </div>

      <div className="stack mt">
        {shares.map((share, slot) => (
          <div
            key={share.id}
            style={{ padding: "10px 0", borderTop: "1px solid var(--border)" }}
          >
            <div className="between" style={{ alignItems: "center" }}>
              <div>
                <strong style={{ fontSize: 14 }}>{t("split.shareOf", { name: share.name })}</strong>
                <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {share.paid ? t("split.paid") : t("split.pending")}
                </p>
              </div>
              <div className="row" style={{ alignItems: "center", gap: 8 }}>
                <span className="num">{inr(share.amount)}</span>
                {share.paid ? (
                  <span className="pill ok" style={{ fontSize: 10 }}>
                    {t("split.paid")}
                  </span>
                ) : (
                  <button className="btn ghost sm" type="button" onClick={() => onMarkPaid(share)}>
                    {t("split.markPaid")}
                  </button>
                )}
              </div>
            </div>
            {!share.paid ? (
              <button
                className="btn outline sm mt"
                type="button"
                disabled={sending === slot}
                onClick={() => void sendInvite(slot)}
              >
                {invited === slot ? t("split.toastInvite") : t("split.sendInvite")}
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="sumline total mt">
        <span className="k">{progress.funded ? t("split.funded") : t("split.outstanding")}</span>
        <span className="num">{inr(progress.outstanding)}</span>
      </div>

      <p className="muted mt" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
        {payoutCopy}
      </p>
    </div>
  );
}
