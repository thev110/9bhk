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
    "How bookings and listings work on 9bhk.app: a booking is a request until the host confirms it, the total is the nightly rate plus cleaning plus 12% tax, and payment goes to the host's published UPI ID.",
  path: "/legal/terms",
});

// Server component so `metadata` stays valid; the translated chrome lives in a
// client child because translations come from the client-side locale store.
// The prose below is deliberately left in English — it is lawyer-reviewed copy
// and needs a proper translation pass, not a mechanical one.
export default function TermsPage() {
  return (
    <LegalBody doc="terms" backHref="/legal/privacy" crumbs={staticCrumbs("Terms of service", "/legal/terms")}>
      <p>9bhk.app lists farmhouses for short stays around Chennai and the coast. A booking is a request until the host confirms that the UPI payment arrived.</p>
      <p>The price shown before you pay is the nightly rate, the cleaning fee, and 12% tax. There is no extra platform charge added at the end.</p>
      <p>Hosts are responsible for the accuracy of the listing, the photos, and the UPI ID they publish. Guests are responsible for paying that UPI ID and for following the house rules on the listing.</p>
      <p>
        Contact: <a href="mailto:hello@9bhk.app">hello@9bhk.app</a>
      </p>
    </LegalBody>
  );
}
