import type { Metadata } from "next";
import { EditorialShell, PageHero, Section } from "@/components/seo/page-frame";
import { FaqSection, QuickAnswer } from "@/components/seo/faq";
import { EditorialCta } from "@/components/seo/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { generateFaqMetadata } from "@/lib/seo/metadata";
import { staticCrumbs } from "@/lib/seo/breadcrumbs";
import { createBreadcrumbSchema, createCollectionPageSchema, graph } from "@/lib/seo/schema";
import { platformFaq } from "@/lib/seo/faq";
import { SITE } from "@/lib/seo/site";

/**
 * `/faq` — the platform-level answer surface.
 *
 * Every answer here is a statement about how 9bhk actually works and matches
 * the published terms, refund policy and privacy policy. Answers that would
 * require a business fact we do not have (a support SLA, a cancellation
 * exception, a guarantee) are omitted rather than softened.
 *
 * The same `platformFaq()` array is also rendered on `/stays`, so there is one
 * source of truth for the platform answers and one `FAQPage` node per page that
 * renders them.
 */
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  return generateFaqMetadata(platformFaq().length);
}

export default async function FaqPage() {
  const items = platformFaq();
  const crumbs = staticCrumbs("Frequently asked questions", "/faq");

  return (
    <EditorialShell current="/faq">
      <JsonLd
        data={graph(
          createCollectionPageSchema({
            name: `Frequently asked questions about ${SITE.displayName}`,
            description: `How booking, payment, refunds and listings work on ${SITE.displayName}.`,
            path: "/faq",
          }),
          createBreadcrumbSchema(crumbs),
        )}
      />

      <PageHero
        crumbs={crumbs}
        eyebrow="Help"
        title="Frequently asked questions"
        lede={
          <p>
            How {SITE.displayName} works: whole-house private stays, booking requests, host
            confirmation, payment, refunds and cancellations.
          </p>
        }
      />

      <QuickAnswer
        question="What is 9bhk and how does booking work?"
        answer={`${SITE.displayName} is a marketplace for whole premium stays — farmhouses, beach houses, villas and hill-station homes — booked for the entire house. You pick a listing and your dates, the host confirms the request, and you pay the UPI ID the host has published. 9bhk does not hold the money.`}
        headingId="faq-quick-answer-heading"
      />

      <FaqSection items={items} heading="All questions" headingId="faq-all-heading" />

      <Section title="Where the detail lives" id="detail">
        <div className="seo-copy">
          <p>
            The answers above are a summary. The binding versions are the{" "}
            <a href="/legal/terms">terms of service</a>, the <a href="/legal/refunds">refund
            policy</a>, the <a href="/legal/privacy">privacy policy</a> and the{" "}
            <a href="/legal/cookies">cookie policy</a>.
          </p>
          <p>
            For anything those do not cover, <a href={`mailto:${SITE.email}`}>{SITE.email}</a> is the
            contact route.
          </p>
        </div>
      </Section>

      <EditorialCta
        title="Ready to look at the houses?"
        body="Every listing shows its capacity, amenities and nightly rate before you enquire — no hidden quote step."
        primary={{ href: "/stays", label: "Browse all stays" }}
        secondary={{ href: "/contact", label: "Contact us" }}
      />
    </EditorialShell>
  );
}
