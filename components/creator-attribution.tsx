import React from "react";

export type CreatorAttributionProps = {
  variant?: "footer" | "micro" | "about";
  className?: string;
};

/**
 * Universal creator attribution component for Rathnavel Karthi.
 *
 * Implements the Global Creator & Developer Attribution System:
 * - Subtle, clean, accessible link to LinkedIn.
 * - Respects product brand hierarchy without visual competition.
 * - Fully responsive across mobile and desktop.
 */
export function CreatorAttribution({
  variant = "footer",
  className = "",
}: CreatorAttributionProps) {
  if (variant === "micro") {
    return (
      <span className={`creator-attribution-micro ${className}`.trim()}>
        Built by{" "}
        <a
          href="https://www.linkedin.com/in/rathnavel-karthi-114991135/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Connect with Rathnavel Karthi on LinkedIn"
          className="creator-attribution-link"
        >
          Rathnavel Karthi
        </a>
      </span>
    );
  }

  if (variant === "about") {
    return (
      <div className={`creator-attribution-card ${className}`.trim()}>
        <h3 className="creator-attribution-title">Built by Rathnavel Karthi</h3>
        <p className="creator-attribution-bio">
          Rathnavel Karthi is an independent product builder and full-stack developer from Chennai, India,
          focused on turning ideas into real-world digital products. His work spans software products,
          AI-powered applications, automation systems, web platforms, SaaS products, digital experiences and
          business-focused technology solutions.
        </p>
        <p className="creator-attribution-bio">
          He combines product thinking, software development, AI, automation, UX and rapid experimentation
          to take products from concept to production. The goal is simple: build useful technology, ship it
          fast, and continuously improve it.
        </p>
        <p className="creator-attribution-action">
          <a
            href="https://www.linkedin.com/in/rathnavel-karthi-114991135/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Connect with Rathnavel Karthi on LinkedIn"
            className="creator-attribution-link-accent"
          >
            Connect with Rathnavel Karthi on LinkedIn →
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className={`creator-attribution-footer ${className}`.trim()}>
      <span>Created &amp; Developed by </span>
      <a
        href="https://www.linkedin.com/in/rathnavel-karthi-114991135/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Connect with Rathnavel Karthi on LinkedIn"
        className="creator-attribution-link"
      >
        Rathnavel Karthi
      </a>
    </div>
  );
}
