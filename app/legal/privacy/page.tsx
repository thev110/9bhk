import type { Metadata } from "next";
import { LegalBody } from "@/components/legal-body";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What 9bhk.app stores when you sign in, book, or list a farmhouse.",
};

// Server component so `metadata` stays valid; the translated chrome lives in a
// client child because translations come from the client-side locale store.
// The prose below is deliberately left in English — it is lawyer-reviewed copy
// and needs a proper translation pass, not a mechanical one.
export default function PrivacyPage() {
  return (
    <LegalBody doc="privacy" backHref="/profile">
      <p>9bhk.app stores the details needed to sign you in and run a booking.</p>
      <p>When you use Google, we keep your name, email, and profile photo. If you add a phone number or a host UPI ID, those are saved on your profile. A booking stores the guest name, email, phone, dates, amount, and the UPI reference you type.</p>
      <p>Property photos you upload are stored so guests can see the listing. We do not sell this data and we do not run advertising cookies.</p>
      <p>
        Questions: <a href="mailto:hello@9bhk.app">hello@9bhk.app</a>
      </p>
    </LegalBody>
  );
}
