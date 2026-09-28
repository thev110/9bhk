import type { Metadata } from "next";
import { LegalBody } from "@/components/legal-body";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "The cookies 9bhk.app uses to keep you signed in.",
};

// Server component so `metadata` stays valid; the translated chrome lives in a
// client child because translations come from the client-side locale store.
// The prose below is deliberately left in English — it is lawyer-reviewed copy
// and needs a proper translation pass, not a mechanical one.
export default function CookiesPage() {
  return (
    <LegalBody doc="cookies" backHref="/legal/privacy">
      <p>Sign-in uses a cookie so you stay logged in after Google returns you to the site. Your city, saved stays, and draft listing are kept in this browser’s local storage.</p>
      <p>There is no advertising cookie and no tracking cookie. A consent banner is not shown because these cookies are required for sign-in and for remembering your own stays.</p>
      <p>
        Questions: <a href="mailto:hello@9bhk.app">hello@9bhk.app</a>
      </p>
    </LegalBody>
  );
}
