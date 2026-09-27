import type { Metadata } from "next";

export const metadata: Metadata = { title: "Search", description: "Search farmhouses near Chennai, ECR, Mahabalipuram, and Pondicherry." };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
