import type { Metadata } from "next";
import { noindexMetadata } from "@/lib/seo/metadata";

/**
 * `/split` — a private payment-split invite link. `noindex, follow`.
 *
 * These URLs are shared over WhatsApp between the people splitting a booking
 * bill, so they are reachable by anyone holding the token. They must never
 * enter the index: the page is a payment surface tied to a specific booking and
 * a specific group of people, and indexing it would expose a private
 * transaction flow in search results.
 *
 * Access control is the token check inside the page, not this directive.
 */
export const metadata: Metadata = noindexMetadata(
  "Split a booking",
  "This private payment link is not indexed by search engines.",
  "/split",
);

export default function SplitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
