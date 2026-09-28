import type { Metadata } from "next";
import { LegalBody } from "@/components/legal-body";

export const metadata: Metadata = {
  title: "Refund policy",
  description: "When a 9bhk.app stay can be refunded.",
};

// Server component so `metadata` stays valid; the translated chrome lives in a
// client child because translations come from the client-side locale store.
// The prose below is deliberately left in English — it is lawyer-reviewed copy
// and needs a proper translation pass, not a mechanical one.
export default function RefundsPage() {
  return (
    <LegalBody doc="refunds" backHref="/legal/privacy">
      <p>Payment goes to the host’s UPI ID. 9bhk.app does not hold the money.</p>
      <ul className="stack sm" style={{ paddingLeft: 18 }}>
        <li>Free cancellation up to 7 days before check-in. The host returns the full amount.</li>
        <li>50% refund up to 48 hours before check-in.</li>
        <li>No refund within 48 hours of check-in.</li>
      </ul>
      <p>If the host does not confirm the stay, ask them to return the UPI payment. Write to <a href="mailto:hello@9bhk.app">hello@9bhk.app</a> if that does not happen.</p>
    </LegalBody>
  );
}
