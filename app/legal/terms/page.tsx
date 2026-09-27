import type { Metadata } from "next";
import Link from "next/link";
import { PageBar, Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "How bookings and listings work on 9bhk.app.",
};

export default function TermsPage() {
  return (
    <Shell dock="none">
      <PageBar title="Terms" backHref="/legal/privacy" />
      <article className="pad mt stack">
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 36 }}>Terms of service</h1>
        <p>9bhk.app lists farmhouses for short stays around Chennai and the coast. A booking is a request until the host confirms that the UPI payment arrived.</p>
        <p>The price shown before you pay is the nightly rate, the cleaning fee, and 12% tax. There is no extra platform charge added at the end.</p>
        <p>Hosts are responsible for the accuracy of the listing, the photos, and the UPI ID they publish. Guests are responsible for paying that UPI ID and for following the house rules on the listing.</p>
        <p>
          Contact: <a href="mailto:hello@9bhk.app">hello@9bhk.app</a>
        </p>
        <p className="muted">
          <Link href="/legal/privacy">Privacy</Link>
          {" · "}
          <Link href="/legal/refunds">Refunds</Link>
          {" · "}
          <Link href="/legal/cookies">Cookies</Link>
        </p>
      </article>
    </Shell>
  );
}
