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
    "How to request cancellation and track refund review and payment processing for a 9bhk reservation.",
  path: "/legal/refunds",
});

// Server component so `metadata` stays valid; the translated chrome lives in a
// client child because translations come from the client-side locale store.
// The prose below is deliberately left in English — it is lawyer-reviewed copy
// and needs a proper translation pass, not a mechanical one.
export default function RefundsPage() {
  return (
    <LegalBody doc="refunds" backHref="/legal/privacy" crumbs={staticCrumbs("Refund policy", "/legal/refunds")}>
      <p>You can submit cancellation requests before the recorded check-in time. Started and completed stays require support review. The trip shows the refund request's current status. Cancelling a reservation does not itself mean money has been returned.</p>
      <ul className="stack sm" style={{ paddingLeft: 18 }}>
        <li>Captured payments associated with a cancelled reservation are recorded for refund review.</li>
        <li>The recorded request amount is subject to review of the applicable reservation terms; it is not a completed or guaranteed refund.</li>
        <li>Contact support to confirm the applicable cancellation terms before booking.</li>
      </ul>
      <p>Eligible refund requests are recorded for processing through the original payment method. A payment captured after its reservation has expired requires reconciliation and a refund request; an expired hold is not a completed refund. For questions, write to <a href="mailto:hello@9bhk.app">hello@9bhk.app</a>.</p>
    </LegalBody>
  );
}
