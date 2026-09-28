"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandBar, Shell } from "@/components/shell";
import { Icon, vibeIcon } from "@/components/icon";
import { FeatureCard, NearbyCard, RailCard } from "@/components/cards";
import { VIBES } from "@/lib/properties";
import { useCatalog } from "@/lib/catalog";
import { CITIES } from "@/lib/format";
import { useStore } from "@/lib/store";
import { BaseSheet } from "@/components/base-sheet";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const router = useRouter();
  const { city, setCity } = useStore();
  const { properties } = useCatalog();
  const [q, setQ] = useState("");
  const [sheet, setSheet] = useState<"where" | "when" | "guests" | null>(null);
  const [guests, setGuests] = useState(2);
  const [hello, setHello] = useState("Good evening");

  useEffect(() => {
    setHello(greeting());
  }, []);

  const featured = properties.filter((p) => p.group === "featured");
  const nearby = useMemo(() => {
    if (city === "Chennai") return properties.filter((p) => p.group === "nearby");
    const near = properties.filter((p) => p.city === city || p.location.includes(city));
    return (near.length ? near : properties.filter((p) => p.group === "nearby")).slice(0, 3);
  }, [city, properties]);
  const popular = properties.filter((p) => p.group === "popular");

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
        <div className="between" style={{ alignItems: "center" }}>
          <p className="hello" style={{ margin: 0 }}>{hello}</p>
          <div className="row" style={{ gap: 6 }}>
            <span
              className="chip is-active"
              style={{ minHeight: 30, padding: "0 10px", fontSize: 12 }}
            >
              Stays
            </span>
            <Link
              href="/buy"
              className="chip"
              style={{ minHeight: 30, padding: "0 10px", fontSize: 12 }}
            >
              Buy
            </Link>
          </div>
        </div>
        <h1 style={{ marginTop: 8 }}>Direct beachfront sanctuaries</h1>
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          Private shoreline estates with collector-grade automotive accommodations. Zero inland compromises.
        </p>
      </section>

      <section className="searchwrap">
        <form className="searchbar" role="search" onSubmit={search}>
          <Icon name="search" className="ico s-ico" />
          <input
            type="search"
            placeholder="Search beachfront estates, dunes or garages"
            aria-label="Search beachfront estates, dunes or garages"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            type="button"
            className="cmdk-trigger-btn"
            onClick={() => window.dispatchEvent(new Event("open-command-menu"))}
            aria-label="Open command palette"
            title="Press ⌘K or Ctrl+K to search"
          >
            <kbd>⌘K</kbd>
          </button>
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
            Own a coastal holding?
          </p>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 28, marginTop: 6 }}>
            List your beachfront estate for sale or private stay.
          </h2>
          <div className="row mt" style={{ flexWrap: "wrap", gap: 8 }}>
            <button className="btn sm" type="button" onClick={() => router.push("/host/new?mode=sale")}>
              List for Sale
            </button>
            <button className="btn outline sm" type="button" onClick={() => router.push("/host/new")}>
              Host Guests
            </button>
            <button className="btn ghost sm" type="button" onClick={() => router.push("/realtor")}>
              Realtor Portal →
            </button>
          </div>
        </div>
      </section>

      <BaseSheet
        open={sheet === "where"}
        onOpenChange={(open) => !open && setSheet(null)}
        title="Where to?"
      >
        <div className="stack">
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
            </button>
          ))}
        </div>
      </BaseSheet>

      <BaseSheet
        open={sheet === "when"}
        onOpenChange={(open) => !open && setSheet(null)}
        title="When are you going?"
      >
        <p className="muted">Pick dates on a farmhouse when you check availability. Minimum stay is 2 nights.</p>
        <button
          className="btn block mt"
          type="button"
          onClick={() => {
            setSheet(null);
            search();
          }}
        >
          Browse available stays
        </button>
      </BaseSheet>

      <BaseSheet
        open={sheet === "guests"}
        onOpenChange={(open) => !open && setSheet(null)}
        title="Guests"
      >
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
      </BaseSheet>
    </Shell>
  );
}
