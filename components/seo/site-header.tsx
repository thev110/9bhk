import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/icon";
import { SITE } from "@/lib/seo/site";

/**
 * Site header for the server-rendered editorial surfaces.
 *
 * A real `<header>` + `<nav>` with a skip link, so the pages that exist purely
 * for crawlers and AI answer engines are still fully navigable by keyboard and
 * screen-reader users. The app-shell pages keep their existing mobile chrome —
 * this frame is additive, not a replacement.
 */
export function SiteHeader({ current }: { current?: string }) {
  const links = [
    { href: "/stays", label: "All stays" },
    { href: "/farmhouses", label: "Farmhouses" },
    { href: "/villas", label: "Villas" },
    { href: "/beach-houses", label: "Beach houses" },
    { href: "/locations", label: "Destinations" },
    { href: "/guides", label: "Guides" },
    { href: "/buy", label: "For sale" },
  ];

  return (
    <header className="seo-header">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="seo-header-inner">
        <Link href="/" className="seo-brand" aria-label={`${SITE.displayName} home`}>
          {/* 1.8 MB source rendered at 30 px: the optimiser is the whole point. */}
          <Image src="/logo-mark.png" width={30} height={30} alt="" aria-hidden="true" sizes="30px" priority quality={80} />
          <span>{SITE.displayName}</span>
        </Link>
        <nav aria-label="Primary">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={current === link.href ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

/** Shared CTA used at the foot of every landing page. */
export function EditorialCta({
  title = "Ready to look at the houses?",
  body = "Every listing is a whole home taken exclusively. Open one to see the capacity, amenities and nightly rate the host has published.",
  primary = { href: "/stays", label: "Browse all stays" },
  secondary = { href: "/faq", label: "How booking works" },
}: {
  title?: string;
  body?: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="seo-cta" aria-labelledby="seo-cta-title">
      <div>
        <h2 id="seo-cta-title">{title}</h2>
        <p>{body}</p>
      </div>
      <div className="seo-cta-actions">
        <Link className="seo-btn" href={primary.href}>
          {primary.label}
          <Icon name="arrow" className="ico" />
        </Link>
        <Link className="seo-btn seo-btn-ghost" href={secondary.href}>
          {secondary.label}
        </Link>
      </div>
    </section>
  );
}
