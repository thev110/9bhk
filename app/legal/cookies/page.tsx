import type { Metadata } from "next";
import Link from "next/link";
import { PageBar, Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "The cookies 9bhk.app uses to keep you signed in.",
};

export default function CookiesPage() {
  return (
    <Shell dock="none">
      <PageBar title="Cookies" backHref="/legal/privacy" />
      <article className="pad mt stack">
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 36 }}>Cookie policy</h1>
        <p>Sign-in uses a cookie so you stay logged in after Google returns you to the site. Your city, saved stays, and draft listing are kept in this browser’s local storage.</p>
        <p>There is no advertising cookie and no tracking cookie. A consent banner is not shown because these cookies are required for sign-in and for remembering your own stays.</p>
        <p>
          Questions: <a href="mailto:hello@9bhk.app">hello@9bhk.app</a>
        </p>
        <p className="muted">
          <Link href="/legal/privacy">Privacy</Link>
          {" · "}
          <Link href="/legal/terms">Terms</Link>
          {" · "}
          <Link href="/legal/refunds">Refunds</Link>
        </p>
      </article>
    </Shell>
  );
}
