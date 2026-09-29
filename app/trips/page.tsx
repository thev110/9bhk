"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { formatRange, inr } from "@/lib/format";
import { useCatalog } from "@/lib/catalog";
import { useStore, type Booking } from "@/lib/store";
import { SplitPayPanel } from "@/components/split-pay";
import { useT } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-t";
import type { DictKey } from "@/lib/i18n/en";

const TABS = [
  { id: "Upcoming", key: "trips.tabUpcoming" },
  { id: "Past", key: "trips.tabPast" },
  { id: "Cancelled", key: "trips.tabCancelled" },
] as const satisfies readonly { id: string; key: DictKey }[];

type TabId = (typeof TABS)[number]["id"];

function bucket(status: Booking["status"]): TabId {
  if (status === "completed") return "Past";
  if (status === "cancelled") return "Cancelled";
  return "Upcoming";
}

const STATUS_KEY: Record<Booking["status"], DictKey> = {
  confirmed: "booking.statusConfirmed",
  awaiting: "booking.statusAwaiting",
  completed: "booking.statusCompleted",
  cancelled: "booking.statusCancelled",
};

export default function TripsPage() {
  const { bookings, user } = useStore();
  const { properties } = useCatalog();
  const t = useT();
  const { tag } = useLocale();
  const propertyFor = (id: string) => properties.find((item) => item.id === id);
  const [tab, setTab] = useState<TabId>("Upcoming");

  const userBookings = useMemo(() => {
    if (!user) return [];
    const email = user.email?.trim().toLowerCase();
    const phone = user.phone ? user.phone.replace(/\D/g, "") : "";
    return bookings.filter((b) => {
      const matchEmail = email && b.guestEmail?.trim().toLowerCase() === email;
      const matchPhone = phone && b.guestPhone?.replace(/\D/g, "") === phone;
      return matchEmail || matchPhone;
    });
  }, [bookings, user]);

  const [open, setOpen] = useState<string | null>(null);
  const list = useMemo(() => userBookings.filter((b) => bucket(b.status) === tab), [userBookings, tab]);
  const selected = userBookings.find((b) => b.id === open);

  if (!user) {
    return (
      <Shell nav="trips">
        <header className="page-head">
          <h1>{t("trips.title")}</h1>
        </header>
        <div className="empty">
          <h3>{t("trips.signInPrompt")}</h3>
          <Link className="btn" href="/login?next=/trips">
            {t("auth.signIn")}
          </Link>
          <Link className="btn outline mt" href="/">
            {t("saved.explore")}
          </Link>
        </div>
      </Shell>
    );
  }

  const emptyKey: DictKey =
    tab === "Upcoming" ? "trips.emptyUpcoming" : tab === "Cancelled" ? "trips.emptyCancelled" : "trips.emptyPast";

  return (
    <Shell nav="trips">
      <header className="page-head">
        <h1>{t("trips.title")}</h1>
      </header>
      <div className="pad mt">
        <div className="seg" role="tablist">
          {TABS.map(({ id, key }) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
              {t(key)}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <h3>{t(emptyKey)}</h3>
          <p className="muted">{t("trips.emptyBody")}</p>
          <Link className="btn mt" href="/">
            {t("saved.explore")}
          </Link>
        </div>
      ) : (
        <div className="stack pad mt">
          {list.map((booking) => {
            const property = propertyFor(booking.propertyId);
            if (!property) return null;
            return (
              <article className="card" key={booking.id}>
                <div className="between">
                  <span className={`pill ${booking.status === "confirmed" ? "ok" : booking.status === "awaiting" ? "warn" : ""}`}>
                    {t(STATUS_KEY[booking.status])}
                  </span>
                  <strong className="num">{inr(booking.total)}</strong>
                </div>
                <h3 className="p-title mt">{property.name}</h3>
                <p className="p-loc">{property.location}</p>
                <p className="muted">
                  {formatRange(booking.checkIn, booking.checkOut, tag)} · {t("home.guestCount", { n: booking.adults + booking.children })}
                </p>
                <button className="btn outline sm mt" type="button" onClick={() => setOpen(booking.id)}>
                  {t("trips.viewTrip")}
                </button>
                {booking.status === "completed" ? (
                  <div className="row mt">
                    <button className="btn ghost sm" type="button">
                      {t("trips.writeReview")}
                    </button>
                    <Link className="btn sm" href={`/property/${property.id}`}>
                      {t("trips.bookAgain")}
                    </Link>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {selected && propertyFor(selected.propertyId) ? (
        <TripSheet booking={selected} onClose={() => setOpen(null)} />
      ) : null}
    </Shell>
  );
}

function TripSheet({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const { properties } = useCatalog();
  const { setSplit, markSplitPaid, showToast } = useStore();
  const t = useT();
  const { tag } = useLocale();
  const property = properties.find((item) => item.id === booking.propertyId);
  if (!property) return null;
  const nights = Math.max(
    1,
    Math.round((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000),
  );
  return (
    <>
      <div className="scrim is-open" onClick={onClose} />
      <div className="sheet is-open" role="dialog" aria-modal="true" aria-label={t("a11y.yourTrip")}>
        <div className="sheet-grab" />
        <div className="sheet-head">
          <h2>{t("trips.sheetTitle")}</h2>
          <p className="muted">{t("trips.bookingRef", { code: booking.code })}</p>
        </div>
        <div className="card">
          <h3>{property.name}</h3>
          <div className="sumline">
            <span className="k">{t("trips.checkIn")}</span>
            <span>{formatRange(booking.checkIn, booking.checkIn, tag)} · 2:00 PM</span>
          </div>
          <div className="sumline">
            <span className="k">{t("trips.checkOut")}</span>
            <span>{formatRange(booking.checkOut, booking.checkOut, tag)} · 11:00 AM</span>
          </div>
          <div className="sumline">
            <span className="k">{t("home.guests")}</span>
            <span>
              {t("trips.guestsAndNights", { n: booking.adults + booking.children, nights })}
            </span>
          </div>
          <div className="sumline total">
            <span className="k">{t("trips.totalPaid")}</span>
            <span className="num">{inr(booking.total)}</span>
          </div>
        </div>
        {booking.status !== "cancelled" ? (
          <SplitPayPanel
            total={booking.total}
            code={booking.code}
            organiser={booking.guestName}
            checkIn={booking.checkIn}
            shares={booking.split}
            onCreate={(shares) => setSplit(booking.id, shares)}
            onMarkPaid={(share) => {
              markSplitPaid(booking.id, share.id);
              showToast(t("split.toastPaid", { name: share.name }));
            }}
            onError={() => showToast(t("split.inviteFailed"))}
          />
        ) : null}
        <p className="muted mt">{t("trips.cancellationNote")}</p>
        <div className="row mt">
          <button className="btn outline grow" type="button">
            {t("trips.contactHost")}
          </button>
          <button className="btn ghost grow" type="button">
            {t("trips.getHelp")}
          </button>
        </div>
      </div>
    </>
  );
}
