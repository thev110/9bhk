"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { formatRange, inr } from "@/lib/format";
import { getProperty } from "@/lib/properties";
import { useStore, type Booking } from "@/lib/store";

const TABS = ["Upcoming", "Past", "Cancelled"] as const;

function bucket(status: Booking["status"]): (typeof TABS)[number] {
  if (status === "completed") return "Past";
  if (status === "cancelled") return "Cancelled";
  return "Upcoming";
}

export default function TripsPage() {
  const { bookings } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Upcoming");
  const [open, setOpen] = useState<string | null>(bookings[0]?.id ?? null);
  const list = useMemo(() => bookings.filter((b) => bucket(b.status) === tab), [bookings, tab]);
  const selected = bookings.find((b) => b.id === open);

  return (
    <Shell nav="trips">
      <header className="page-head">
        <h1>Trips</h1>
      </header>
      <div className="pad mt">
        <div className="seg" role="tablist">
          {TABS.map((name) => (
            <button key={name} type="button" role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>
              {name}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <h3>{tab === "Upcoming" ? "Your next escape starts here." : tab === "Cancelled" ? "Nothing cancelled so far — when you book a farmhouse, it shows up under Trips." : "Past stays will gather here."}</h3>
          <Link className="btn" href="/">
            Explore farmhouses
          </Link>
        </div>
      ) : (
        <div className="stack pad mt">
          {list.map((booking) => {
            const property = getProperty(booking.propertyId);
            if (!property) return null;
            return (
              <article className="card" key={booking.id}>
                <div className="between">
                  <span className={`pill ${booking.status === "confirmed" ? "ok" : booking.status === "awaiting" ? "warn" : ""}`}>
                    {booking.status === "confirmed" ? "Confirmed" : booking.status === "awaiting" ? "Awaiting host" : booking.status === "completed" ? "Completed" : "Cancelled"}
                  </span>
                  <strong className="num">{inr(booking.total)}</strong>
                </div>
                <h3 className="p-title mt">{property.name}</h3>
                <p className="p-loc">{property.location}</p>
                <p className="muted">
                  {formatRange(booking.checkIn, booking.checkOut)} · {booking.adults + booking.children} guests
                </p>
                <button className="btn outline sm mt" type="button" onClick={() => setOpen(booking.id)}>
                  View trip
                </button>
                {booking.status === "completed" ? (
                  <div className="row mt">
                    <button className="btn ghost sm" type="button">
                      Write a review
                    </button>
                    <Link className="btn sm" href={`/property/${property.id}`}>
                      Book again
                    </Link>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {selected && getProperty(selected.propertyId) ? (
        <TripSheet booking={selected} onClose={() => setOpen(null)} />
      ) : null}
    </Shell>
  );
}

function TripSheet({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const property = getProperty(booking.propertyId);
  if (!property) return null;
  return (
    <>
      <div className="scrim is-open" onClick={onClose} />
      <div className="sheet is-open" role="dialog" aria-modal="true" aria-label="Your trip">
        <div className="sheet-grab" />
        <div className="sheet-head">
          <h2>Your trip</h2>
          <p className="muted">Booking #{booking.code}</p>
        </div>
        <div className="card">
          <h3>{property.name}</h3>
          <div className="sumline">
            <span className="k">Check-in</span>
            <span>{formatRange(booking.checkIn, booking.checkIn)} · 2:00 PM</span>
          </div>
          <div className="sumline">
            <span className="k">Check-out</span>
            <span>{formatRange(booking.checkOut, booking.checkOut)} · 11:00 AM</span>
          </div>
          <div className="sumline">
            <span className="k">Guests</span>
            <span>
              {booking.adults + booking.children} guests · {Math.max(1, Math.round((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000))} nights
            </span>
          </div>
          <div className="sumline total">
            <span className="k">Total paid</span>
            <span className="num">{inr(booking.total)}</span>
          </div>
        </div>
        <p className="muted mt">Free cancellation until 5 Jun 2026. After that, 50% refund until 10 Jun 2026.</p>
        <div className="row mt">
          <button className="btn outline grow" type="button">
            Contact host
          </button>
          <button className="btn ghost grow" type="button">
            Get help
          </button>
        </div>
      </div>
    </>
  );
}
