import Link from "next/link";
import type { Metadata } from "next";
import { NotFoundBody } from "@/components/not-found-body";

export const metadata: Metadata = {
  title: "Page not found",
  description: "That page is not on 9bhk.app.",
};

// Server component so `metadata` stays valid; the visible strings live in a
// client child because translations come from the client-side locale store.
export default function NotFound() {
  return <NotFoundBody />;
}
