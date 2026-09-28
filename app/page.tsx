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
import { useT } from "@/lib/i18n";
import { vibeLabel } from "@/lib/i18n/vibes";
import type { DictKey } from "@/lib/i18n/en";

function greetingKey(): DictKey {
  const hour = new Date().getHours();
  if (hour < 12) return "home.greeting.morning";
  if (hour < 17) return "home.greeting.afternoon";
  return "home.greeting.evening";
}

export default function HomePage() {
  const router = useRouter();
  const { city, setCity } = useStore();
  const { properties } = useCatalog();
  const t = useT();
  const [q, setQ] = useState("");
  const [sheet, setSheet] = useState<"where" | "when" | "guests" | null>(null);
  const [guests, setGuests] = useState(2);
  const [helloKey, setHelloKey] = useState<DictKey>("home.greeting.evening");

  useEffect(() => {
    setHelloKey(greetingKey());
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
          <p className="hello" style={{ margin: 0 }}>{t(helloKey)}</p>
          <div className="row" style={{ gap: 6 }}>
            <span
              className="chip is-active"
              style={{ minHeight: 30, padding: "0 10px", fontSize: 12 }}
            >
              {t("nav.explore")}
            </span>
            <Link
              href="/buy"
              className="chip"
              style={{ minHeight: 30, padding: "0 10px", fontSize: 12 }}
            >
              {t("nav.buy")}
            </Link>
          </div>
        </div>
        <h1 style={{ marginTop: 8 }}>{t("home.title")}</h1>
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          {t("home.subtitle")}
        </p>
      </section>

      <section className="searchwrap">
        <form className="searchbar" role="search" onSubmit={search}>
          <Icon name="search" className="ico s-ico" />
          <input
            type="search"
            placeholder={t("home.searchPlaceholder")}
            aria-label={t("home.searchPlaceholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            type="button"
            className="cmdk-trigger-btn"
            onClick={() => window.dispatchEvent(new Event("open-command-menu"))}
            aria-label={t("a11y.openCommandPalette")}
            title={t("a11y.commandHint")}
          >
            <kbd>⌘K</kbd>
          </button>
          <button className="search-submit" type="submit" aria-label={t("a11y.search")}>
            <Icon name="arrow" />
          </button>
        </form>
        <div className="summary" role="group" aria-label={t("a11y.tripDetails")}>
          <button className="sum-cell" type="button" onClick={() => setSheet("where")}>
            <span className="k">
              <Icon name="pin" />
              {t("home.where")}
            </span>
            <span className="v">{city}</span>
          </button>
          <button className="sum-cell" type="button" onClick={() => setSheet("when")}>
            <span className="k">
              <Icon name="calendar" />
              {t("home.when")}
            </span>
            <span className="v">{t("home.addDates")}</span>
          </button>
          <button className="sum-cell" type="button" onClick={() => setSheet("guests")}>
            <span className="k">
              <Icon name="users" />
              {t("home.guests")}
            </span>
            <span className="v">{t("home.guestCount", { n: guests })}</span>
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>{t("home.sectionSlowWeekends")}</h2>
          <button className="see-all" type="button" onClick={() => router.push("/search")}>
            {t("home.seeAll")} <Icon name="arrow" />
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
          <h2>{t("home.sectionVibe")}</h2>
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
              {vibeLabel(t, vibe)}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>{t("home.sectionNearby")}</h2>
          <button className="see-all" type="button" onClick={() => router.push(`/search?city=${encodeURIComponent(city)}`)}>
            {t("home.seeAll")} <Icon name="arrow" />
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
          <h2>{t("home.sectionPopular")}</h2>
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
            {t("home.hostEyebrow")}
          </p>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 28, marginTop: 6 }}>
            {t("home.hostTitle")}
          </h2>
          <div className="row mt" style={{ flexWrap: "wrap", gap: 8 }}>
            <button className="btn sm" type="button" onClick={() => router.push("/host/new?mode=sale")}>
              {t("home.listForSale")}
            </button>
            <button className="btn outline sm" type="button" onClick={() => router.push("/host/new")}>
              {t("home.hostGuests")}
            </button>
            <button className="btn ghost sm" type="button" onClick={() => router.push("/realtor")}>
              {t("home.realtorPortal")}
            </button>
          </div>
        </div>
      </section>

      <BaseSheet
        open={sheet === "where"}
        onOpenChange={(open) => !open && setSheet(null)}
        title={t("home.whereTitle")}
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
        title={t("home.whenTitle")}
      >
        <p className="muted">{t("home.whenBody")}</p>
        <button
          className="btn block mt"
          type="button"
          onClick={() => {
            setSheet(null);
            search();
          }}
        >
          {t("home.browseStays")}
        </button>
      </BaseSheet>

      <BaseSheet
        open={sheet === "guests"}
        onOpenChange={(open) => !open && setSheet(null)}
        title={t("home.guests")}
      >
        <div className="between">
          <div>
            <strong>{t("home.guests")}</strong>
            <p className="muted">{t("home.anyAgeCounts")}</p>
          </div>
          <div className="stepper">
            <button type="button" aria-label={t("a11y.fewerGuests")} onClick={() => setGuests((n) => Math.max(1, n - 1))}>
              <Icon name="minus" />
            </button>
            <span className="val num">{guests}</span>
            <button type="button" aria-label={t("a11y.moreGuests")} onClick={() => setGuests((n) => Math.min(16, n + 1))}>
              <Icon name="plus" />
            </button>
          </div>
        </div>
        <button className="btn block mt" type="button" onClick={() => setSheet(null)}>
          {t("action.done")}
        </button>
      </BaseSheet>
    </Shell>
  );
}
