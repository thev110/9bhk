import type { Metadata } from "next";
import { LegalBody } from "@/components/legal-body";
import { buildMetadata } from "@/lib/seo/metadata";
import { staticCrumbs } from "@/lib/seo/breadcrumbs";

/**
 * `/legal/refunds`
 *
 * Indexable with a self-referencing canonical. The four legal documents
 * interlink, and each carries a real breadcrumb trail, so they are reachable
 * from the site graph rather than orphaned behind a profile-page back link.
 */
export const metadata: Metadata = buildMetadata({
  title: "Refund policy",
  description:
    "When a 9bhk.app stay can be refunded: full refund up to 7 days before check-in, 50% up to 48 hours before check-in, and no refund within 48 hours of check-in.",
  path: "/legal/refunds",
});

// Server component so `metadata` stays valid; the translated chrome lives in a
// client child because translations come from the client-side locale store.
// The prose below is deliberately left in English — it is lawyer-reviewed copy
// and needs a proper translation pass, not a mechanical one.
export default function RefundsPage() {
  return (
    <LegalBody doc="refunds" backHref="/legal/privacy" crumbs={staticCrumbs("Refund policy", "/legal/refunds")}>
      <p>Payments are secured via Razorpay escrow and held until check-in. Payouts to hosts are processed under a 15-day clearance window.</p>
      <ul className="stack sm" style={{ paddingLeft: 18 }}>
        <li>Free cancellation up to 7 days before check-in. Full refund processed automatically to the original payment method.</li>
        <li>50% refund up to 48 hours before check-in.</li>
        <li>No refund within 48 hours of check-in.</li>
      </ul>
      <p>If a booking request expires or is declined by the host, the payment pre-authorization or charge is refunded automatically. For questions, write to <a href="mailto:hello@9bhk.app">hello@9bhk.app</a>.</p>
    </LegalBody>
  );
}
