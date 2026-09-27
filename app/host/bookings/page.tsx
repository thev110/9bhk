"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { formatRange, inr } from "@/lib/format";
import { useStore, type Booking } from "@/lib/store";

function bucket(status: Booking["status"]): "Upcoming" | "Past" | "Cancelled" {
  if (status === "completed") return "Past";
  if (status === "cancelled") return "Cancelled";
  return "Upcoming";
}

function HostBookings() {
  const params = useSearchParams();
  const { bookings, confirmBooking, showToast } = useStore();
  const initial = params.get("tab") === "earnings" ? "Earnings" : params.get("tab") === "calendar" ? "Calendar" : "Upcoming";
  const [tab, setTab] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const rows = bookings.filter((booking) => bucket(booking.status) === tab);
  const open = bookings.find((booking) => booking.id === openId);

  return (
    <Shell>
      <PageBar title="Bookings" backHref="/host" />
      <header className="page-head">
        <p className="eyebrow">Host workspace</p>
        <h1>Manage your stays</h1>
        <p className="sub">Every reservation, calendar block and payout in one place.</p>
      </header>
      <div className="pad">
        <div className="seg">
          {["Upcoming", "Past", "Cancelled", "Calendar", "Earnings"].map((name) => (
            <button key={name} type="button" aria-selected={tab === name} onClick={() => setTab(name)}>
              {name}
            </button>
          ))}
        </div>
      </div>

      {tab === "Calendar" ? (
        <div className="pad mt stack">
          <div className="legend">
            <span>Available</span>
            <span>Booked</span>
            <span>Blocked</span>
          </div>
          <div className="card">
            <h3>Tonight&apos;s rules</h3>
            <div className="sumline">
              <span className="k">Minimum stay</span>
              <span>2 nights</span>
            </div>
            <div className="sumline">
              <span className="k">Weekend price</span>
              <span>₹8,500 / night</span>
            </div>
            <div className="sumline">
              <span className="k">Check-in window</span>
              <span>2 PM – 8 PM</span>
            </div>
          </div>
          <p className="muted">Block dates when the farmhouse is unavailable. Guests can&apos;t book across blocked nights.</p>
          <button className="btn block" type="button">
            Block dates
          </button>
        </div>
      ) : null}

      {tab === "Earnings" ? (
        <div className="pad mt stack">
          <div className="card">
            <p className="muted">Net earnings · June 2026</p>
            <p className="nb" style={{ fontSize: 32, fontWeight: 800 }}>
              ₹1,14,816
            </p>
            <p className="muted">Across 3 farmhouses · 14 nights booked · ▲ 18%</p>
          </div>
          <div className="card">
            <h3>Breakdown</h3>
            <div className="sumline">
              <span className="k">Gross bookings</span>
              <span>₹1,24,800</span>
            </div>
            <div className="sumline">
              <span className="k">Platform fees (8%)</span>
              <span>−₹9,984</span>
            </div>
            <div className="sumline">
              <span className="k">Cleaning fees collected</span>
              <span>₹4,200</span>
            </div>
            <div className="sumline total">
              <span className="k">Net earnings</span>
              <span>₹1,14,816</span>
            </div>
          </div>
          <div className="card">
            <h3>Payouts</h3>
            <div className="sumline">
              <span className="k">Pending payout</span>
              <span>₹42,300</span>
            </div>
            <p className="muted">arrives 5 Jul 2026</p>
            <div className="sumline">
              <span className="k">Paid out</span>
              <span>₹72,516</span>
            </div>
            <p className="muted">last payout 28 Jun 2026</p>
            <div className="sumline">
              <span className="k">Payout account</span>
              <span>HDFC ••4821</span>
            </div>
            <button className="btn outline sm mt" type="button">
              Download statement
            </button>
          </div>
          <p className="muted">Amounts come from your payment provider — the prototype shows the shape of the data, not real accounting.</p>
        </div>
      ) : null}

      {tab !== "Calendar" && tab !== "Earnings" ? (
        <div className="stack pad mt">
          {rows.length === 0 ? (
            <div className="empty">
              <h3>No {tab.toLowerCase()} stays yet.</h3>
              <p>Guest name, email and phone show up here as soon as someone pays on UPI.</p>
            </div>
          ) : (
            rows.map((row) => (
              <article className="card" key={row.id}>
                <div className="between">
                  <span className={`pill ${row.status === "confirmed" || row.status === "completed" ? "ok" : "warn"}`}>
                    {row.status === "awaiting" ? "Awaiting" : row.status === "confirmed" ? "Confirmed" : row.status === "completed" ? "Completed" : "Cancelled"}
                  </span>
                  <strong className="num">{inr(row.total)}</strong>
                </div>
                <h3 className="mt">{row.propertyName || row.propertyId}</h3>
                <p className="muted">
                  {formatRange(row.checkIn, row.checkOut)} · {row.adults + row.children} guests
                </p>
                <div className="row mt">
                  <span className="avatar">{row.guestName.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <strong>{row.guestName}</strong>
                    <p className="muted">{row.guestEmail || "No email yet"}</p>
                    <p className="muted">{row.guestPhone || "No phone yet"}</p>
                  </div>
                </div>
                <button className="btn outline sm mt" type="button" onClick={() => setOpenId(row.id)}>
                  View details
                </button>
              </article>
            ))
          )}
          {open ? (
            <>
              <div className="scrim is-open" onClick={() => setOpenId(null)} />
              <div className="sheet is-open" role="dialog" aria-modal="true" aria-label="Booking details">
                <div className="sheet-grab" />
                <div className="sheet-head">
                  <h2>{open.guestName}</h2>
                  <p className="muted">Booking #{open.code}</p>
                </div>
                <div className="card">
                  <div className="sumline"><span className="k">Email</span><span>{open.guestEmail || "—"}</span></div>
                  <div className="sumline"><span className="k">Phone</span><span>{open.guestPhone || "—"}</span></div>
                  <div className="sumline"><span className="k">UPI</span><span>{open.upiId || "—"}</span></div>
                  <div className="sumline"><span className="k">Reference</span><span>{open.paymentRef || "Not added"}</span></div>
                  <div className="sumline total"><span className="k">Total</span><span className="num">{inr(open.total)}</span></div>
                </div>
                {open.status === "awaiting" ? (
                  <button
                    className="btn block mt"
                    type="button"
                    onClick={() => {
                      confirmBooking(open.id);
                      showToast("Stay confirmed. The guest can see it in notifications.");
                      setOpenId(null);
                    }}
                  >
                    Confirm stay
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </Shell>
  );
}

export default function HostBookingsPage() {
  return (
    <Suspense fallback={<Shell><PageBar title="Bookings" backHref="/host" /></Shell>}>
      <HostBookings />
    </Suspense>
  );
}
