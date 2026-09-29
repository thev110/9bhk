import type { Metadata } from "next";
import { NotFoundBody } from "@/components/not-found-body";

/**
 * 404 handling.
 *
 * `noindex, follow` is the important part: a 404 already carries the right
 * status code, but the directive stops any URL variant of this path from being
 * indexed, and `follow` keeps the breadcrumbs and destination links on the page
 * passing their equity onwards instead of dead-ending.
 *
 * The visible body is the existing premium 404 component, extended with real
 * crawlable routes so a mistyped or retired URL still lands somewhere useful
 * rather than a dead end. `app/not-found-body.tsx` handles the translated
 * chrome; the extra links are server-rendered so they exist in the HTML.
 */
export const metadata: Metadata = {
  title: "Page not found",
  description: "That page is not on 9bhk.app.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <NotFoundBody>
      <nav aria-label="Suggested pages" className="pad stack sm" style={{ maxWidth: 420 }}>
        <a className="btn outline" href="/stays">
          Browse all stays
        </a>
        <a className="btn outline" href="/locations">
          Browse by destination
        </a>
        <a className="btn outline" href="/guides">
          Read the guides
        </a>
        <a className="btn outline" href="/contact">
          Tell us what you were looking for
        </a>
      </nav>
    </NotFoundBody>
  );
}
