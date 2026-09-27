"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandBar, Shell } from "@/components/shell";
import { Icon, vibeIcon } from "@/components/icon";
import { FeatureCard, NearbyCard, RailCard } from "@/components/cards";
import { PROPERTIES, VIBES } from "@/lib/properties";
import { CITIES } from "@/lib/format";
import { useStore } from "@/lib/store";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const router = useRouter();
  const { city, setCity, showToast, ready, seenIntro } = useStore();
  const [q, setQ] = useState("");
  const [sheet, setSheet] = useState<"where" | "when" | "guests" | null>(null);
  const [guests, setGuests] = useState(2);
  const [hello, setHello] = useState("Good evening");

  useEffect(() => {
    setHello(greeting());
  }, []);

  useEffect(() => {
    if (ready && !seenIntro) router.replace("/splash");
  }, [ready, seenIntro, router]);

  const featured = PROPERTIES.filter((p) => p.group === "featured");
  const nearby = useMemo(() => {
    if (city === "Chennai") return PROPERTIES.filter((p) => p.group === "nearby");
    const near = PROPERTIES.filter((p) => p.city === city || p.location.includes(city));
    return (near.length ? near : PROPERTIES.filter((p) => p.group === "nearby")).slice(0, 3);
  }, [city]);
  const popular = PROPERTIES.filter((p) => p.group === "popular");

  if (!ready || !seenIntro) return null;

  function search(e?: FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (guests) params.set("guests", String(guests));
    router.push(`/search?${params.toString()}`);
  }

  return (
    <Shell nav="explore">
      <BrandBar onLocation={() => setSheet("where")} />
      <section className="greet">
        <p className="hello">{hello}</p>
        <h1>Where do you want to escape?</h1>
      </section>

      <section className="searchwrap">
        <form className="searchbar" role="search" onSubmit={search}>
          <Icon name="search" className="ico s-ico" />
          <input
            type="search"
            placeholder="Search places, areas or farmhouses"
            aria-label="Search places, areas or farmhouses"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="search-submit" type="submit" aria-label="Search">
            <Icon name="arrow" />
          </button>
        </form>
        <div className="summary" role="group" aria-label="Trip details">
          <button className="sum-cell" type="button" onClick={() => setSheet("where")}>
            <span className="k">
              <Icon name="pin" />
              Where
            </span>
            <span className="v">{city}</span>
          </button>
          <button className="sum-cell" type="button" onClick={() => setSheet("when")}>
            <span className="k">
              <Icon name="calendar" />
              When
            </span>
            <span className="v">Add dates</span>
          </button>
          <button className="sum-cell" type="button" onClick={() => setSheet("guests")}>
            <span className="k">
              <Icon name="users" />
              Guests
            </span>
            <span className="v">{guests} guests</span>
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Made for slow weekends</h2>
          <button className="see-all" type="button" onClick={() => router.push("/search")}>
            See all <Icon name="arrow" />
          </button>
        </div>
        <div className="rail" role="list">
          {featured.map((p) => (
            <RailCard key={p.id} property={p} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Explore by vibe</h2>
        </div>
        <div className="chips" role="list">
          {VIBES.map((vibe) => (
            <button
              key={vibe}
              className="chip"
              type="button"
              onClick={() => router.push(`/search?vibe=${encodeURIComponent(vibe)}`)}
            >
              <Icon name={vibeIcon(vibe)} />
              {vibe}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Escapes near you</h2>
          <button className="see-all" type="button" onClick={() => router.push(`/search?city=${encodeURIComponent(city)}`)}>
            See all <Icon name="arrow" />
          </button>
        </div>
        <div className="rail" role="list">
          {nearby.map((p) => (
            <NearbyCard key={p.id} property={p} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Popular farmhouses</h2>
        </div>
        <div className="stack-cards">
          {popular.map((p) => (
            <FeatureCard key={p.id} property={p} />
          ))}
        </div>
      </section>

      <section className="section pad">
        <div className="card">
          <p className="eyebrow" style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--moss)" }}>
            Have a farmhouse?
          </p>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 28, marginTop: 6 }}>
            Turn empty dates into bookings.
          </h2>
          <button className="btn mt" type="button" onClick={() => router.push("/host")}>
            List your farmhouse
          </button>
        </div>
      </section>

      <div className={`scrim${sheet ? " is-open" : ""}`} onClick={() => setSheet(null)} />
      <div className={`sheet${sheet ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-hidden={!sheet}>
        <div className="sheet-grab" />
        {sheet === "where" ? (
          <>
            <div className="sheet-head">
              <h2>Where to?</h2>
            </div>
            <div className="stack">
              {CITIES.map((c) => (
                <button
                  key={c}
                  className="mi"
                  type="button"
                  onClick={() => {
                    setCity(c);
                    setSheet(null);
                    showToast(`Showing escapes around ${c}`);
                  }}
                >
                  <Icon name="pin" />
                  <span className="lb">{c}</span>
                </button>
              ))}
            </div>
          </>
        ) : null}
        {sheet === "when" ? (
          <>
            <div className="sheet-head">
              <h2>When are you going?</h2>
            </div>
            <p className="muted">Pick dates on a farmhouse when you check availability. Minimum stay is 2 nights.</p>
            <button className="btn block mt" type="button" onClick={() => search()}>
              Browse available stays
            </button>
          </>
        ) : null}
        {sheet === "guests" ? (
          <>
            <div className="sheet-head">
              <h2>Guests</h2>
            </div>
            <div className="between">
              <div>
                <strong>Guests</strong>
                <p className="muted">Any age counts here</p>
              </div>
              <div className="stepper">
                <button type="button" aria-label="Fewer guests" onClick={() => setGuests((n) => Math.max(1, n - 1))}>
                  <Icon name="minus" />
                </button>
                <span className="val num">{guests}</span>
                <button type="button" aria-label="More guests" onClick={() => setGuests((n) => Math.min(16, n + 1))}>
                  <Icon name="plus" />
                </button>
              </div>
            </div>
            <button className="btn block mt" type="button" onClick={() => setSheet(null)}>
              Done
            </button>
          </>
        ) : null}
      </div>
    </Shell>
  );
}
