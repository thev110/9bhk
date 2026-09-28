"use client";

import Link from "next/link";
import { Shell } from "@/components/shell";
import { ResultCard } from "@/components/cards";
import { Icon } from "@/components/icon";
import { useCatalog } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export default function SavedPage() {
  const { saved } = useStore();
  const { properties } = useCatalog();
  const t = useT();
  const places = properties.filter((p) => saved.includes(p.id));
  const popular = properties.filter((p) => p.id === "blue-horizon" || p.id === "terracotta");

  return (
    <Shell nav="saved">
      <header className="page-head">
        <h1>{t("nav.saved")}</h1>
        <p className="sub">{t("saved.sub")}</p>
      </header>

      {places.length === 0 ? (
        <div className="empty">
          <div className="ic">
            <Icon name="heart" />
          </div>
          <h3>{t("saved.emptyTitle")}</h3>
          <p>{t("saved.emptyBody")}</p>
          <p>{t("saved.emptyBody2")}</p>
          <Link className="btn" href="/">
            {t("saved.explore")}
          </Link>
        </div>
      ) : (
        <div className="list-stack pad mt">
          {places.map((p) => (
            <ResultCard key={p.id} property={p} />
          ))}
        </div>
      )}

      <section className="section">
        <div className="section-head">
          <h2>{t("saved.popularNow")}</h2>
          <Link className="see-all" href="/search">
            {t("home.seeAll")} <Icon name="arrow" />
          </Link>
        </div>
        <div className="list-stack pad">
          {popular.map((p) => (
            <ResultCard key={p.id} property={p} />
          ))}
        </div>
      </section>
    </Shell>
  );
}
