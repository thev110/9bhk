import type { Metadata } from "next";

export const metadata: Metadata = { title: "Hosting", description: "Manage your 9bhk.app farmhouse, photos, UPI ID, and bookings." };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
