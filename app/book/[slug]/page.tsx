"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { Icon } from "@/components/icon";
import { useCatalog } from "@/lib/catalog";
import { SAMPLE_LISTING_LABEL } from "@/lib/properties";
import { useT } from "@/lib/i18n";
import { formatRange, inr, isoDate, nightsBetween, quote } from "@/lib/format";
import { useStore } from "@/lib/store";
import { isPastDate, monthMatrix, occupiedNights } from "@/lib/availability";
import { useCalendarStart } from "@/lib/use-calendar";
import NumberFlow from "@number-flow/react";
import { RazorpayCheckout, RazorpayPaymentSuccess } from "@/components/RazorpayCheckout";
import { accountRequest } from "@/lib/supabase/browser";
import { bookingQuery, validIsoDay } from "@/lib/search-state";
import { nightsInRange } from "@/lib/availability";
import { SplitPayPanel } from "@/components/split-pay";
import type { SplitShare } from "@/lib/split";

export default function BookPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const t = useT();
  const { properties } = useCatalog();
  const { user, bookings, reloadAccount, showToast, ready, sessionChecked, occupancies, reloadAvailability } = useStore();
  const property = useMemo(() => {
    return properties.find((item) => item.id === params.slug);
  }, [properties, params.slug]);

  useEffect(() => {
    reloadAvailability();
  }, [reloadAvailability]);

  useEffect(() => {
    if (!ready || !sessionChecked || user) return;
    const sourceQuery = new URLSearchParams(window.location.search);
    const returnQuery = new URLSearchParams(bookingQuery(sourceQuery));
    if (/^9B-[a-f0-9]{32}$/.test(sourceQuery.get("bookingCode") ?? "")) returnQuery.set("bookingCode", sourceQuery.get("bookingCode")!);
    const query = returnQuery.toString();
    router.replace(`/login?next=${encodeURIComponent(`/book/${params.slug}${query ? `?${query}` : ""}`)}`);
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
  const [preparing, setPreparing] = useState(false);
  const [hold, setHold] = useState<{ bookingId: string; bookingCode: string; total: number; holdExpiresAt: string; quote: { stay: number; cleaning: number; tax: number; platformFee: number; deposit: number; total: number; taxRate: number } } | null>(null);
  const [split, setSplit] = useState<SplitShare[]>([]);
  useEffect(() => {
    if (hold || !ready || !sessionChecked || !user) return;
    const code = new URLSearchParams(window.location.search).get("bookingCode");
    if (!code) return;
    const booking = bookings.find(b => b.code === code && b.propertyId === params.slug && b.guestId === user.id);
    if (!booking || booking.status !== "awaiting" || !booking.holdExpiresAt || Date.parse(booking.holdExpiresAt) <= Date.now() || !booking.quote) return;
    setCheckIn(booking.checkIn); setCheckOut(booking.checkOut); setAdults(booking.adults); setChildren(booking.children);
    setName(booking.guestName); setEmail(booking.guestEmail); setPhone(booking.guestPhone);
    setHold({ bookingId: booking.id, bookingCode: booking.code, total: booking.total, holdExpiresAt: booking.holdExpiresAt, quote: booking.quote as NonNullable<typeof hold>["quote"] });
    setSplit(booking.split ?? []); setStep(3);
  }, [bookings, ready, sessionChecked, user, hold, params.slug]);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const start = query.get("checkIn") ?? "", end = query.get("checkOut") ?? "";
    if (validIsoDay(start) && validIsoDay(end) && end > start) { setCheckIn(start); setCheckOut(end); }
    const guests = Number(query.get("guests"));
    if (Number.isInteger(guests) && guests > 0 && guests <= 100) setAdults(guests);
  }, []);
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
  const totals = hold?.quote ?? (property && nights >= minStay ? quote(property.price, property.cleaning, nights, { deposit: property.deposit, taxRate: property.taxRate, platformFeeRate: property.platformFeeRate }) : null);
  const days = useMemo(() => (cursor ? monthMatrix(cursor) : []), [cursor]);

  // Live occupancy: the host's own blocked nights plus every booking that has
  // not been cancelled. Cancelled stays release their dates again.
  const hostBlocked = useMemo(() => new Set(property?.blockedDates ?? []), [property]);
  const occupied = useMemo(
    () => (property ? occupiedNights(property, occupancies) : new Set<string>()),
    [property, occupancies],
  );

  if (property?.sample) {
    return (
      <Shell>
        <PageBar title={property.name} backHref={`/property/${property.id}`} />
        <div className="empty" data-sample-listing>
          <span className="pill warn">{SAMPLE_LISTING_LABEL}</span>
          <h3>This is a sample listing.</h3>
          <p className="muted">It shows what a 9bhk listing looks like. There is no host behind it, so dates can&apos;t be held and no payment can be taken.</p>
          <Link className="btn" href="/">
            Back to explore
          </Link>
        </div>
      </Shell>
    );
  }

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
    const choosingCheckout = checkIn && !checkOut && date > checkIn;
    if (!choosingCheckout && occupied.has(date)) return;
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
    if (nightsInRange({ checkIn, checkOut: date }).some(night => occupied.has(night))) { showToast("Your stay includes an unavailable night."); return; }
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
    if (nightsInRange({ checkIn, checkOut }).some(night => occupied.has(night)) || (today && checkIn < today)) { showToast("These dates are unavailable. Please choose again."); return; }
    if (adults + children > property!.guests) setAdults(Math.max(1, property!.guests - children));
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

  async function prepareHold() {
    if (!validateGuest() || !property || !checkIn || !checkOut || preparing) return;
    setPreparing(true);
    try {
      const result = await accountRequest<NonNullable<typeof hold>>("/api/bookings/prepare", { propertyId: property.id, checkIn, checkOut, adults, children, guestName: name, guestEmail: email, guestPhone: phone });
      setHold(result); await reloadAccount();
      showToast("Dates held for 30 minutes. Review the final quote before payment.");
    } catch (error) { showToast(error instanceof Error ? error.message : "Reservation could not be held."); }
    finally { setPreparing(false); }
  }
  async function handleRazorpaySuccess(result: RazorpayPaymentSuccess) {
    await reloadAccount();
    if (result.status !== "confirmed" || !result.bookingCode || result.total === undefined) {
      showToast("Payment recorded for review. Open your trips for reservation and refund status."); router.push("/trips"); return;
    }
    showToast("Captured payment saved. Booking confirmed.");
    setDone({ code: result.bookingCode, total: result.total, status: "confirmed", paymentRef: result.paymentId });
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
                  disabled={!inMonth || (occupied.has(iso) && !(checkIn && !checkOut && iso > checkIn && !nightsInRange({ checkIn, checkOut: iso }).some(night => occupied.has(night))))}
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
              <span className="k">Taxes (configured rate)</span>
              <span className="num"><NumberFlow value={totals.tax} prefix="₹" /></span>
            </div>
            <div className="sumline">
              <span className="k">Platform fee</span>
              <span className="num">{inr(totals.platformFee)}</span>
            </div>
            <div className="sumline"><span className="k">Refundable security deposit</span><span>{inr(totals.deposit)}</span></div>
            <div className="sumline total">
              <span className="k">Total</span>
              <span className="num"><NumberFlow value={totals.total} prefix="₹" /></span>
            </div>
          </div>
          {totals.platformFee === 0 ? <p className="muted" data-no-platform-fee>{t("pricing.noPlatformFee")}</p> : null}
          <p className="muted">Estimated price. Your final quote includes date-specific rates and is saved with a 30-minute reservation hold before checkout.</p>
          <div className="row">
            <button className="btn outline" type="button" onClick={() => setStep(1)}>
              Back
            </button>
            <button className="btn grow" type="button" onClick={() => setStep(3)}>
            Continue to guest details
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 && totals ? (
        <div className="pad mt stack">
          <p className="muted">The host and gateway use these details to confirm and receipt your reservation.</p>
          {hold ? <p>Reservation #{hold.bookingCode}. Complete funding by {new Date(hold.holdExpiresAt).toLocaleTimeString("en-IN")}.</p> : <>
            <Field label="Full name" error={errors.name} value={name} onChange={setName} />
            <Field label="Email" error={errors.email} value={email} onChange={setEmail} type="email" />
            <Field label="Mobile number" error={errors.phone} value={phone} onChange={setPhone} />
          </>}

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

          {hold ? <div className="card"><div className="sumline"><span>Stay</span><span>{inr(hold.quote.stay)}</span></div><div className="sumline"><span>Cleaning</span><span>{inr(hold.quote.cleaning)}</span></div><div className="sumline"><span>Platform fee</span><span>{inr(hold.quote.platformFee)}</span></div><div className="sumline"><span>Tax ({hold.quote.taxRate * 100}%)</span><span>{inr(hold.quote.tax)}</span></div><div className="sumline"><span>Refundable deposit</span><span>{inr(hold.quote.deposit)}</span></div></div> : <button className="btn block" type="button" disabled={preparing} onClick={() => void prepareHold()}>{preparing ? "Reserving dates…" : "Hold dates and get final quote"}</button>}
          {hold && split.length === 0 ? <RazorpayCheckout
            amount={totals.total}
            bookingId={hold.bookingId}
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
          /> : null}
          {hold ? <SplitPayPanel total={hold.total} code={hold.bookingCode} organiser={name} checkIn={checkIn!} shares={split} onCreate={(shares) => { setSplit(shares); void reloadAccount(); }} onError={() => showToast("Group funding could not be updated. Check the hold and try again.")} /> : null}
          {split.length ? <Link className="btn outline block" href="/trips">Track group funding in trips</Link> : null}

          <div className="row mt">
            <button className="btn outline" type="button" onClick={async () => {
              if (hold) {
                try { await accountRequest(`/api/bookings/${encodeURIComponent(hold.bookingCode)}/cancel`); setHold(null); setSplit([]); await reloadAccount(); }
                catch (error) { showToast(error instanceof Error ? error.message : "Could not release the hold."); return; }
              }
              setStep(2);
            }}>
              {hold ? "Cancel hold and edit" : "Back"}
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
