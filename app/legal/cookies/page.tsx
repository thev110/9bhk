import type { Metadata } from "next";
import { LegalBody } from "@/components/legal-body";
import { buildMetadata } from "@/lib/seo/metadata";
import { staticCrumbs } from "@/lib/seo/breadcrumbs";

/**
 * `/legal/cookies`
 *
 * Indexable with a self-referencing canonical. The four legal documents
 * interlink, and each carries a real breadcrumb trail, so they are reachable
 * from the site graph rather than orphaned behind a profile-page back link.
 */
export const metadata: Metadata = buildMetadata({
  title: "Cookie policy",
  description:
    "The cookies 9bhk.app uses to keep you signed in, and the browser storage used to remember your city and saved stays. No advertising cookie and no tracking cookie.",
  path: "/legal/cookies",
});

// Server component so `metadata` stays valid; the translated chrome lives in a
// client child because translations come from the client-side locale store.
// The prose below is deliberately left in English — it is lawyer-reviewed copy
// and needs a proper translation pass, not a mechanical one.
export default function CookiesPage() {
  return (
    <LegalBody doc="cookies" backHref="/legal/privacy" crumbs={staticCrumbs("Cookie policy", "/legal/cookies")}>
      <p>Sign-in uses a cookie so you stay logged in after Google returns you to the site. Your city, saved stays, and draft listing are kept in this browser’s local storage.</p>
      <p>There is no advertising cookie and no tracking cookie. A consent banner is not shown because these cookies are required for sign-in and for remembering your own stays.</p>
      <p>
        Questions: <a href="mailto:hello@9bhk.app">hello@9bhk.app</a>
      </p>
    </LegalBody>
  );
}
