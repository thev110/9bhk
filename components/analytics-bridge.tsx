"use client";
import { useEffect } from "react";
import { subscribe } from "@/lib/seo/analytics";
export function AnalyticsBridge() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ANALYTICS_ID !== "first-party") return;
    return subscribe((event, payload) => {
      void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, propertyId: payload.propertyId }), keepalive: true }).catch(() => {});
    });
  }, []);
  return null;
}
