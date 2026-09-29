import type { Metadata } from "next";
import { LegalBody } from "@/components/legal-body";
import { buildMetadata } from "@/lib/seo/metadata";
import { staticCrumbs } from "@/lib/seo/breadcrumbs";

/**
 * `/legal/privacy`
 *
 * Indexable with a self-referencing canonical. The four legal documents
 * interlink, and each carries a real breadcrumb trail, so they are reachable
 * from the site graph rather than orphaned behind a profile-page back link.
 */
export const metadata: Metadata = buildMetadata({
  title: "Privacy policy",
  description:
    "What 9bhk.app stores when you sign in, book a stay or list a property — your Google account details, your contact details, booking records and uploaded photos. No advertising cookies, no data sold.",
  path: "/legal/privacy",
});

// Server component so `metadata` stays valid; the translated chrome lives in a
// client child because translations come from the client-side locale store.
// The prose below is deliberately left in English — it is lawyer-reviewed copy
// and needs a proper translation pass, not a mechanical one.
export default function PrivacyPage() {
  return (
    <LegalBody doc="privacy" backHref="/legal/terms" crumbs={staticCrumbs("Privacy policy", "/legal/privacy")}>
      <p>9bhk.app stores the details needed to sign you in and run a booking.</p>
      <p>When you use Google, we keep your name, email, and profile photo. If you add a phone number or a host UPI ID, those are saved on your profile. A booking stores the guest name, email, phone, dates, amount, and the UPI reference you type.</p>
      <p>Property photos you upload are stored so guests can see the listing. We do not sell this data and we do not run advertising cookies.</p>
      <p>
        Questions: <a href="mailto:hello@9bhk.app">hello@9bhk.app</a>
      </p>
    </LegalBody>
  );
}
