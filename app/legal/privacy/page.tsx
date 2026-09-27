import type { Metadata } from "next";
import Link from "next/link";
import { PageBar, Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What 9bhk.app stores when you sign in, book, or list a farmhouse.",
};

export default function PrivacyPage() {
  return (
    <Shell dock="none">
      <PageBar title="Privacy" backHref="/profile" />
      <article className="pad mt stack">
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 36 }}>Privacy policy</h1>
        <p>9bhk.app stores the details needed to sign you in and run a booking.</p>
        <p>When you use Google, we keep your name, email, and profile photo. If you add a phone number or a host UPI ID, those are saved on your profile. A booking stores the guest name, email, phone, dates, amount, and the UPI reference you type.</p>
        <p>Property photos you upload are stored so guests can see the listing. We do not sell this data and we do not run advertising cookies.</p>
        <p>
          Questions: <a href="mailto:hello@9bhk.app">hello@9bhk.app</a>
        </p>
        <p className="muted">
          <Link href="/legal/terms">Terms</Link>
          {" · "}
          <Link href="/legal/refunds">Refunds</Link>
          {" · "}
          <Link href="/legal/cookies">Cookies</Link>
        </p>
      </article>
    </Shell>
  );
}
