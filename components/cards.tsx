"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { formatInrCrores, hasGarage, type Property } from "@/lib/properties";
import { Icon, settingIcon } from "./icon";
import { FavButton } from "./shell";
import { useT } from "@/lib/i18n";
import { garageLabel } from "@/lib/i18n/garage";
import { settingLabel } from "@/lib/i18n/vibes";

/**
 * Listing cards.
 *
 * Every photo here goes through `next/image`. These were previously raw
 * `<img src="/assets/*.jpg">` at full source resolution — 105–280 kB each, with
 * no responsive `sizes`, no modern format and no reserved box — which is both a
 * Core Web Vitals problem (the card image is usually the LCP element on a
 * listing-heavy page) and an image-indexing problem (no `srcset` means Google
 * has to pick a single, often oversized, candidate).
 *
 * `sizes` is declared per layout rather than left at the default, because the
 * three cards here have very different rendered widths. The first card on a
 * grid is `priority` so its image is not lazy-loaded out of contention with the
 * rest of the page.
 *
 * `alt` comes from the listing's own data — see the `alt` field in
 * `lib/properties.ts`. It describes the photograph; it is never a keyword list.
 */

export function Rating({ rating, reviews }: { rating: number; reviews: number }) {
  const t = useT();
  return (
    <span className="rating" aria-label={t("a11y.rating", { rating: rating.toFixed(1), reviews })}>
      <Icon name="star" />
      {rating.toFixed(1)} <span className="rc">({reviews})</span>
    </span>
  );
}

/** Setting badge over the image — seaside is one option, not a badge of approval. */
function SettingBadge({ property }: { property: Property }) {
  const t = useT();
  return (
    <span className="badge-setting">
      <Icon name={settingIcon(property.setting)} />
      {settingLabel(t, property.setting)}
    </span>
  );
}

/** Garage pill, only when the listing actually has a garage spec. */
function GaragePill({ property, variant }: { property: Property; variant: "ready" | "vehicles" | "vault" | "port" }) {
  const t = useT();
  if (!hasGarage(property)) return null;
  const { garage } = property;
  const label =
    variant === "vehicles"
      ? t("property.vehicles", { garage: garage.name, n: garage.capacity })
      : variant === "vault"
        ? t("property.carVault", { n: garage.capacity })
        : variant === "port"
          ? t("property.carPort", { n: garage.capacity })
          : garage.supercarFriendly
            ? t("property.supercarReady", { n: garage.capacity })
            : t("property.carBay", { n: garage.capacity });
  return (
    <div className="p-garage-pill" title={garage.description}>
      <Icon name="car" />
      <span>{label}</span>
    </div>
  );
}

/** Shared alt resolution. Falls back to the property name, never to a keyword. */
function cardAlt(property: Property): string {
  return property.alt?.trim() || property.name;
}

