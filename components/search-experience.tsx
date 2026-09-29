"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { ResultCard } from "@/components/cards";
import { FILTERS, SETTINGS, SETTING_LABEL, matchesFilter, type Setting } from "@/lib/properties";
import { useCatalog } from "@/lib/catalog";
import { CITIES, formatRange, isoDate } from "@/lib/format";
import { BaseSheet } from "@/components/base-sheet";
import { Icon, settingIcon } from "@/components/icon";
import { useT } from "@/lib/i18n";
import { filterLabel, settingLabel } from "@/lib/i18n/vibes";
import { useStore } from "@/lib/store";
import { isPastDate, isRangeAvailable, monthMatrix, nightsBetween, occupiedNights } from "@/lib/availability";
import { useCalendarStart } from "@/lib/use-calendar";

function settingFromLabel(label: string): Setting | null {
  return SETTINGS.find((s) => SETTING_LABEL[s] === label) ?? null;
}

/**
 * The interactive search screen.
 *
 * Moved out of `app/search/page.tsx` so that route can be a **server**
 * component. The page has to be a server component to read `searchParams` and
 * emit per-URL robots directives — which is the whole mechanism that keeps
 * `?guests=7&sort=price` out of the index. The screen itself is unchanged.
 */
export function SearchScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const t = useT();
  const initialQ = params.get("q") ?? "";
  const initialVibe = params.get("vibe") ?? "";
  const initialSetting = settingFromLabel(params.get("setting") ?? "");
  const initialCity = params.get("city") ?? "";
  const initialGuests = Number(params.get("guests") || 2);

  const [q, setQ] = useState(initialQ);
  const [sort, setSort] = useState("recommended");
  const [active, setActive] = useState<string[]>(initialVibe ? [initialVibe] : []);
  const [setting, setSetting] = useState<Setting | null>(initialSetting);
  const [city, setCity] = useState(initialCity);
  const [guests, setGuests] = useState(initialGuests);
  const [sheet, setSheet] = useState<"where" | "when" | "guests" | null>(null);
  const { properties } = useCatalog();
  // Live occupancy from the database merged with this device's bookings, so a
  // weekend taken by someone else filters the listing out instead of showing
  // the house as free.
  const { occupancies } = useStore();
  // Opens on the current month. Resolved after mount rather than during render,
  // because the server renders this page too, and "today" on the server is not
  // necessarily "today" for the viewer.
  const { cursor, today, goToMonth, canGoBack } = useCalendarStart();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  /** Occupied nights per property, computed once for the whole grid. */
  const nightMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const property of properties) map.set(property.id, occupiedNights(property, occupancies));
    return map;
  }, [properties, occupancies]);

  /**
   * A night only greys out when *nothing* in the whole catalog is free — with
   * one listing left, a single booking should not black out the date.
   */
  const nightUnavailable = (iso: string) =>
    properties.length > 0 && properties.every((property) => nightMap.get(property.id)?.has(iso));

  const days = useMemo(() => (cursor ? monthMatrix(cursor) : []), [cursor]);
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;

  const results = useMemo(() => {
    let list = properties.filter((p) => {
      const query = q.trim().toLowerCase();
      const matchesQ =
        !query || `${p.name} ${p.location} ${p.city} ${p.settingName} ${p.type}`.toLowerCase().includes(query);
      const matchesCity = !city || p.city === city || p.location.includes(city) || p.settingName.includes(city);
      const matchesSetting = !setting || p.setting === setting;
      const matchesFilters = active.every((f) => matchesFilter(p, f));
      const matchesGuests = !guests || p.guests >= guests;
      return matchesQ && matchesCity && matchesSetting && matchesFilters && matchesGuests;
    });
    // Dates are a hard filter, not a sort: a house with a clashing booking
    // cannot be shown as an available result at all.
    if (checkIn && checkOut) {
      list = list.filter((p) => isRangeAvailable(p, occupancies, { checkIn, checkOut }));
    }
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [q, sort, active, setting, city, guests, properties, checkIn, checkOut, occupancies]);

  function toggle(filter: string) {
    setActive((curr) => (curr.includes(filter) ? curr.filter((f) => f !== filter) : [...curr, filter]));
  }

  return (
    <Shell>
      <PageBar title={t("search.title")} backHref="/" />
      <div className="pad mt">
        <form
          className="searchbar"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Icon name="search" className="ico s-ico" />
          <input
            type="search"
            value={q}
            placeholder={t("search.placeholder")}
            aria-label={t("search.placeholder")}
            onChange={(e) => setQ(e.target.value)}
          />
          {q ? (
            <button
              type="button"
              className="ctrl-act"
              style={{ position: "static", transform: "none" }}
              onClick={() => setQ("")}
              aria-label={t("a11y.clearSearch")}
            >
              <Icon name="close" />
            </button>
          ) : null}
        </form>

        <div className="summary mt" role="group" aria-label={t("a11y.tripDetails")}>
          <button className="sum-cell" type="button" onClick={() => setSheet("where")}>
            <span className="k">
              <Icon name="pin" /> {t("home.where")}
            </span>
            <span className="v">{city || t("home.anywhere")}</span>
          </button>
          <button className="sum-cell" type="button" onClick={() => setSheet("when")}>
            <span className="k">
              <Icon name="calendar" /> {t("home.when")}
            </span>
            <span className="v">
              {checkIn && checkOut
                ? formatRange(checkIn, checkOut)
                : checkIn
                  ? formatRange(checkIn, checkIn)
                  : t("home.addDates")}
            </span>
          </button>
          <button className="sum-cell" type="button" onClick={() => setSheet("guests")}>
            <span className="k">
              <Icon name="users" /> {t("home.guests")}
            </span>
            <span className="v">{t("home.guestCount", { n: guests })}</span>
          </button>
        </div>
      </div>

      <div className="chips mt" role="list" aria-label={t("home.sectionVibe")}>
        {SETTINGS.map((s) => (
          <button
            key={s}
            className={`chip${setting === s ? " is-active" : ""}`}
            type="button"
            aria-pressed={setting === s}
            onClick={() => setSetting((curr) => (curr === s ? null : s))}
          >
            <Icon name={settingIcon(s)} />
            {settingLabel(t, s)}
          </button>
        ))}
      </div>

      <div className="chips mt" role="list">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            className={`chip${active.includes(filter) ? " is-active" : ""}`}
            type="button"
            aria-pressed={active.includes(filter)}
            onClick={() => toggle(filter)}
          >
            {filterLabel(t, filter)}
          </button>
        ))}
      </div>

      <div className="between pad mt" style={{ alignItems: "center" }}>
        <div>
          <p className="muted" style={{ fontWeight: 600, fontSize: 13.5 }}>
            {t(results.length === 1 ? "search.resultCountOne" : "search.resultCountMany", { n: results.length })}
          </p>
          {checkIn && checkOut ? (
            <p className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
              {t("calendar.availableCount", { n: results.length })}
            </p>
          ) : null}
        </div>
        <div className="sort-dropdown-wrap">
          <label className="sr" htmlFor="sort">
            {t("a11y.sortResults")}
          </label>
          <select id="sort" className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t("a11y.sortResults")}>
            <option value="recommended">{t("search.sortRecommended")}</option>
            <option value="low">{t("search.sortLow")}</option>
            <option value="high">{t("search.sortHigh")}</option>
            <option value="rating">{t("search.sortRating")}</option>
          </select>
          <Icon name="chev" className="sort-chevron" />
        </div>
      </div>

      {results.length === 0 ? (
        <div className="empty">
          <h3>{t("search.emptyTitle")}</h3>
          <p>{t("search.emptyBody")}</p>
          <button
            className="btn sm mt"
            type="button"
            onClick={() => {
              setActive([]);
              setSetting(null);
              setCity("");
              setQ("");
              setGuests(2);
            }}
          >
            {t("search.clearAll")}
          </button>
        </div>
      ) : (
        <div className="list-stack pad mt" role="list">
          {results.map((p) => (
            <ResultCard key={p.id} property={p} />
          ))}
        </div>
      )}

      {/* Where Sheet */}
      <BaseSheet
        open={sheet === "where"}
        onOpenChange={(open) => !open && setSheet(null)}
        title={t("home.whereTitle")}
      >
        <div className="stack">
          <button
            className="mi"
            type="button"
            onClick={() => {
              setCity("");
              setSheet(null);
            }}
          >
            <Icon name="compass" />
            <span className="lb">{t("home.anywhere")}</span>
            <span className="meta">{t("search.staysCount", { n: properties.length })}</span>
          </button>
          {CITIES.map((c) => (
            <button
              key={c}
              className="mi"
              type="button"
              onClick={() => {
                setCity(c);
                setSheet(null);
              }}
            >
              <Icon name="pin" />
              <span className="lb">{c}</span>
              <span className="meta">
                {t("search.staysCount", {
                  n: properties.filter((p) => p.city === c || p.location.includes(c)).length,
                })}
              </span>
            </button>
          ))}
        </div>
      </BaseSheet>

      {/* When Sheet — a real range picker; these dates filter the results. */}
      <BaseSheet
        open={sheet === "when"}
        onOpenChange={(open) => !open && setSheet(null)}
        title={t("home.whenTitle")}
      >
        <div className="stack">
          <p className="muted" style={{ lineHeight: 1.6 }}>
            {t("calendar.body")}
          </p>
          <div className="cal-head">
            <button
              className="icon-btn"
              type="button"
              aria-label={t("action.previous")}
              disabled={!canGoBack}
              onClick={() => goToMonth(-1)}
            >
              <Icon name="back" />
            </button>
            <span className="m">
              {cursor ? cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "\u00a0"}
            </span>
            <button
              className="icon-btn"
              type="button"
              aria-label={t("action.next")}
              onClick={() => goToMonth(1)}
            >
              <Icon name="arrow" />
            </button>
          </div>
          <div className="cal-grid">
            {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => (
              <span className="dow" key={`${label}${index}`}>
                {label}
              </span>
            ))}
            {days.map((day) => {
              const iso = isoDate(day);
              const inMonth = cursor !== null && day.getMonth() === cursor.getMonth();
              // Nights that have already gone are left out of the grid entirely,
              // never rendered as dates the guest can see but not select.
              if (today !== null && isPastDate(iso, today)) {
                return <span className="cal-d is-off" key={`${iso}-${day.getMonth()}`} aria-hidden="true" />;
              }
              const blocked = nightUnavailable(iso);
              const isEdge = iso === checkIn || iso === checkOut;
              const isSpan = checkIn && checkOut && iso > checkIn && iso < checkOut;
              const className = !inMonth
                ? "cal-d is-muted"
                : blocked
                  ? "cal-d is-blocked"
                  : isEdge
                    ? "cal-d is-on"
                    : isSpan
                      ? "cal-d is-in"
                      : "cal-d";
              return (
                <button
                  key={`${iso}-${day.getMonth()}`}
                  className={className}
                  type="button"
                  disabled={!inMonth || blocked}
                  onClick={() => {
                    if (!checkIn || (checkIn && checkOut)) {
                      setCheckIn(iso);
                      setCheckOut("");
                      return;
                    }
                    if (iso <= checkIn) {
                      setCheckIn(iso);
                      return;
                    }
                    setCheckOut(iso);
                  }}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          <div className="legend">
            <span>{t("calendar.checkIn")}</span>
            <span>{t("calendar.unavailable")}</span>
          </div>
          <div className="card">
            <div className="sumline">
              <span className="k">{t("calendar.checkIn")}</span>
              <span>{checkIn ? formatRange(checkIn, checkIn) : t("home.addDates")}</span>
            </div>
            <div className="sumline">
              <span className="k">{t("calendar.checkOut")}</span>
              <span>{checkOut ? formatRange(checkOut, checkOut) : t("home.addDates")}</span>
            </div>
            <div className="sumline">
              <span className="k">{t("calendar.nights")}</span>
              <span className="num">{nights}</span>
            </div>
          </div>
          <div className="row">
            <button
              className="btn outline"
              type="button"
              onClick={() => {
                setCheckIn("");
                setCheckOut("");
              }}
            >
              {t("calendar.clear")}
            </button>
            <button className="btn grow" type="button" onClick={() => setSheet(null)}>
              {t("calendar.apply")}
            </button>
          </div>
        </div>
      </BaseSheet>

      {/* Guests Sheet */}
      <BaseSheet
        open={sheet === "guests"}
        onOpenChange={(open) => !open && setSheet(null)}
        title={t("search.guestsTitle")}
      >
        <div className="stack">
          <div className="between" style={{ alignItems: "center", padding: "12px 0" }}>
            <div>
              <strong style={{ fontSize: 16 }}>{t("search.totalGuests")}</strong>
              <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>{t("search.adultsKids")}</p>
            </div>
            <div className="stepper">
              <button
                type="button"
                aria-label={t("a11y.fewerGuests")}
                onClick={() => setGuests((n) => Math.max(1, n - 1))}
              >
                <Icon name="minus" />
              </button>
              <span className="val num">{guests}</span>
              <button
                type="button"
                aria-label={t("a11y.moreGuests")}
                onClick={() => setGuests((n) => Math.min(24, n + 1))}
              >
                <Icon name="plus" />
              </button>
            </div>
          </div>
          <button className="btn block mt" type="button" onClick={() => setSheet(null)}>
            {t(guests === 1 ? "search.applyGuestOne" : "search.applyGuestMany", { n: guests })}
          </button>
        </div>
      </BaseSheet>
    </Shell>
  );
}
