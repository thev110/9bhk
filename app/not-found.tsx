import Link from "next/link";
import type { Metadata } from "next";
import { PageBar, Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: "Page not found",
  description: "That page is not on 9bhk.app.",
};

export default function NotFound() {
  return (
    <Shell dock="none">
      <PageBar title="Not found" backHref="/" />
      <div className="empty">
        <h3>This page is not here.</h3>
        <p>The link may be old, or the stay may have been removed.</p>
        <Link className="btn" href="/">
          Back to explore
        </Link>
      </div>
    </Shell>
  );
}
