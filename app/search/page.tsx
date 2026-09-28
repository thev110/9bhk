"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageBar, Shell } from "@/components/shell";
import { ResultCard } from "@/components/cards";
import { FILTERS, matchesFilter } from "@/lib/properties";
import { useCatalog } from "@/lib/catalog";
import { CITIES } from "@/lib/format";
import { BaseSheet } from "@/components/base-sheet";
import { Icon } from "@/components/icon";
import { useT } from "@/lib/i18n";
import { filterLabel } from "@/lib/i18n/vibes";

function SearchScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const t = useT();
  const initialQ = params.get("q") ?? "";
  const initialVibe = params.get("vibe") ?? "";
  const initialCity = params.get("city") ?? "";
  const initialGuests = Number(params.get("guests") || 2);

  const [q, setQ] = useState(initialQ);
  const [sort, setSort] = useState("recommended");
  const [active, setActive] = useState<string[]>(initialVibe ? [initialVibe] : []);
  const [city, setCity] = useState(initialCity);
  const [guests, setGuests] = useState(initialGuests);
  const [sheet, setSheet] = useState<"where" | "when" | "guests" | null>(null);
  const { properties } = useCatalog();

  const results = useMemo(() => {
    let list = properties.filter((p) => {
      const query = q.trim().toLowerCase();
      const matchesQ = !query || `${p.name} ${p.location} ${p.city}`.toLowerCase().includes(query);
      const matchesCity = !city || p.city === city || p.location.includes(city);
      const matchesFilters = active.every((f) => matchesFilter(p, f));
      const matchesGuests = !guests || p.guests >= guests;
      return matchesQ && matchesCity && matchesFilters && matchesGuests;
    });
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [q, sort, active, city, guests, properties]);

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
            <span className="v">{t("home.addDates")}</span>
          </button>
          <button className="sum-cell" type="button" onClick={() => setSheet("guests")}>
            <span className="k">
              <Icon name="users" /> {t("home.guests")}
            </span>
            <span className="v">{t("home.guestCount", { n: guests })}</span>
          </button>
        </div>
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
        <p className="muted" style={{ fontWeight: 600, fontSize: 13.5 }}>
          {t(results.length === 1 ? "search.resultCountOne" : "search.resultCountMany", { n: results.length })}
        </p>
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

      {/* When Sheet */}
      <BaseSheet
        open={sheet === "when"}
        onOpenChange={(open) => !open && setSheet(null)}
        title={t("home.whenTitle")}
      >
        <div className="stack">
          <p className="muted" style={{ lineHeight: 1.6 }}>
            {t("search.whenBody")}
          </p>
          <button className="btn block mt" type="button" onClick={() => setSheet(null)}>
            {t("search.viewAllDates")}
          </button>
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

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchScreen />
    </Suspense>
  );
}

function SearchFallback() {
  const t = useT();
  return (
    <Shell>
      <PageBar title={t("search.title")} backHref="/" />
    </Shell>
  );
}