export function RailCard({ property, priority = false }: { property: Property; priority?: boolean }) {
  const t = useT();
  return (
    <motion.article
      className="p-card"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
    >
      <div className="media">
        <Link href={`/property/${property.id}`} tabIndex={-1} aria-hidden="true">
          <Image
            src={property.image}
            width={800}
            height={1000}
            alt={cardAlt(property)}
            sizes="280px"
            priority={priority}
            quality={72}
          />
        </Link>
        {property.isForSale ? (
          <span className="badge-sale">{t("property.forSale")}</span>
        ) : property.guestFavourite ? (
          <span className="badge-guest">
            <Icon name="award" />
            {t("property.guestFavourite")}
          </span>
        ) : null}
        <SettingBadge property={property} />
        <FavButton id={property.id} name={property.name} />
      </div>
      <Link href={`/property/${property.id}`} className="hit" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="p-body">
          <h3 className="p-title">{property.name}</h3>
          <p className="p-loc">{property.settingName}</p>
          <div className="p-meta">
            <Rating rating={property.rating} reviews={property.reviews} />
            <span className="dot" aria-hidden />
            <span className="p-amen">{property.settingDetail}</span>
          </div>
          <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
            <span className="pill muted" style={{ fontSize: 11 }}>
              {t("property.bedroomsShort", { n: property.bedrooms })}
            </span>
            <GaragePill property={property} variant="ready" />
          </div>
          <div style={{ marginTop: 6 }}>
            {property.price > 0 ? (
              <p className="p-price num" style={{ margin: 0 }}>
                <NumberFlow value={property.price} prefix="₹" /> <span className="per">{t("property.perNight")}</span>
              </p>
            ) : null}
            {property.isForSale && property.salePrice ? (
              <p className="p-sale-tag" style={{ margin: property.price > 0 ? "2px 0 0" : "0", fontSize: 12 }}>
                <span>{property.price > 0 ? `Also for Sale · ${formatInrCrores(property.salePrice)}` : t("property.acquisition", { price: formatInrCrores(property.salePrice) })}</span>
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function FeatureCard({ property, priority = false }: { property: Property; priority?: boolean }) {
  const t = useT();
  return (
    <motion.article
      className="f-card"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
    >
      <div className="media">
        <Link href={`/property/${property.id}`} tabIndex={-1} aria-hidden="true">
          <Image
            src={property.image}
            width={1080}
            height={720}
            alt={cardAlt(property)}
            sizes="(max-width: 520px) 92vw, 430px"
            priority={priority}
            quality={72}
          />
        </Link>
        {property.isForSale ? (
          <span className="badge-sale">
            {t("property.forSale")} · {property.landArea || t("property.estate")}
          </span>
        ) : null}
        <SettingBadge property={property} />
        <FavButton id={property.id} name={property.name} />
      </div>
      <Link href={`/property/${property.id}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div className="p-body">
          <div className="between">
            <h3 className="p-title">{property.name}</h3>
            {property.isForSale && property.salePrice ? (
              <span className="pill info" style={{ fontWeight: 800 }}>
                {formatInrCrores(property.salePrice)}
              </span>
            ) : null}
          </div>
          <p className="p-loc">{property.settingName}</p>
          <div className="p-meta">
            <Rating rating={property.rating} reviews={property.reviews} />
            <span className="dot" aria-hidden />
            <span className="p-amen">{property.highlights}</span>
          </div>
          <div className="row wrap mt" style={{ gap: 6, marginTop: 8 }}>
            <span className="pill muted" style={{ fontSize: 11 }}>
              {t("property.bedroomsShort", { n: property.bedrooms })}
            </span>
            <GaragePill property={property} variant="vehicles" />
            {property.celebration ? (
              <span className="pill info" style={{ fontSize: 11, fontWeight: 800 }}>
                <Icon name="users" style={{ width: 12, height: 12 }} />
                {t("celebration.filter")}
              </span>
            ) : null}
            {hasGarage(property) && property.garage.evChargingKw >= 22 ? (
              <span className="pill forest">
                <Icon name="bolt" style={{ width: 12, height: 12 }} />
                {t("property.evKw", { kw: property.garage.evChargingKw })}
              </span>
            ) : null}
          </div>
          <div style={{ marginTop: 10 }}>
            {property.price > 0 ? (
              <p className="p-price num" style={{ margin: 0 }}>
                <NumberFlow value={property.price} prefix="₹" /> <span className="per">{t("property.perNight")}</span>
              </p>
            ) : null}
            {property.isForSale && property.salePrice ? (
              <p className="p-sale-tag" style={{ margin: property.price > 0 ? "3px 0 0" : "0", fontSize: 13 }}>
                <span>{property.price > 0 ? `Also for Sale · ${formatInrCrores(property.salePrice)}` : `${formatInrCrores(property.salePrice)} ${t("property.askingPrice")}`}</span>
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function NearbyCard({ property }: { property: Property }) {
  const t = useT();
  return (
    <Link href={`/property/${property.id}`} className="n-card" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="n-thumb">
        <Image
          src={property.image}
          width={400}
          height={400}
          alt={cardAlt(property)}
          sizes="96px"
          quality={68}
        />
        {property.isForSale ? (
          <span className="badge-sale" style={{ fontSize: 9, padding: "2px 6px", top: 4, left: 4, zIndex: 3 }}>
            {t("property.sale")}
          </span>
        ) : null}
        <span className="badge-setting" style={{ bottom: 4, left: 4, top: "auto", fontSize: 9, padding: "2px 6px" }}>
          <Icon name={settingIcon(property.setting)} />
          {settingLabel(t, property.setting)}
        </span>
      </div>
      <div className="n-body">
        <h3 className="p-title">{property.name}</h3>
        <p className="p-loc">{property.settingDetail}</p>
        {hasGarage(property) ? (
          <div className="p-garage-pill" style={{ margin: 0, padding: "2px 6px", fontSize: 10 }}>
            <Icon name="car" style={{ width: 11, height: 11 }} />
            <span>
              {property.garage.supercarFriendly
                ? t("property.carVault", { n: property.garage.capacity })
                : t("property.carPort", { n: property.garage.capacity })}
            </span>
          </div>
        ) : (
          <div className="p-garage-pill" style={{ margin: 0, padding: "2px 6px", fontSize: 10 }}>
            <Icon name="home" style={{ width: 11, height: 11 }} />
            <span>{t("property.bedroomsShort", { n: property.bedrooms })}</span>
          </div>
        )}
        <div style={{ marginTop: 4 }}>
          {property.price > 0 ? (
            <p className="p-price num" style={{ margin: 0 }}>
              <NumberFlow value={property.price} prefix="₹" /> <span className="per">{t("property.perNight")}</span>
            </p>
          ) : null}
          {property.isForSale && property.salePrice ? (
            <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 700, color: "var(--terracotta)", letterSpacing: "-0.01em" }}>
              {property.price > 0 ? `Also for Sale · ${formatInrCrores(property.salePrice)}` : `${formatInrCrores(property.salePrice)} ${t("property.askingPrice")}`}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function ResultCard({ property }: { property: Property }) {
  const t = useT();
  return (
    <article className="rowcard hit">
      <div className="thumb">
        <Image
          src={property.image}
          width={800}
          height={1000}
          alt={cardAlt(property)}
          sizes="96px"
          quality={68}
        />
        {property.isForSale ? (
          <span className="badge-sale" style={{ fontSize: 9, padding: "2px 6px", top: 4, left: 4, zIndex: 3 }}>
            {t("property.sale")}
          </span>
        ) : null}
        <FavButton id={property.id} name={property.name} small />
      </div>
      <div className="grow">
        <div className="between">
          <h3 className="p-title">
            <Link className="hit-link" href={`/property/${property.id}`}>
              {property.name}
            </Link>
          </h3>
          {property.isForSale && property.salePrice ? (
            <span className="pill info" style={{ fontSize: 11, fontWeight: 800 }}>
              Sale: {formatInrCrores(property.salePrice)}
            </span>
          ) : null}
        </div>
        <p className="p-loc">{property.settingName}</p>
        <p className="p-amen" style={{ marginTop: 4 }}>
          {settingLabel(t, property.setting)} · {property.settingDetail}
        </p>
        <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
          <span className="pill muted" style={{ fontSize: 11 }}>
            {t("property.bedroomsShort", { n: property.bedrooms })}
          </span>
          {hasGarage(property) ? (
            <div className="p-garage-pill" style={{ margin: 0 }}>
              <Icon name="car" />
              <span>
                {property.garage.capacity}-Car {garageLabel(t, property.garage.type)}
              </span>
            </div>
          ) : null}
        </div>
        <div className="between" style={{ marginTop: 8, alignItems: "baseline" }}>
          <Rating rating={property.rating} reviews={property.reviews} />
          <div style={{ textAlign: "right" }}>
            {property.price > 0 ? (
              <span className="p-price num" style={{ margin: 0, display: "block" }}>
                <NumberFlow value={property.price} prefix="₹" /> <span className="per">{t("property.perNight")}</span>
              </span>
            ) : null}
            {property.isForSale && property.salePrice ? (
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--terracotta)", display: "block", marginTop: 2 }}>
                {property.price > 0 ? `Also for Sale · ${formatInrCrores(property.salePrice)}` : `${formatInrCrores(property.salePrice)} ${t("property.askingPrice")}`}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
