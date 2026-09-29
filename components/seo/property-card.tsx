import Image from "next/image";
import Link from "next/link";
import type { SeoProperty } from "@/lib/catalog-rows";
import { hasPool, isBeachfront, inr, plural } from "@/lib/seo/copy";
import { locationFor } from "@/lib/seo/locations";
import { categoryFor } from "@/lib/seo/taxonomy";
import { formatInrCrores } from "@/lib/properties";
import { Icon } from "@/components/icon";

/**
 * Server-rendered listing card.
 *
 * Uses `next/image` (the app's existing cards use raw `<img>`, which costs
 * every one of them LCP and CLS) and carries a descriptive `alt` built from the
 * listing's own data. Alt text describes the photograph — "the infinity pool at
 * this house" — and never repeats a keyword list.
 */
export function PropertyCard({
  property,
  priority = false,
  showCategory = true,
}: {
  property: SeoProperty;
  priority?: boolean;
  showCategory?: boolean;
}) {
  const location = locationFor(property);
  const category = categoryFor(property);
  const href = `/property/${property.id}`;
  const forSale = property.isForSale && property.salePrice;

  const facts = [
    property.guests > 0 ? plural(property.guests, "guest", "guests") : "",
    property.bedrooms > 0 ? plural(property.bedrooms, "bedroom") : "",
    hasPool(property) ? "Private pool" : "",
    isBeachfront(property) ? "Beach access" : "",
    property.celebration ? `Events up to ${property.celebration.maxEventGuests}` : "",
  ].filter(Boolean);

  return (
    <article className="seo-card">
      <Link href={href} className="seo-card-media" tabIndex={-1} aria-hidden="true">
        <Image
          src={property.image}
          alt={property.alt || property.name}
          fill
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 44vw, 30vw"
          priority={priority}
          quality={72}
        />
        {property.setting ? (
          <span className="seo-card-tag">{property.setting.replace("_", " ")}</span>
        ) : null}
      </Link>

      <div className="seo-card-body">
        {showCategory ? (
          <p className="seo-card-eyebrow">
            <Link href={category.href}>{category.plural}</Link>
            {location ? (
              <>
                {" · "}
                <Link href={`/locations/${location.slug}`}>{location.name}</Link>
              </>
            ) : null}
          </p>
        ) : null}

        <h3 className="seo-card-title">
          <Link href={href}>{property.name}</Link>
        </h3>

        <p className="seo-card-type">{property.type}</p>

        {property.highlights ? <p className="seo-card-blurb">{property.highlights}</p> : null}

        {facts.length ? (
          <ul className="seo-card-facts">
            {facts.slice(0, 4).map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        ) : null}

        <p className="seo-card-price">
          {forSale ? (
            <>
              <strong>{formatInrCrores(property.salePrice!)}</strong>
              <span> asking</span>
            </>
          ) : (
            <>
              <strong>{inr(property.price)}</strong>
              <span> a night, whole house</span>
            </>
          )}
        </p>
      </div>
    </article>
  );
}

/** Compact row card used in related-stays rails and sidebars. */
export function PropertyRowCard({ property }: { property: SeoProperty }) {
  const location = locationFor(property);
  return (
    <article className="seo-row">
      <Link href={`/property/${property.id}`} className="seo-row-media" tabIndex={-1} aria-hidden="true">
        <Image
          src={property.image}
          alt={property.alt || property.name}
          fill
          sizes="96px"
          quality={68}
        />
      </Link>
      <div className="seo-row-body">
        <h3>
          <Link href={`/property/${property.id}`}>{property.name}</Link>
        </h3>
        <p className="seo-row-meta">
          {location ? location.name : property.city}
          {property.bedrooms > 0 ? ` · ${plural(property.bedrooms, "bedroom")}` : ""}
        </p>
        <p className="seo-row-price">
          {property.isForSale && property.salePrice
            ? formatInrCrores(property.salePrice)
            : `${inr(property.price)} / night`}
        </p>
      </div>
    </article>
  );
}

/** A labelled group of listings. */
export function PropertyGrid({
  properties,
  priorityCount = 0,
  showCategory = true,
  emptyLabel = "No published listings in this collection yet.",
}: {
  properties: SeoProperty[];
  priorityCount?: number;
  showCategory?: boolean;
  emptyLabel?: string;
}) {
  if (!properties.length) {
    return (
      <p className="seo-empty">
        <Icon name="home" className="ico" /> {emptyLabel}
      </p>
    );
  }
  return (
    <ul className="seo-grid">
      {properties.map((property, index) => (
        <li key={property.id}>
          <PropertyCard property={property} priority={index < priorityCount} showCategory={showCategory} />
        </li>
      ))}
    </ul>
  );
}
