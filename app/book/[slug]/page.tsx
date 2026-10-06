"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { Icon } from "@/components/icon";
import { useCatalog } from "@/lib/catalog";
import { formatRange, inr, isoDate, nightsBetween, quote } from "@/lib/format";
import { useStore } from "@/lib/store";
import { isPastDate, monthMatrix, occupiedNights } from "@/lib/availability";
import { useCalendarStart } from "@/lib/use-calendar";
import NumberFlow from "@number-flow/react";
import { RazorpayCheckout, RazorpayPaymentSuccess } from "@/components/RazorpayCheckout";

export default function BookPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { properties } = useCatalog();
  const { user, addBooking, showToast, ready, sessionChecked, occupancies, reloadAvailability, realtorProperties } = useStore();
  const property = useMemo(() => {
    const existing = properties.find((item) => item.id === params.slug);
    if (existing) return existing;
    const rp = (realtorProperties || []).find((item) => item.id === params.slug);
    if (!rp) return undefined;
    return {
      id: rp.id,
      name: rp.name,
      tagline: `${rp.bedrooms} BHK in ${rp.location}`,
      location: rp.location,
      city: rp.city,
      type: "Farmhouse",
      setting: "seaside" as const,
      settingName: rp.location,
      settingDetail: "Private Broker Mandate",
      bedrooms: rp.bedrooms,
      beds: Math.max(rp.bedrooms, 2),
      bathrooms: rp.bathrooms,
      guests: rp.guests,
      price: rp.nightlyRate || 25000,
      cleaning: 2500,
      deposit: 10000,
      minStay: 1,
      photos: ["/photos/ecr-sanctuary-1.jpg"],
      amenities: [
        rp.pool ? "Pool" : "Lawn",
        "AC",
        "Power backup",
        "Parking",
        "Wi-Fi",
      ],
      highlights: `${rp.bedrooms} BHK · Sleeps ${rp.guests}`,
      description: rp.notes || `Private luxury ${rp.bedrooms} BHK estate in ${rp.location}.`,
      isForSale: Boolean(rp.forSale),
      salePrice: rp.salePriceCr ? rp.salePriceCr * 10000000 : undefined,
    } as any;
  }, [properties, realtorProperties, params.slug]);
  const upiId = user?.upiId || "9bhk@okhdfcbank";

  useEffect(() => {
    reloadAvailability();
  }, [reloadAvailability]);

  useEffect(() => {
    if (!ready || !sessionChecked || user) return;
    router.replace(`/login?next=${encodeURIComponent(`/book/${params.slug}`)}`);
  }, [ready, sessionChecked, user, router, params.slug]);
  const [step, setStep] = useState(0);
  // Opens on the current month, resolved after mount so the server pass and
  // hydration agree. `today` drives the past-night guard below.
  const { cursor, today, goToMonth, canGoBack } = useCalendarStart();
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{
    code: string;
    total: number;
    status?: "awaiting" | "confirmed";
    paymentRef?: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      if (user.name && !name) setName(user.name);
      if (user.email && !email) setEmail(user.email);
      if (user.phone && !phone) setPhone(user.phone);
    }
  }, [user]);

  const minStay = property?.minStay ?? 2;
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const totals = property && nights >= minStay ? quote(property.price, property.cleaning, nights) : null;
  const days = useMemo(() => (cursor ? monthMatrix(cursor) : []), [cursor]);

  // Live occupancy: the host's own blocked nights plus every booking that has
  // not been cancelled. Cancelled stays release their dates again.
  const hostBlocked = useMemo(() => new Set(property?.blockedDates ?? []), [property]);
  const occupied = useMemo(
    () => (property ? occupiedNights(property, occupancies) : new Set<string>()),
    [property, occupancies],
  );

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

  if (!ready || !sessionChecked || !user) {
    return (
      <Shell>
        <PageBar title="Book your stay" backHref={`/property/${property.id}`} />
        <div className="pad mt stack" style={{ textAlign: "center", paddingTop: 64 }}>
          <p className="muted">Redirecting to sign in…</p>
        </div>
      </Shell>
    );
  }

  function pick(date: string) {
    if (occupied.has(date)) return;
    if (today && isPastDate(date, today)) return;
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
    if (span < minStay) {
      showToast(minStay === 1 ? "Minimum stay is 1 night." : `Minimum stay is ${minStay} nights.`);
      return;
    }
    setCheckOut(date);
  }

  function dayClass(date: string, inMonth: boolean) {
    if (!inMonth) return "cal-d is-muted";
    if (hostBlocked.has(date)) return "cal-d is-blocked";
    if (occupied.has(date)) return "cal-d is-booked";
    if (date === checkIn || date === checkOut) return "cal-d is-on";
    if (checkIn && checkOut && date > checkIn && date < checkOut) return "cal-d is-in";
    return "cal-d";
  }

  function continueGuests() {
    if (!checkIn || !checkOut || nights < minStay) {
      showToast(`Pick a check-in and check-out. Minimum stay is ${minStay} night${minStay > 1 ? "s" : ""}.`);
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

  function handleRazorpaySuccess(result: RazorpayPaymentSuccess) {
    if (!property || !totals || !checkIn || !checkOut) return;
    const propertyId = property.id;
    const propertyName = property.name;
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
      status: "confirmed",
      guestName: name.trim(),
      guestEmail: email.trim(),
      guestPhone: phone.trim(),
      upiId,
      paymentRef: result.paymentId,
    });

    showToast("Payment verified! Booking confirmed.");
    setDone({
      code,
      total: totals.total,
      status: "confirmed",
      paymentRef: result.paymentId,
    });
    setStep(4);
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
          <p className="muted">Minimum stay is {minStay} night{minStay > 1 ? "s" : ""}. Blocked and booked dates can&apos;t be selected.</p>
          <div className="between">
            <button
              className="icon-btn"
              type="button"
              aria-label="Previous month"
              disabled={!canGoBack}
              onClick={() => goToMonth(-1)}
            >
              <Icon name="back" />
            </button>
            <strong>
              {cursor ? cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "\u00a0"}
            </strong>
            <button className="icon-btn" type="button" aria-label="Next month" onClick={() => goToMonth(1)}>
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
              const inMonth = cursor !== null && d.getMonth() === cursor.getMonth();
              // A night that has already gone can never be part of a stay, so it
              // is left out of the grid entirely rather than shown as a date the
              // guest can see but not pick. Today itself stays bookable.
              if (today !== null && isPastDate(iso, today)) {
                return <span className="cal-d is-off" key={iso + d.getMonth()} aria-hidden="true" />;
              }
              return (
                <button
                  key={iso + d.getMonth()}
                  className={dayClass(iso, inMonth)}
                  type="button"
                  disabled={!inMonth || occupied.has(iso)}
                  onClick={() => pick(iso)}
                >
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
              <span className="num"><NumberFlow value={totals.stay} prefix="₹" /></span>
            </div>
            <div className="sumline">
              <span className="k">Cleaning fee</span>
              <span className="num"><NumberFlow value={totals.cleaning} prefix="₹" /></span>
            </div>
            <div className="sumline">
              <span className="k">Taxes (12%)</span>
              <span className="num"><NumberFlow value={totals.tax} prefix="₹" /></span>
            </div>
            <div className="sumline">
              <span className="k">Discount</span>
              <span className="num">−₹0</span>
            </div>
            <div className="sumline total">
              <span className="k">Total</span>
              <span className="num"><NumberFlow value={totals.total} prefix="₹" /></span>
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
          <p className="muted">The host and gateway use these details to confirm and receipt your reservation.</p>
          <Field label="Full name" error={errors.name} value={name} onChange={setName} />
          <Field label="Email" error={errors.email} value={email} onChange={setEmail} type="email" />
          <Field label="Mobile number" error={errors.phone} value={phone} onChange={setPhone} />

          <div className="card mt">
            <div className="sumline">
              <span className="k">Total amount</span>
              <span className="num" style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                {inr(totals.total)}
              </span>
            </div>
            <div className="sumline">
              <span className="k">Gateway</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                Razorpay Secure (UPI, Cards, Netbanking)
              </span>
            </div>
          </div>

          <RazorpayCheckout
            amount={totals.total}
            propertyName={property.name}
            guestName={name}
            guestEmail={email}
            guestPhone={phone}
            onBeforeCheckout={() => {
              const valid = validateGuest();
              if (!valid) {
                showToast("Please provide your name, email, and 10-digit mobile number.");
              }
              return valid;
            }}
            onSuccess={handleRazorpaySuccess}
            onError={(err) => showToast(err.message || "Payment could not be completed.")}
            buttonText={`Pay ${inr(totals.total)} via Razorpay`}
            className="btn accent block"
          />

          <div className="row mt">
            <button className="btn outline" type="button" onClick={() => setStep(2)}>
              Back
            </button>
          </div>
        </div>
      ) : null}

      {step === 4 && done && checkIn && checkOut ? (
        <div className="pad mt stack">
          <p>
            {done.status === "confirmed"
              ? "Payment verified! Your whole-house stay is secured and confirmed."
              : "Payment sent. The host will confirm your stay."}
          </p>
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
              <span style={{ color: done.status === "confirmed" ? "var(--ok, #18352b)" : "inherit", fontWeight: 600 }}>
                {done.status === "confirmed" ? "Confirmed" : "Awaiting host"}
              </span>
            </div>
            {done.paymentRef ? (
              <div className="sumline">
                <span className="k">Payment Ref</span>
                <span className="num muted" style={{ fontSize: 13 }}>{done.paymentRef}</span>
              </div>
            ) : null}
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
