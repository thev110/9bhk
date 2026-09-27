"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageBar, Shell } from "@/components/shell";
import { ResultCard } from "@/components/cards";
import { FILTERS, PROPERTIES, matchesFilter } from "@/lib/properties";
import { CITIES } from "@/lib/format";

function SearchScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const initialQ = params.get("q") ?? "";
  const initialVibe = params.get("vibe") ?? "";
  const initialCity = params.get("city") ?? "";
  const guestCount = Number(params.get("guests") || 0);

  const [q, setQ] = useState(initialQ);
  const [sort, setSort] = useState("recommended");
  const [active, setActive] = useState<string[]>(initialVibe ? [initialVibe] : []);
  const [city, setCity] = useState(initialCity);
  const [whereOpen, setWhereOpen] = useState(false);

  const results = useMemo(() => {
    let list = PROPERTIES.filter((p) => {
      const query = q.trim().toLowerCase();
      const matchesQ = !query || `${p.name} ${p.location} ${p.city}`.toLowerCase().includes(query);
      const matchesCity = !city || p.city === city || p.location.includes(city);
      const matchesFilters = active.every((f) => matchesFilter(p, f));
      const matchesGuests = !guestCount || p.guests >= guestCount;
      return matchesQ && matchesCity && matchesFilters && matchesGuests;
    });
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [q, sort, active, city, guestCount]);

  function toggle(filter: string) {
    setActive((curr) => (curr.includes(filter) ? curr.filter((f) => f !== filter) : [...curr, filter]));
  }

  return (
    <Shell>
      <PageBar title="Search" backHref="/" />
      <div className="pad mt">
        <form
          className="searchbar"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <input
            type="search"
            value={q}
            placeholder="Search places, areas or farmhouses"
            aria-label="Search places, areas or farmhouses"
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
        <div className="summary" role="group" aria-label="Trip details">
          <button className="sum-cell" type="button" onClick={() => setWhereOpen(true)}>
            <span className="k">Where</span>
            <span className="v">{city || "Anywhere"}</span>
          </button>
          <button className="sum-cell" type="button" onClick={() => router.push("/search")}>
            <span className="k">When</span>
            <span className="v">Add dates</span>
          </button>
          <button className="sum-cell" type="button">
            <span className="k">Guests</span>
            <span className="v">{guestCount ? `${guestCount} guests` : "2 guests"}</span>
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
            {filter}
          </button>
        ))}
      </div>

      <div className="between pad mt">
        <p className="muted">{results.length} stays</p>
        <label className="sr" htmlFor="sort">
          Sort results
        </label>
        <select id="sort" className="ctrl" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort results">
          <option value="recommended">Recommended</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {results.length === 0 ? (
        <div className="empty">
          <h3>No farmhouses match those filters yet.</h3>
          <p>Try widening the price range or clearing a filter or two.</p>
          <button
            className="btn sm"
            type="button"
            onClick={() => {
              setActive([]);
              setCity("");
              setQ("");
            }}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="list-stack pad mt" role="list">
          {results.map((p) => (
            <ResultCard key={p.id} property={p} />
          ))}
        </div>
      )}

      <div className={`scrim${whereOpen ? " is-open" : ""}`} onClick={() => setWhereOpen(false)} />
      <div className={`sheet${whereOpen ? " is-open" : ""}`} role="dialog" aria-modal="true">
        <div className="sheet-grab" />
        <div className="sheet-head">
          <h2>Where to?</h2>
        </div>
        <button
          className="mi"
          type="button"
          onClick={() => {
            setCity("");
            setWhereOpen(false);
          }}
        >
          <span className="lb">Anywhere</span>
          <span className="meta">{PROPERTIES.length} stays</span>
        </button>
        {CITIES.map((c) => (
          <button
            key={c}
            className="mi"
            type="button"
            onClick={() => {
              setCity(c);
              setWhereOpen(false);
            }}
          >
            <span className="lb">{c}</span>
            <span className="meta">{PROPERTIES.filter((p) => p.city === c || p.location.includes(c)).length} stays</span>
          </button>
        ))}
      </div>
    </Shell>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Shell><PageBar title="Search" backHref="/" /></Shell>}>
      <SearchScreen />
    </Suspense>
  );
}
