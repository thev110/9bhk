"use client";

import { useState } from "react";
import { PageBar, Shell } from "@/components/shell";
import { formatRange, inr } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-t";
import type { SplitTokenPayload } from "@/lib/payments/split-token";

type PayState = "idle" | "working" | "unavailable" | "received";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

/** Razorpay's hosted checkout, loaded on demand so it never blocks first paint. */
function loadCheckout(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function SplitInvite({
  token,
  payload,
}: {
  token: string;
  payload: SplitTokenPayload | null;
}) {
  const t = useT();
  const { tag } = useLocale();
  const [state, setState] = useState<PayState>("idle");

  if (!payload) {
    return (
      <Shell>
        <PageBar title={t("split.title")} backHref="/" />
        <div className="empty">
          <h3>{t("split.invalidLink")}</h3>
          <p className="muted">{t("split.invalidLinkBody")}</p>
        </div>
      </Shell>
    );
  }

  async function pay() {
    setState("working");
    try {
      const response = await fetch("/api/split/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = (await response.json()) as {
        configured?: boolean;
        orderId?: string;
        amount?: number;
        currency?: string;
        keyId?: string;
      };

      // The deployment has no gateway keys. Say so plainly rather than showing
      // a checkout that cannot complete.
      if (!result.configured) {
        setState("unavailable");
        return;
      }

      const ready = await loadCheckout();
      if (!ready || !window.Razorpay || !result.orderId) {
        setState("unavailable");
        return;
      }

      const checkout = new window.Razorpay({
        key: result.keyId,
        order_id: result.orderId,
        amount: result.amount,
        currency: result.currency,
        name: "9bhk",
        description: payload?.propertyName,
        prefill: { name: payload?.memberName },
        // Client-side confirmation is cosmetic; the webhook is what settles the
        // share, so this only reports that the payment was handed off.
        handler: () => setState("received"),
      });
      checkout.open();
      setState("idle");
    } catch {
      setState("unavailable");
    }
  }

  return (
    <Shell>
      <PageBar title={t("split.title")} backHref="/" />
      <div className="pad mt stack">
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 32 }}>
          {t("split.inviteTitle")}
        </h1>
        <p className="muted" style={{ lineHeight: 1.6 }}>
          {t("split.inviteBody", {
            organiser: payload.organiser,
            property: payload.propertyName,
            amount: inr(payload.amount),
          })}
        </p>

        <div className="card">
          <div className="sumline">
            <span className="k">{t("split.stayDates")}</span>
            <span>{formatRange(payload.checkIn, payload.checkOut, tag)}</span>
          </div>
          <div className="sumline total">
            <span className="k">{t("split.yourShare")}</span>
            <span className="num">{inr(payload.amount)}</span>
          </div>
        </div>

        {state === "unavailable" ? (
          <div className="card">
            <h3>{t("split.notLive")}</h3>
            <p className="muted" style={{ lineHeight: 1.6 }}>
              {t("split.notLiveBody")}
            </p>
          </div>
        ) : null}

        {state === "received" ? (
          <div className="card">
            <p style={{ fontWeight: 700 }}>{t("split.paymentReceived")}</p>
          </div>
        ) : null}

        <button className="btn block" type="button" onClick={pay} disabled={state === "working"}>
          {state === "working" ? t("split.paying") : t("split.payShare")}
        </button>
        <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          {t("split.body")}
        </p>
      </div>
    </Shell>
  );
}
