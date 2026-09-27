import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in", description: "Sign in to 9bhk.app to book a farmhouse or manage your listing." };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
