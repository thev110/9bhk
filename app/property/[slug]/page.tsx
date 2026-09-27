"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/icon";
import { Rating } from "@/components/cards";
import { useCatalog } from "@/lib/catalog";
import { inr } from "@/lib/format";

export default function PropertyPage() {
  const params = useParams<{ slug: string }>();
  const { properties } = useCatalog();
  const property = properties.find((item) => item.id === params.slug);
  const { isSaved, toggleSaved, showToast } = useStore();

  if (!property) {
    return (
      <Shell>
        <PageBar title="Farmhouse" backHref="/" />
        <div className="empty">
          <h3>This stay is no longer listed.</h3>
          <Link className="btn" href="/search">
            Explore farmhouses
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell dock="bar">
      <PageBar
        title={property.name}
        backHref="/"
        right={
          <button
            className="icon-btn"
            type="button"
            aria-pressed={isSaved(property.id)}
            aria-label={`Save ${property.name}`}
            onClick={() => {
              toggleSaved(property.id);
              showToast(isSaved(property.id) ? `Removed ${property.name}` : `Saved ${property.name}`);
            }}
          >
            <Icon name={isSaved(property.id) ? "heart-fill" : "heart"} />
          </button>
        }
      />
      <div className="gal">
        <img src={property.image} alt={property.alt} style={{ gridColumn: "1 / -1", width: "100%", aspectRatio: "4/3", objectFit: "cover" }} />
      </div>
      <p className="pad muted" style={{ marginTop: 8, fontSize: 13, fontWeight: 700 }}>
        + 18 photos
      </p>

      <div className="pad mt stack">
        <div>
          <p className="muted" style={{ fontSize: 13, fontWeight: 700 }}>
            {property.type}
          </p>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 32, lineHeight: 1.1, marginTop: 4 }}>
            {property.name}
          </h2>
          <p className="p-loc">{property.location}</p>
          <div className="row mt" style={{ marginTop: 8 }}>
            <Rating rating={property.rating} reviews={property.reviews} />
            {property.guestFavourite ? <span className="pill ok">Guest favourite</span> : null}
          </div>
        </div>

        <div className="stats">
          {[
            [`${property.guests} guests`, "users"],
            [`${property.bedrooms} bedrooms`, "home"],
            [`${property.beds} beds`, "home"],
            [`${property.bathrooms} bathrooms`, "home"],
          ].map(([label]) => (
            <div key={label} className="stat">
              <p className="nb" style={{ fontSize: 16 }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        <div>
          <h3 className="sec-title">About this escape</h3>
          <p className="mt">{property.blurb}</p>
        </div>

        <div>
          <h3 className="sec-title">What this place offers</h3>
          <div className="amen mt">
            {property.amenities.map((item) => (
              <div className="a" key={item}>
                <Icon name="check" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="sec-title">Where you&apos;ll be</h3>
          <p className="muted">Exact location shared once your booking is confirmed.</p>
          <div className="card mt" style={{ minHeight: 140, background: "var(--surface-2)" }} aria-hidden />
        </div>

        <div>
          <h3 className="sec-title">House rules</h3>
          <ul className="stack sm" style={{ paddingLeft: 18, marginTop: 10 }}>
            <li>Check-in after 2:00 PM</li>
            <li>Check-out before 11:00 AM</li>
            <li>{property.guests} guests maximum</li>
            <li>No smoking indoors</li>
            <li>Quiet hours after 11:00 PM</li>
          </ul>
        </div>

        <div>
          <h3 className="sec-title">Cancellation policy</h3>
          <ul className="stack sm" style={{ paddingLeft: 18, marginTop: 10 }}>
            <li>Free cancellation up to 7 days before check-in</li>
            <li>50% refund up to 48 hours before check-in</li>
            <li>No refund within 48 hours of check-in</li>
          </ul>
        </div>
      </div>

      <div className="stickybar">
        <div>
          <p className="p-price num" style={{ margin: 0 }}>
            {inr(property.price)} <span className="per">/ night</span>
          </p>
          <p className="muted" style={{ fontSize: 12 }}>
            No charge yet
          </p>
        </div>
        <Link className="btn" href={`/book/${property.id}`}>
          Check availability
        </Link>
      </div>
    </Shell>
  );
}
