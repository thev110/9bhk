import type { Metadata } from "next";
import Link from "next/link";
import { PageBar, Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: "Refund policy",
  description: "When a 9bhk.app stay can be refunded.",
};

export default function RefundsPage() {
  return (
    <Shell dock="none">
      <PageBar title="Refunds" backHref="/legal/privacy" />
      <article className="pad mt stack">
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 36 }}>Refund policy</h1>
        <p>Payment goes to the host’s UPI ID. 9bhk.app does not hold the money.</p>
        <ul className="stack sm" style={{ paddingLeft: 18 }}>
          <li>Free cancellation up to 7 days before check-in. The host returns the full amount.</li>
          <li>50% refund up to 48 hours before check-in.</li>
          <li>No refund within 48 hours of check-in.</li>
        </ul>
        <p>If the host does not confirm the stay, ask them to return the UPI payment. Write to <a href="mailto:hello@9bhk.app">hello@9bhk.app</a> if that does not happen.</p>
        <p className="muted">
          <Link href="/legal/privacy">Privacy</Link>
          {" · "}
          <Link href="/legal/terms">Terms</Link>
          {" · "}
          <Link href="/legal/cookies">Cookies</Link>
        </p>
      </article>
    </Shell>
  );
}
