import type { Metadata } from "next";
import { LegalBody } from "@/components/legal-body";
import { buildMetadata } from "@/lib/seo/metadata";
import { staticCrumbs } from "@/lib/seo/breadcrumbs";

/**
 * `/legal/terms`
 *
 * Indexable with a self-referencing canonical. The four legal documents
 * interlink, and each carries a real breadcrumb trail, so they are reachable
 * from the site graph rather than orphaned behind a profile-page back link.
 */
export const metadata: Metadata = buildMetadata({
  title: "Terms of service",
  description:
    "How listings, reservation holds, payment confirmation, itemized quotes, and cancellation requests work on 9bhk.app.",
  path: "/legal/terms",
});

// Server component so `metadata` stays valid; the translated chrome lives in a
// client child because translations come from the client-side locale store.
// The prose below is deliberately left in English — it is lawyer-reviewed copy
// and needs a proper translation pass, not a mechanical one.
export default function TermsPage() {
  return (
    <LegalBody doc="terms" backHref="/legal/privacy" crumbs={staticCrumbs("Terms of service", "/legal/terms")}>
      <p>9bhk.app lists whole properties for private stays. A reservation hold temporarily reserves available dates. A booking is confirmed after the server reconciles a captured payment through Razorpay.</p>
      <p>The server quote shown before checkout itemizes the stay, cleaning, configured taxes and service fees, and any refundable deposit. A tax percentage is a listing configuration, not a general statement of the tax treatment of all stays.</p>
      <p>Hosts are responsible for the accuracy of their listing and photos. A listing is marked Verified only when a staff review of its evidence is recorded, and that label does not guarantee clear legal title. Guests must follow the house rules disclosed by the host.</p>
      <p>Cancellation, refund requests, and host payout requests are separate recorded processes. A requested refund or payout is not a completed transfer. Checkout does not itself establish an escrow arrangement.</p>
      <p>
        Contact: <a href="mailto:hello@9bhk.app">hello@9bhk.app</a>
      </p>
    </LegalBody>
  );
}
