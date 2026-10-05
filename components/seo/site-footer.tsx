import Link from "next/link";
import Image from "next/image";
import { CATEGORIES } from "@/lib/seo/taxonomy";
import { SITE } from "@/lib/seo/site";
import { getServerCatalog } from "@/lib/server/catalog";
import { publishableLocations } from "@/lib/seo/locations";

import { CreatorAttribution } from "@/components/creator-attribution";

/**
 * Footer information architecture.
 *
 * Every link is derived from live inventory: destinations come from
 * `publishableLocations()`, so a destination that falls below its inventory
 * threshold disappears from the footer in the same deploy that its page stops
 * existing. Nothing here can point at a 404, and there is no static list to
 * drift out of date.
 */
export async function SiteFooter() {
  const properties = await getServerCatalog();
  const destinations = publishableLocations(properties).slice(0, 6);

  const guides = [
    { href: "/guides/ecr-weekend-stays", label: "ECR weekend stays" },
    { href: "/guides/mahabalipuram-weekend", label: "Mahabalipuram weekend" },
    { href: "/guides/pondicherry-weekend-from-chennai", label: "Pondicherry from Chennai" },
    { href: "/guides/private-stays-near-chennai", label: "Choosing a stay near Chennai" },
  ];

  const company = [
    { href: "/about", label: "About" },
    { href: "/credits", label: "The Creator" },
    { href: "/contact", label: "Contact" },
    { href: "/legal/terms", label: "Terms" },
    { href: "/legal/privacy", label: "Privacy" },
    { href: "/legal/refunds", label: "Refunds" },
    { href: "/legal/cookies", label: "Cookies" },
  ];

  return (
    <footer className="seo-footer">
      <div className="seo-footer-grid">
        <div className="seo-footer-brand">
          <Link href="/" className="seo-brand">
            <Image src="/logo-mark.png" width={30} height={30} alt="" aria-hidden="true" sizes="30px" quality={80} />
            <span>{SITE.displayName}</span>
          </Link>
          <p>{SITE.description}</p>
          <p className="seo-footer-contact">
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </p>
        </div>

        <nav aria-label="Stay types">
          <h2>Explore</h2>
          <ul>
            {CATEGORIES.map((category) => (
              <li key={category.slug}>
                <Link href={category.href}>{category.plural}</Link>
              </li>
            ))}
            <li>
              <Link href="/stays">All stays</Link>
            </li>
            <li>
              <Link href="/buy">Estates for sale</Link>
            </li>
          </ul>
        </nav>

        {destinations.length ? (
          <nav aria-label="Popular destinations">
            <h2>Destinations</h2>
            <ul>
              {destinations.map((summary) => (
                <li key={summary.entry.slug}>
                  <Link href={`/locations/${summary.entry.slug}`}>{summary.entry.name}</Link>
                </li>
              ))}
              <li>
                <Link href="/locations">All destinations</Link>
              </li>
            </ul>
          </nav>
        ) : null}

        <nav aria-label="Guides">
          <h2>Guides</h2>
          <ul>
            {guides.map((guide) => (
              <li key={guide.href}>
                <Link href={guide.href}>{guide.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/guides">All guides</Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Company">
          <h2>Company</h2>
          <ul>
            {company.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/faq">FAQ</Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="seo-footer-legal-bar">
        <p className="seo-footer-legal">
          © {new Date().getFullYear()} {SITE.displayName}. All rights reserved.
        </p>
        <CreatorAttribution variant="footer" />
      </div>
    </footer>
  );
}
