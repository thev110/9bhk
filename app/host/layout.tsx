import type { Metadata } from "next";
import { noindexMetadata } from "@/lib/seo/metadata";

/**
 * `/host` (`owners.9bhk.app`) — Standalone Property Owners & Sellers Portal.
 *
 * Unauthenticated visitors land on the dedicated `owners.9bhk.app` Property
 * Owners Landing Page + Inline Auth Hub (`<PortalAuthCard portal="owners" />`)
 * rather than being bounced to the consumer `www.9bhk.app/login` page.
 */
export const metadata: Metadata = noindexMetadata(
  "Hosting",
  "Manage your 9bhk.app farmhouse, photos, UPI ID, and bookings.",
  "/host",
);

export default function OwnersPortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
