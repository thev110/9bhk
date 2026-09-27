"use client";

import Link from "next/link";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import type { Property } from "@/lib/properties";
import { inr } from "@/lib/format";
import { Icon } from "./icon";
import { FavButton } from "./shell";

export function Rating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <span className="rating">
      <Icon name="star" />
      {rating.toFixed(1)} <span className="rc">({reviews})</span>
    </span>
  );
}

export function RailCard({ property }: { property: Property }) {
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
        {property.guestFavourite ? (
          <span className="badge-guest">
            <Icon name="award" />
            Guest favourite
          </span>
        ) : null}
        <FavButton id={property.id} name={property.name} />
      </div>
      <Link href={`/property/${property.id}`} className="hit" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="p-body">
          <h3 className="p-title">{property.name}</h3>
          <p className="p-loc">{property.location}</p>
          <div className="p-meta">
            <Rating rating={property.rating} reviews={property.reviews} />
            <span className="dot" aria-hidden />
            <span className="p-amen">{property.highlights}</span>
          </div>
          <p className="p-price num">
            <NumberFlow value={property.price} prefix="₹" /> <span className="per">/ night</span>
          </p>
        </div>
      </Link>
    </motion.article>
  );
}

export function FeatureCard({ property }: { property: Property }) {
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
        <FavButton id={property.id} name={property.name} />
      </div>
      <Link href={`/property/${property.id}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div className="p-body">
          <h3 className="p-title">{property.name}</h3>
          <p className="p-loc">{property.location}</p>
          <div className="p-meta">
            <Rating rating={property.rating} reviews={property.reviews} />
            <span className="dot" aria-hidden />
            <span className="p-amen">{property.highlights}</span>
          </div>
          <p className="p-price num">
            <NumberFlow value={property.price} prefix="₹" /> <span className="per">/ night</span>
          </p>
        </div>
      </Link>
    </motion.article>
  );
}

export function NearbyCard({ property }: { property: Property }) {
  return (
    <Link href={`/property/${property.id}`} className="n-card" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="n-thumb">
        <img src={property.image} width={400} height={400} alt={property.alt} />
      </div>
      <div className="n-body">
        <h3 className="p-title">{property.name}</h3>
        <p className="p-loc">{property.location}</p>
        <Rating rating={property.rating} reviews={property.reviews} />
        <p className="p-price num">
          <NumberFlow value={property.price} prefix="₹" /> <span className="per">/ night</span>
        </p>
      </div>
    </Link>
  );
}

export function ResultCard({ property }: { property: Property }) {
  return (
    <article className="rowcard hit">
      <div className="thumb">
        <img src={property.image} width={800} height={1000} alt={property.alt} />
        <FavButton id={property.id} name={property.name} small />
      </div>
      <div className="grow">
        <h3 className="p-title">
          <Link className="hit-link" href={`/property/${property.id}`}>
            {property.name}
          </Link>
        </h3>
        <p className="p-loc">{property.location}</p>
        <p className="p-amen" style={{ marginTop: 5 }}>
          {property.searchLine}
        </p>
        <div className="between" style={{ marginTop: 7 }}>
          <Rating rating={property.rating} reviews={property.reviews} />
          <span className="p-price num" style={{ margin: 0 }}>
            <NumberFlow value={property.price} prefix="₹" /> <span className="per">/ night</span>
          </span>
        </div>
      </div>
    </article>
  );
}
