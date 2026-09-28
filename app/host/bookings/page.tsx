"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { formatRange, inr } from "@/lib/format";
import { useStore, type Booking } from "@/lib/store";
import { useT } from "@/lib/i18n";
import type { DictKey } from "@/lib/i18n/en";

const TABS = [
  { id: "Upcoming", key: "trips.tabUpcoming" },
  { id: "Past", key: "trips.tabPast" },
  { id: "Cancelled", key: "trips.tabCancelled" },
  { id: "Calendar", key: "host.tabCalendar" },
  { id: "Earnings", key: "host.earnings" },
] as const satisfies readonly { id: string; key: DictKey }[];

type TabId = (typeof TABS)[number]["id"];

/** Only the three booking tabs render the list, so only they have empty copy. */
const EMPTY_KEY: Record<string, DictKey> = {
  Upcoming: "host.emptyUpcoming",
  Past: "host.emptyPast",
  Cancelled: "host.emptyCancelled",
};

function bucket(status: Booking["status"]): TabId {
  if (status === "completed") return "Past";
  if (status === "cancelled") return "Cancelled";
  return "Upcoming";
}

function HostBookings() {
  const params = useSearchParams();
  const { bookings, confirmBooking, showToast } = useStore();
  const t = useT();
  const initial: TabId = params.get("tab") === "earnings" ? "Earnings" : params.get("tab") === "calendar" ? "Calendar" : "Upcoming";
  const [tab, setTab] = useState<TabId>(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const rows = bookings.filter((booking) => bucket(booking.status) === tab);
  const open = bookings.find((booking) => booking.id === openId);

  return (
    <Shell>
      <PageBar title={t("host.bookings")} backHref="/host" />
      <header className="page-head">
        <p className="eyebrow">{t("host.workspace")}</p>
        <h1>{t("host.manageStays")}</h1>
        <p className="sub">{t("host.manageStaysSub")}</p>
      </header>
      <div className="pad">
        <div className="seg">
          {TABS.map((item) => (
            <button key={item.id} type="button" aria-selected={tab === item.id} onClick={() => setTab(item.id)}>
              {t(item.key)}
            </button>
          ))}
        </div>
      </div>

      {tab === "Calendar" ? (
        <div className="pad mt stack">
          <div className="legend">
            <span>{t("host.calendarAvailable")}</span>
            <span>{t("host.calendarBooked")}</span>
            <span>{t("host.calendarBlocked")}</span>
          </div>
          <div className="card">
            <h3>{t("host.tonightsRules")}</h3>
            <div className="sumline">
              <span className="k">{t("host.minimumStay")}</span>
              <span>{t("host.nightMany", { n: 2 })}</span>
            </div>
            <div className="sumline">
              <span className="k">{t("host.weekendPrice")}</span>
              <span>₹8,500 {t("property.perNight")}</span>
            </div>
            <div className="sumline">
              <span className="k">{t("host.checkinWindow")}</span>
              <span>2 PM – 8 PM</span>
            </div>
          </div>
          <p className="muted">{t("host.blockDatesBodyFull")}</p>
          <button className="btn block" type="button">
            {t("host.blockDates")}
          </button>
        </div>
      ) : null}

      {tab === "Earnings" ? (
        <div className="pad mt stack">
          <div className="card">
            <p className="muted">{t("host.netEarningsPeriod")}</p>
            <p className="nb" style={{ fontSize: 32, fontWeight: 800 }}>
              ₹1,14,816
            </p>
            <p className="muted">{t("host.earningsSummary")}</p>
          </div>
          <div className="card">
            <h3>{t("host.breakdown")}</h3>
            <div className="sumline">
              <span className="k">{t("host.grossBookings")}</span>
              <span>₹1,24,800</span>
            </div>
            <div className="sumline">
              <span className="k">{t("host.platformFees")}</span>
              <span>−₹9,984</span>
            </div>
            <div className="sumline">
              <span className="k">{t("host.cleaningFeesCollected")}</span>
              <span>₹4,200</span>
            </div>
            <div className="sumline total">
              <span className="k">{t("host.netEarnings")}</span>
              <span>₹1,14,816</span>
            </div>
          </div>
          <div className="card">
            <h3>{t("host.payouts")}</h3>
            <div className="sumline">
              <span className="k">{t("host.pendingPayout")}</span>
              <span>₹42,300</span>
            </div>
            <p className="muted">{t("host.payoutArrives")}</p>
            <div className="sumline">
              <span className="k">{t("host.paidOut")}</span>
              <span>₹72,516</span>
            </div>
            <p className="muted">{t("host.lastPayout")}</p>
            <div className="sumline">
              <span className="k">{t("host.payoutAccount")}</span>
              <span>HDFC ••4821</span>
            </div>
            <button className="btn outline sm mt" type="button">
              {t("host.downloadStatement")}
            </button>
          </div>
          <p className="muted">{t("host.earningsDisclaimer")}</p>
        </div>
      ) : null}

      {tab !== "Calendar" && tab !== "Earnings" ? (
        <div className="stack pad mt">
          {rows.length === 0 ? (
            <div className="empty">
              <h3>{t(EMPTY_KEY[tab])}</h3>
              <p>{t("host.emptyBookingsBody")}</p>
            </div>
          ) : (
            rows.map((row) => (
              <article className="card" key={row.id}>
                <div className="between">
                  <span className={`pill ${row.status === "confirmed" || row.status === "completed" ? "ok" : "warn"}`}>
                    {row.status === "awaiting" ? t("host.statusAwaiting") : row.status === "confirmed" ? t("booking.statusConfirmed") : row.status === "completed" ? t("booking.statusCompleted") : t("booking.statusCancelled")}
                  </span>
                  <strong className="num">{inr(row.total)}</strong>
                </div>
                <h3 className="mt">{row.propertyName || row.propertyId}</h3>
                <p className="muted">
                  {formatRange(row.checkIn, row.checkOut)} · {t("home.guestCount", { n: row.adults + row.children })}
                </p>
                <div className="row mt">
                  <span className="avatar">{row.guestName.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <strong>{row.guestName}</strong>
                    {row.guestEmail ? <a className="muted" href={`mailto:${row.guestEmail}`}>{row.guestEmail}</a> : <p className="muted">{t("host.noEmail")}</p>}
                    {row.guestPhone ? <a className="muted" href={`tel:${row.guestPhone.replace(/\s/g, "")}`}>{row.guestPhone}</a> : <p className="muted">{t("host.noPhone")}</p>}
                  </div>
                </div>
                <button className="btn outline sm mt" type="button" onClick={() => setOpenId(row.id)}>
                  {t("host.viewDetails")}
                </button>
              </article>
            ))
          )}
          {open ? (
            <>
              <div className="scrim is-open" onClick={() => setOpenId(null)} />
              <div className="sheet is-open" role="dialog" aria-modal="true" aria-label={t("host.bookingDetails")}>
                <div className="sheet-grab" />
                <div className="sheet-head">
                  <h2>{open.guestName}</h2>
                  <p className="muted">{t("trips.bookingRef", { code: open.code })}</p>
                </div>
                <div className="card">
                  <div className="sumline"><span className="k">{t("profile.fieldEmail")}</span><span>{open.guestEmail ? <a href={`mailto:${open.guestEmail}`}>{open.guestEmail}</a> : "—"}</span></div>
                  <div className="sumline"><span className="k">{t("host.fieldPhone")}</span><span>{open.guestPhone ? <a href={`tel:${open.guestPhone.replace(/\s/g, "")}`}>{open.guestPhone}</a> : "—"}</span></div>
                  <div className="sumline"><span className="k">{t("host.upi")}</span><span>{open.upiId || "—"}</span></div>
                  <div className="sumline"><span className="k">{t("host.reference")}</span><span>{open.paymentRef || t("host.notAdded")}</span></div>
                  <div className="sumline total"><span className="k">{t("host.total")}</span><span className="num">{inr(open.total)}</span></div>
                </div>
                {open.status === "awaiting" ? (
                  <button
                    className="btn block mt"
                    type="button"
                    onClick={() => {
                      confirmBooking(open.id);
                      showToast(t("host.toastStayConfirmed"));
                      setOpenId(null);
                    }}
                  >
                    {t("host.confirmStay")}
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
  const t = useT();
  return (
    <Suspense fallback={<Shell><PageBar title={t("host.bookings")} backHref="/host" /></Shell>}>
      <HostBookings />
    </Suspense>
  );
}
