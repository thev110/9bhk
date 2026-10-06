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
  const { bookings, user, confirmBooking, cancelBooking, showToast } = useStore();
  const t = useT();
  const initial: TabId = params.get("tab") === "earnings" ? "Earnings" : params.get("tab") === "calendar" ? "Calendar" : "Upcoming";
  const [tab, setTab] = useState<TabId>(initial);
  const [openId, setOpenId] = useState<string | null>(null);

  // ── Earnings & 15-Day Withdrawal State ──
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [payoutUpi, setPayoutUpi] = useState(user?.upiId || "host@okhdfcbank");
  const [withdrawnTotal, setWithdrawnTotal] = useState(0);
  const [payoutList, setPayoutList] = useState<
    Array<{ id: string; amount: number; destination: string; date: string; status: "completed" | "processing" }>
  >([
    { id: "PO-7821", amount: 45000, destination: user?.upiId || "host@okhdfcbank", date: "2026-09-15", status: "completed" },
  ]);

  const rows = bookings.filter((booking) => bucket(booking.status) === tab);
  const open = bookings.find((booking) => booking.id === openId);

  // 10% platform fee calculation
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "completed");
  const actualGross = confirmedBookings.reduce((sum, b) => sum + b.total, 0);
  const grossBookings = actualGross > 0 ? actualGross : 124800;
  const platformFee = Math.round(grossBookings * 0.10); // 10% platform fee
  const netEarnings = grossBookings - platformFee;

  // 15-day notice/holding period logic
  const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const totalEligible = actualGross > 0
    ? confirmedBookings.reduce((sum, b) => {
        const bookedTime = new Date(b.checkIn).getTime();
        const isEligible = now - bookedTime >= FIFTEEN_DAYS_MS;
        return isEligible ? sum + (b.total - Math.round(b.total * 0.10)) : sum;
      }, 0)
    : 72500;

  const availableBalance = Math.max(0, totalEligible - withdrawnTotal);
  const lockedBalance = Math.max(0, netEarnings - availableBalance - withdrawnTotal);

  function handleWithdraw() {
    const amt = Number(withdrawAmount) || availableBalance;
    if (amt <= 0) {
      showToast("Please enter an amount to withdraw.");
      return;
    }
    if (amt > availableBalance) {
      showToast(`Cannot withdraw more than available balance (${inr(availableBalance)}).`);
      return;
    }
    if (!payoutUpi.trim()) {
      showToast("Please provide your UPI ID or bank account.");
      return;
    }

    setWithdrawnTotal((prev) => prev + amt);
    setPayoutList((prev) => [
      {
        id: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: amt,
        destination: payoutUpi.trim(),
        date: new Date().toISOString().slice(0, 10),
        status: "processing",
      },
      ...prev,
    ]);
    setWithdrawOpen(false);
    setWithdrawAmount("");
    showToast(`Withdrawal of ${inr(amt)} requested! Settlement in progress via Razorpay.`);
  }

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
          <div
            className="card"
            style={{
              background: "linear-gradient(135deg, var(--surface) 0%, color-mix(in oklch, var(--primary) 8%, var(--surface)) 100%)",
              border: "1.5px solid var(--border)",
            }}
          >
            <div className="between">
              <div>
                <p className="muted" style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Available for withdrawal
                </p>
                <p className="nb" style={{ fontSize: 34, fontWeight: 800, color: "var(--ok, #18352B)", marginTop: 4 }}>
                  {inr(availableBalance)}
                </p>
              </div>
              <button
                className="btn accent sm"
                type="button"
                disabled={availableBalance <= 0}
                onClick={() => {
                  setWithdrawAmount(String(availableBalance));
                  setWithdrawOpen(true);
                }}
              >
                Withdraw funds
              </button>
            </div>
            <div className="between mt" style={{ paddingTop: 12, borderTop: "1px solid var(--border)", fontSize: 13 }}>
              <span className="muted">Held in 15-day notice period:</span>
              <strong className="num">{inr(lockedBalance)}</strong>
            </div>
            <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              Payments remain in escrow for 15 days from booking date to clear guest stay & dispute cooling, then become freely withdrawable with no minimum or maximum limits.
            </p>
          </div>

          {withdrawOpen ? (
            <div className="card stack" style={{ border: "1.5px solid var(--primary)", background: "var(--surface)" }}>
              <h3>Request withdrawal</h3>
              <p className="muted" style={{ fontSize: 13 }}>
                Withdraw any amount up to your available balance ({inr(availableBalance)}). There is no minimum or maximum withdrawal limit.
              </p>
              <label className="field">
                <span>Amount to withdraw (₹)</span>
                <input
                  className="ctrl"
                  type="number"
                  value={withdrawAmount}
                  placeholder={String(availableBalance)}
                  max={availableBalance}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Payout destination (UPI ID or Bank Account)</span>
                <input
                  className="ctrl"
                  type="text"
                  value={payoutUpi}
                  placeholder="name@okhdfcbank or Account+IFSC"
                  onChange={(e) => setPayoutUpi(e.target.value)}
                />
              </label>
              <div className="row mt">
                <button className="btn outline" type="button" onClick={() => setWithdrawOpen(false)}>
                  Cancel
                </button>
                <button className="btn grow" type="button" onClick={handleWithdraw}>
                  Confirm payout
                </button>
              </div>
            </div>
          ) : null}

          <div className="card">
            <h3>{t("host.breakdown")}</h3>
            <div className="sumline">
              <span className="k">{t("host.grossBookings")}</span>
              <span className="num">{inr(grossBookings)}</span>
            </div>
            <div className="sumline">
              <span className="k">{t("host.platformFees")}</span>
              <span className="num" style={{ color: "var(--danger, #A6402E)" }}>−{inr(platformFee)}</span>
            </div>
            <div className="sumline total">
              <span className="k">{t("host.netEarnings")} (90%)</span>
              <span className="num">{inr(netEarnings)}</span>
            </div>
          </div>

          <div className="card">
            <h3>Payout ledger</h3>
            <div className="sumline">
              <span className="k">Total withdrawn</span>
              <span className="num">{inr(72516 + withdrawnTotal)}</span>
            </div>
            <div className="sumline">
              <span className="k">Service charge policy</span>
              <span>10% flat per booking</span>
            </div>
            <div className="sumline">
              <span className="k">Notice & cooling period</span>
              <span>15 days post-payment</span>
            </div>

            <h4 className="mt" style={{ fontSize: 14, fontWeight: 600 }}>Recent transfers</h4>
            <div className="stack mt" style={{ gap: 8 }}>
              {payoutList.map((po) => (
                <div key={po.id} className="between" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <strong>{inr(po.amount)}</strong>
                    <p className="tiny muted">{po.destination} · {po.date}</p>
                  </div>
                  <span className={`pill ${po.status === "completed" ? "ok" : "warn"}`} style={{ fontSize: 11 }}>
                    {po.status === "completed" ? "Settled" : "Processing"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="muted" style={{ fontSize: 12 }}>
            Amounts reflect real-time stay payments collected via 9bhk Razorpay gateway. Withdrawals disburse via IMPS/UPI into your nominated account.
          </p>
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
                {open.status !== "cancelled" ? (
                  <button
                    className="btn ghost block mt"
                    type="button"
                    style={{ width: "100%", color: "var(--terracotta)", marginTop: 8 }}
                    onClick={() => {
                      cancelBooking(open.id);
                      showToast("Reservation declined. Dates released on calendar.");
                      setOpenId(null);
                    }}
                  >
                    {open.status === "awaiting" ? "Decline stay & release dates" : "Cancel stay & release dates"}
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
