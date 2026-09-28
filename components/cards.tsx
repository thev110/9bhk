"use client";

import Link from "next/link";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { formatInrCrores, type Property } from "@/lib/properties";
import { Icon } from "./icon";
import { FavButton } from "./shell";
import { useT } from "@/lib/i18n";
import { garageLabel } from "@/lib/i18n/garage";

export function Rating({ rating, reviews }: { rating: number; reviews: number }) {
  const t = useT();
  return (
    <span className="rating" aria-label={t("a11y.rating", { rating: rating.toFixed(1), reviews })}>
      <Icon name="star" />
      {rating.toFixed(1)} <span className="rc">({reviews})</span>
    </span>
  );
}

export function RailCard({ property }: { property: Property }) {
  const t = useT();
  return (
    <motion.article
      className="p-card"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
    >
      <div className="media">
        <Link href={`/property/${property.id}`}>
          <img src={property.image} width={800} height={1000} alt={property.alt} />
        </Link>
        {property.isForSale ? (
          <span className="badge-sale">{t("property.forSale")}</span>
        ) : property.guestFavourite ? (
          <span className="badge-guest">
            <Icon name="award" />
            {t("property.guestFavourite")}
          </span>
        ) : null}
        <span className="badge-coastal">
          <Icon name="waves" />
          {t("property.beachFrontage", { ft: property.beachFrontage.split(" ")[0] })}
        </span>
        <FavButton id={property.id} name={property.name} />
      </div>
      <Link href={`/property/${property.id}`} className="hit" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="p-body">
          <h3 className="p-title">{property.name}</h3>
          <p className="p-loc">{property.location}</p>
          <div className="p-meta">
            <Rating rating={property.rating} reviews={property.reviews} />
            <span className="dot" aria-hidden />
            <span className="p-amen">{property.coastalZone}</span>
          </div>
          <div className="p-garage-pill" title={property.garage.description}>
            <Icon name="car" />
            <span>
              {property.garage.supercarFriendly
                ? t("property.supercarReady", { n: property.garage.capacity })
                : t("property.carBay", { n: property.garage.capacity })}
            </span>
          </div>
          {property.isForSale && property.salePrice ? (
            <p className="p-sale-tag">
              <span>{t("property.acquisition", { price: formatInrCrores(property.salePrice) })}</span>
            </p>
          ) : (
            <p className="p-price num">
              <NumberFlow value={property.price} prefix="₹" /> <span className="per">{t("property.perNight")}</span>
            </p>
          )}
        </div>
      </Link>
    </motion.article>
  );
}

export function FeatureCard({ property }: { property: Property }) {
  const t = useT();
  return (
    <motion.article
      className="f-card"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
    >
      <div className="media">
        <Link href={`/property/${property.id}`}>
          <img src={property.image} width={1080} height={720} alt={property.alt} />
        </Link>
        {property.isForSale ? (
          <span className="badge-sale">
            {t("property.forSale")} · {property.landArea || t("property.coastalEstate")}
          </span>
        ) : null}
        <span className="badge-coastal">
          <Icon name="waves" />
          {property.beachFrontage}
        </span>
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
          <p className="p-loc">{property.location}</p>
          <div className="p-meta">
            <Rating rating={property.rating} reviews={property.reviews} />
            <span className="dot" aria-hidden />
            <span className="p-amen">{property.highlights}</span>
          </div>
          <div className="row wrap mt" style={{ marginTop: 8 }}>
            <div className="p-garage-pill" title={property.garage.description}>
              <Icon name="car" />
              <span>{t("property.vehicles", { garage: property.garage.name, n: property.garage.capacity })}</span>
            </div>
            {property.garage.evChargingKw >= 22 ? (
              <span className="pill forest">
                <Icon name="bolt" style={{ width: 12, height: 12 }} />
                {t("property.evKw", { kw: property.garage.evChargingKw })}
              </span>
            ) : null}
          </div>
          <p className="p-price num" style={{ marginTop: 10 }}>
            {property.isForSale && property.salePrice ? (
              <>
                <span>{formatInrCrores(property.salePrice)}</span>{" "}
                <span className="per">{t("property.askingPrice")}</span>
              </>
            ) : (
              <>
                <NumberFlow value={property.price} prefix="₹" /> <span className="per">{t("property.perNight")}</span>
              </>
            )}
          </p>
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
        <img src={property.image} width={400} height={400} alt={property.alt} />
        {property.isForSale ? (
          <span className="badge-sale" style={{ fontSize: 9, padding: "2px 6px", top: 4, left: 4 }}>
            {t("property.sale")}
          </span>
        ) : null}
      </div>
      <div className="n-body">
        <h3 className="p-title">{property.name}</h3>
        <p className="p-loc">{property.beachFrontage}</p>
        <div className="p-garage-pill" style={{ margin: 0, padding: "2px 6px", fontSize: 10 }}>
          <Icon name="car" style={{ width: 11, height: 11 }} />
          <span>
            {property.garage.supercarFriendly
              ? t("property.carVault", { n: property.garage.capacity })
              : t("property.carPort", { n: property.garage.capacity })}
          </span>
        </div>
        <p className="p-price num" style={{ marginTop: 4 }}>
          {property.isForSale && property.salePrice ? (
            formatInrCrores(property.salePrice)
          ) : (
            <>
              <NumberFlow value={property.price} prefix="₹" /> <span className="per">{t("property.perNight")}</span>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}

export function ResultCard({ property }: { property: Property }) {
  const t = useT();
  return (
    <article className="rowcard hit">
      <div className="thumb">
        <img src={property.image} width={800} height={1000} alt={property.alt} />
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
              {formatInrCrores(property.salePrice)}
            </span>
          ) : null}
        </div>
        <p className="p-loc">{property.location}</p>
        <p className="p-amen" style={{ marginTop: 4 }}>
          {property.beachFrontage} · {property.coastalZone}
        </p>
        <div className="p-garage-pill" style={{ marginTop: 5 }}>
          <Icon name="car" />
          <span>
            {property.garage.capacity}-Car {garageLabel(t, property.garage.type)}
          </span>
        </div>
        <div className="between" style={{ marginTop: 8 }}>
          <Rating rating={property.rating} reviews={property.reviews} />
          <span className="p-price num" style={{ margin: 0 }}>
            {property.isForSale && property.salePrice ? (
              formatInrCrores(property.salePrice)
            ) : (
              <>
                <NumberFlow value={property.price} prefix="₹" /> <span className="per">{t("property.perNight")}</span>
              </>
            )}
          </span>
        </div>
      </div>
    </article>
  );
}
