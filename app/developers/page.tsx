import type { Metadata } from "next";
import { EditorialShell, PageHero, Section } from "@/components/seo/page-frame";
import { LinkCluster } from "@/components/seo/link-tile";
import { JsonLd } from "@/components/seo/json-ld";
import { generateDevelopersMetadata } from "@/lib/seo/metadata";
import { createAboutPageSchema, createBreadcrumbSchema, graph } from "@/lib/seo/schema";
import { staticCrumbs } from "@/lib/seo/breadcrumbs";
import { SITE } from "@/lib/seo/site";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return generateDevelopersMetadata();
}

export default async function DevelopersPage() {
  const crumbs = staticCrumbs("Developers & Tech", "/developers");

  return (
    <EditorialShell current="/developers">
      <JsonLd
        data={graph(
          createAboutPageSchema({
            name: `Developers & Technical Architecture — ${SITE.displayName}`,
            description:
              "Explore the technical architecture, payment reconciliation, and engineering design of 9bhk.",
            path: "/developers",
          }),
          createBreadcrumbSchema(crumbs),
        )}
      />

      <PageHero
        crumbs={crumbs}
        eyebrow="Architecture &amp; Engineering"
        title="Building a high-trust luxury estate marketplace"
        lede={
          <p>
            9bhk is engineered for speed, privacy, and absolute contract predictability. Discover the
            underlying tech stack: Next.js 15 App Router, Razorpay payment webhook handling, AEO
            semantic knowledge graphs, and an uncompromising vanilla CSS token system.
          </p>
        }
      />

      <Section title="Core Architecture Pillars" id="dev-pillars">
        <div className="home-seo-cards">
          <div className="home-seo-card">
            <div className="home-seo-card-badge">Pillar 01 · Server-First Performance</div>
            <h3>React Server Components &amp; Edge Delivery</h3>
            <p>
              Editorial pages and structured data render on the server. Interactive account and search
              features use client components. Performance is measured on the deployed site rather than
              inferred from the framework.
            </p>
          </div>
          <div className="home-seo-card">
            <div className="home-seo-card-badge">Pillar 02 · Reservations &amp; Payments</div>
            <h3>Server-Authoritative Payment Reconciliation</h3>
            <p>
              Reservation holds and expected order amounts are stored before checkout. The server
              reconciles captured payments before confirmation. Refund and payout requests retain their
              actual processing status; provider escrow is not assumed.
            </p>
          </div>
          <div className="home-seo-card">
            <div className="home-seo-card-badge">Pillar 03 · Answer Engine Optimization</div>
            <h3>Semantic Knowledge Graph &amp; llms.txt</h3>
            <p>
              Property pages publish structured data from public listing facts. VacationRental markup
              requires complete public location data. Review aggregates require published reviews tied
              to completed stays.
            </p>
          </div>
          <div className="home-seo-card">
            <div className="home-seo-card-badge">Pillar 04 · Design Engineering</div>
            <h3>OKLCH Design Tokens &amp; Accessible Aesthetics</h3>
            <p>
              Crafted with Vanilla CSS tokens rather than heavyweight utility frameworks. Features spring
              physics animations, tactile hover states, focus styles, browser zoom, reduced-motion support,
              and native safe-area inset support for mobile devices.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Payment Webhook Specifications" id="dev-webhooks">
        <div className="seo-prose">
          <p>
            Our payments infrastructure integrates with Razorpay webhooks for captured payment
            reconciliation. Webhooks must be verified using the shared webhook secret:
          </p>
          <aside className="seo-factbox">
            <h3>Webhook Verification Interface</h3>
            <dl>
              <div>
                <dt>Endpoint</dt>
                <dd><code>POST /api/payments/webhook</code></dd>
              </div>
              <div>
                <dt>Signature Header</dt>
                <dd><code>x-razorpay-signature</code></dd>
              </div>
              <div>
                <dt>Supported Events</dt>
                <dd><code>payment.captured</code>. Other events are acknowledged without financial state changes.</dd>
              </div>
              <div>
                <dt>Idempotency</dt>
                <dd>Stored event receipts and database reservation constraints protect settlement</dd>
              </div>
            </dl>
          </aside>
        </div>
      </Section>

      <Section title="AI &amp; Crawler Resources" id="dev-ai">
        <div className="seo-prose">
          <p>
            We publish structured feeds to assist AI answer engines and machine crawlers in understanding
            our live inventory and editorial taxonomy:
          </p>
          <ul>
            <li>
              <a href="/sitemap.xml">XML Sitemap (/sitemap.xml)</a> — Dynamically computed from active inventory.
            </li>
            <li>
              <a href="/robots.txt">Robots Directive (/robots.txt)</a> — Explicit crawl budgets and clean indexing rules.
            </li>
            <li>
              <a href="/llms.txt">LLMs Knowledge File (/llms.txt)</a> — Plaintext Markdown briefing for AI agents.
            </li>
          </ul>
        </div>
      </Section>

      <LinkCluster
        title="Developer Resources"
        headingId="dev-links-heading"
        links={[
          { href: "/about", label: "About 9bhk", note: "Mission and platform standards" },
          { href: "/creators", label: "Creator & Partner Program", note: "Commercial shoots and stays" },
          { href: "/faq", label: "Platform FAQ", note: "Complete answers on booking rules" },
          { href: "/legal/terms", label: "Terms of Service", note: "Host and guest legal contracts" },
        ]}
      />
    </EditorialShell>
  );
}
