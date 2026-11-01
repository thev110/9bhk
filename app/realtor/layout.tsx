import type { Metadata } from "next";
import { noindexMetadata } from "@/lib/seo/metadata";

/**
 * `/realtor` (`realtor.9bhk.app`) — Standalone RERA Realtor & Co-Broker Portal.
 *
 * Unauthenticated visitors land on the dedicated `realtor.9bhk.app` B2B
 * Landing Page + Inline Auth Hub (`<PortalAuthCard portal="realtor" />`)
 * rather than being bounced to the consumer `www.9bhk.app/login` page.
 */
export const metadata: Metadata = noindexMetadata(
  "9bhk Realtor & Co-Broker Portal",
  "RERA-verified realtor workspace, 3+ BHK mandate catalog, client CRM, and co-broking split ledger on realtor.9bhk.app.",
  "/realtor",
);

export default function RealtorPortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
