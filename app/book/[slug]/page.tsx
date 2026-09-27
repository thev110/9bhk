"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { Icon } from "@/components/icon";
import { useCatalog } from "@/lib/catalog";
import { formatRange, inr, isoDate, nightsBetween, quote } from "@/lib/format";
import { useStore } from "@/lib/store";

const BLOCKED = new Set(["2026-10-04", "2026-10-05", "2026-10-18"]);
const BOOKED = new Set(["2026-10-11", "2026-10-12"]);

function monthMatrix(cursor: Date) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function BookPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { properties } = useCatalog();
  const property = properties.find((item) => item.id === params.slug);
  const { user, addBooking, showToast } = useStore();
  const upiId = user?.upiId || "9bhk@okhdfcbank";
  const [step, setStep] = useState(0);
  const [cursor, setCursor] = useState(new Date(2026, 9, 1));
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [paymentRef, setPaymentRef] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState<{ code: string; total: number } | null>(null);

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const totals = property && nights >= 2 ? quote(property.price, property.cleaning, nights) : null;
  const days = useMemo(() => monthMatrix(cursor), [cursor]);

  if (!property) {
    return (
      <Shell>
        <PageBar title="Book your stay" backHref="/" />
        <div className="empty">
          <h3>Choose a farmhouse first.</h3>
          <Link className="btn" href="/">
            Back to explore
          </Link>
        </div>
      </Shell>
    );
  }

  function pick(date: string) {
    if (BLOCKED.has(date) || BOOKED.has(date)) return;
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(date);
      setCheckOut(null);
      return;
    }
    if (date <= checkIn) {
      setCheckIn(date);
      return;
    }
    const span = nightsBetween(checkIn, date);
    if (span < 2) {
      showToast("Minimum stay is 2 nights.");
      return;
    }
    setCheckOut(date);
  }

  function dayClass(date: string, inMonth: boolean) {
    if (!inMonth) return "cal-d is-muted";
    if (BOOKED.has(date)) return "cal-d is-booked";
    if (BLOCKED.has(date)) return "cal-d is-blocked";
    if (date === checkIn || date === checkOut) return "cal-d is-on";
    if (checkIn && checkOut && date > checkIn && date < checkOut) return "cal-d is-in";
    return "cal-d";
  }

  function continueGuests() {
    if (!checkIn || !checkOut || nights < 2) {
      showToast("Pick a check-in and check-out. Minimum stay is 2 nights.");
      return;
    }
    setStep(1);
  }

  function validateGuest() {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Please add the name on the booking.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "We'll send your confirmation here.";
    if (phone.replace(/\D/g, "").length < 10) next.phone = "The host may call to confirm arrival time.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function pay() {
    if (!validateGuest()) return;
    if (!property || !totals || !checkIn || !checkOut) return;
    const propertyId = property.id;
    const propertyName = property.name;
    setPaying(true);
    window.setTimeout(() => {
      const code = `9B-${Math.floor(40000 + Math.random() * 5000)}`;
      addBooking({
        id: code,
        code,
        propertyId,
        propertyName,
        checkIn,
        checkOut,
        adults,
        children,
        total: totals.total,
        status: "awaiting",
        guestName: name.trim(),
        guestEmail: email.trim(),
        guestPhone: phone.trim(),
        upiId,
        paymentRef: paymentRef.trim() || undefined,
      });
      setPaying(false);
      setDone({ code, total: totals.total });
      setStep(4);
    }, 600);
  }

  const titles = ["Choose dates", "Who's staying?", "Your stay", "Guest details", "Booking confirmed"];

  return (
    <Shell>
      <PageBar title={done ? "Booking confirmed" : "Book your stay"} backHref={`/property/${property.id}`} />
      <div className="pad mt">
        <p className="muted">
          Step {Math.min(step + 1, 4)} of 4
        </p>
        <div className="pbar mt" aria-hidden>
          <i style={{ width: `${Math.min(100, ((step + 1) / 4) * 100)}%` }} />
        </div>
        <h2 className="mt" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 30 }}>
          {titles[step]}
        </h2>
      </div>

      {step === 0 ? (
        <div className="pad mt stack">
          <p className="muted">Minimum stay is 2 nights. Blocked and booked dates can&apos;t be selected.</p>
          <div className="between">
            <button className="icon-btn" type="button" aria-label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
              <Icon name="back" />
            </button>
            <strong>{cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</strong>
            <button className="icon-btn" type="button" aria-label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
              <Icon name="arrow" />
            </button>
          </div>
          <div className="cal-grid">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span className="dow" key={`${d}${i}`}>
                {d}
              </span>
            ))}
            {days.map((d) => {
              const iso = isoDate(d);
              const inMonth = d.getMonth() === cursor.getMonth();
              const disabled = !inMonth || BLOCKED.has(iso) || BOOKED.has(iso);
              return (
                <button key={iso + d.getMonth()} className={dayClass(iso, inMonth)} type="button" disabled={disabled} onClick={() => pick(iso)}>
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          <div className="legend">
            <span>Available</span>
            <span>Booked</span>
            <span>Blocked</span>
          </div>
          <div className="card">
            <div className="sumline">
              <span className="k">Check-in</span>
              <span>{checkIn ? formatRange(checkIn, checkIn) : "Not set"}</span>
            </div>
            <div className="sumline">
              <span className="k">Check-out</span>
              <span>{checkOut ? formatRange(checkOut, checkOut) : "Not set"}</span>
            </div>
            <div className="sumline">
              <span className="k">Nights</span>
              <span>{nights || "—"}</span>
            </div>
          </div>
          <button className="btn block" type="button" onClick={continueGuests}>
            Continue
          </button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="pad mt stack">
          <p className="muted">Up to {property.guests} guests at {property.name}.</p>
          <GuestRow label="Adults" help="Ages 13 and above" value={adults} min={1} max={property.guests - children} onChange={setAdults} />
          <GuestRow label="Children" help="Ages 2 to 12" value={children} min={0} max={property.guests - adults} onChange={setChildren} />
          <div className="row">
            <button className="btn outline" type="button" onClick={() => setStep(0)}>
              Back
            </button>
            <button className="btn grow" type="button" onClick={() => setStep(2)}>
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 && totals && checkIn && checkOut ? (
        <div className="pad mt stack">
          <p className="muted">
            {nights} nights · {adults + children} guests
          </p>
          <div className="rowcard">
            <div className="thumb">
              <img src={property.image} alt="" />
            </div>
            <div>
              <h3 className="p-title">{property.name}</h3>
              <p className="p-loc">{property.location}</p>
              <p className="muted">{formatRange(checkIn, checkOut)}</p>
            </div>
          </div>
          <div className="card">
            <div className="sumline">
              <span className="k">Nightly stay</span>
              <span className="num">{inr(totals.stay)}</span>
            </div>
            <div className="sumline">
              <span className="k">Cleaning fee</span>
              <span className="num">{inr(totals.cleaning)}</span>
            </div>
            <div className="sumline">
              <span className="k">Taxes (12%)</span>
              <span className="num">{inr(totals.tax)}</span>
            </div>
            <div className="sumline">
              <span className="k">Discount</span>
              <span className="num">−₹0</span>
            </div>
            <div className="sumline total">
              <span className="k">Total</span>
              <span className="num">{inr(totals.total)}</span>
            </div>
          </div>
          <p className="muted">Pay the host on UPI, then send the stay for confirmation. Nothing is charged inside the app.</p>
          <div className="row">
            <button className="btn outline" type="button" onClick={() => setStep(1)}>
              Back
            </button>
            <button className="btn grow" type="button" onClick={() => setStep(3)}>
            Continue to UPI
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 && totals ? (
        <div className="pad mt stack">
          <p className="muted">The host uses these to confirm your stay.</p>
          <Field label="Full name" error={errors.name} value={name} onChange={setName} />
          <Field label="Email" error={errors.email} value={email} onChange={setEmail} type="email" />
          <Field label="Mobile number" error={errors.phone} value={phone} onChange={setPhone} />
          <h3>Pay the host on UPI</h3>
          <p className="muted">Send the total to the host&apos;s UPI ID, then add the reference so they can match the payment.</p>
          <div className="card">
            <div className="sumline">
              <span className="k">UPI ID</span>
              <strong>{upiId}</strong>
            </div>
            <div className="sumline total">
              <span className="k">Total due</span>
              <span className="num">{inr(totals.total)}</span>
            </div>
          </div>
          <Field label="UPI reference (optional)" value={paymentRef} onChange={setPaymentRef} placeholder="Last 4 digits or UTR" />
          <p className="muted">The stay stays awaiting until the host confirms the payment. You&apos;ll get a notification when it is booked.</p>
          <div className="row">
            <button className="btn outline" type="button" onClick={() => setStep(2)} disabled={paying}>
              Back
            </button>
            <button className="btn grow" type="button" onClick={pay} disabled={paying}>
              {paying ? "Sending to the host…" : "I've paid"}
            </button>
          </div>
        </div>
      ) : null}

      {step === 4 && done && checkIn && checkOut ? (
        <div className="pad mt stack">
          <p>Payment sent. The host will confirm your stay.</p>
          <div className="card">
            <div className="sumline">
              <span className="k">Property</span>
              <span>{property.name}</span>
            </div>
            <div className="sumline">
              <span className="k">Dates</span>
              <span>{formatRange(checkIn, checkOut)}</span>
            </div>
            <div className="sumline">
              <span className="k">Guests</span>
              <span>
                {adults + children} guests
              </span>
            </div>
            <div className="sumline total">
              <span className="k">Status</span>
              <span>Awaiting host</span>
            </div>
            <p className="muted">Booking #{done.code}</p>
          </div>
          <Link className="btn block" href="/trips">
            View trip
          </Link>
          <button className="btn outline block" type="button" onClick={() => router.push("/")}>
            Back to explore
          </button>
        </div>
      ) : null}
    </Shell>
  );
}

function GuestRow({
  label,
  help,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  help: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="between">
      <div>
        <strong>{label}</strong>
        <p className="muted">{help}</p>
      </div>
      <div className="stepper">
        <button type="button" aria-label={`Fewer ${label}`} onClick={() => onChange(Math.max(min, value - 1))}>
          <Icon name="minus" />
        </button>
        <span className="val num">{value}</span>
        <button type="button" aria-label={`More ${label}`} onClick={() => onChange(Math.min(max, value + 1))}>
          <Icon name="plus" />
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="field grow">
      <span>{label}</span>
      <input className="ctrl" type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {error ? <span className="help">{error}</span> : null}
    </label>
  );
}
