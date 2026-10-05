import type { Metadata } from "next";
import { EditorialShell, PageHero, Section } from "@/components/seo/page-frame";
import { LinkCluster } from "@/components/seo/link-tile";
import { JsonLd } from "@/components/seo/json-ld";
import { generateCreditsMetadata } from "@/lib/seo/metadata";
import { createBreadcrumbSchema, createPersonSchema, graph } from "@/lib/seo/schema";
import { staticCrumbs } from "@/lib/seo/breadcrumbs";
import { SITE } from "@/lib/seo/site";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  return generateCreditsMetadata();
}

export default async function CreditsPage() {
  const crumbs = staticCrumbs("The Creator", "/credits");

  return (
    <EditorialShell current="/credits">
      <JsonLd
        data={graph(
          createPersonSchema(),
          createBreadcrumbSchema(crumbs),
        )}
      />

      <PageHero
        crumbs={crumbs}
        eyebrow="Credits &amp; Architecture"
        title="The Creator"
        lede={
          <p>
            Rathnavel Karthi · Independent Product Builder &amp; Developer · Chennai, Tamil Nadu, India
          </p>
        }
      />

      <Section title="Rathnavel Karthi" id="creator-bio">
        <div className="seo-copy">
          <p>
            Rathnavel Karthi is an independent product builder and developer who works across software,
            AI, automation, web applications and digital products.
          </p>
          <p>
            He focuses on building practical technology that solves real problems — from the initial idea
            and product architecture through design, development, automation and deployment.
          </p>
          <p>
            His approach combines engineering with product thinking: understand the problem, simplify the
            experience, build quickly, test in the real world, and keep improving.
          </p>
          <p style={{ marginTop: 20 }}>
            <a
              href="https://www.linkedin.com/in/rathnavel-karthi-114991135/"
              target="_blank"
              rel="noopener noreferrer"
              className="seo-creator-link"
              aria-label="Connect with Rathnavel Karthi on LinkedIn"
            >
              Connect with Rathnavel Karthi on LinkedIn →
            </a>
          </p>
        </div>
      </Section>

      <Section title="About 9bhk" id="product-overview">
        <div className="seo-copy">
          <p>
            9bhk was conceptualized, designed, and developed by Rathnavel Karthi to solve the
            high-risk, fragmented vacation rental market across the Chennai and ECR coastline.
          </p>
          <p>
            Built as a full-stack Next.js application, it integrates Razorpay escrow webhooks,
            verified physical specs (electrical load kW, generator backup, and high-tide boundaries),
            and a strict three-bedroom group floor.
          </p>
        </div>
      </Section>

      <LinkCluster
        title="Explore 9bhk"
        headingId="credits-links-heading"
        links={[
          { href: "/about", label: "About 9bhk", note: "Mission and platform standards" },
          { href: "/guides/building-9bhk-rathnavel-karthi", label: "Builder's Blog", note: "The story behind building 9bhk" },
          { href: "/developers", label: "Technical Architecture", note: "Next.js, Razorpay escrow & tokens" },
          { href: "/faq", label: "FAQ", note: "Platform answers" },
        ]}
      />
    </EditorialShell>
  );
}
