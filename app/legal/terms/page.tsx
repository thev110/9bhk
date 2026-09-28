import type { Metadata } from "next";
import { LegalBody } from "@/components/legal-body";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "How bookings and listings work on 9bhk.app.",
};

// Server component so `metadata` stays valid; the translated chrome lives in a
// client child because translations come from the client-side locale store.
// The prose below is deliberately left in English — it is lawyer-reviewed copy
// and needs a proper translation pass, not a mechanical one.
export default function TermsPage() {
  return (
    <LegalBody doc="terms" backHref="/legal/privacy">
      <p>9bhk.app lists farmhouses for short stays around Chennai and the coast. A booking is a request until the host confirms that the UPI payment arrived.</p>
      <p>The price shown before you pay is the nightly rate, the cleaning fee, and 12% tax. There is no extra platform charge added at the end.</p>
      <p>Hosts are responsible for the accuracy of the listing, the photos, and the UPI ID they publish. Guests are responsible for paying that UPI ID and for following the house rules on the listing.</p>
      <p>
        Contact: <a href="mailto:hello@9bhk.app">hello@9bhk.app</a>
      </p>
    </LegalBody>
  );
}
