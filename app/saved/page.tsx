"use client";

import Link from "next/link";
import { Shell } from "@/components/shell";
import { ResultCard } from "@/components/cards";
import { Icon } from "@/components/icon";
import { PROPERTIES } from "@/lib/properties";
import { useStore } from "@/lib/store";

export default function SavedPage() {
  const { saved } = useStore();
  const places = PROPERTIES.filter((p) => saved.includes(p.id));
  const popular = PROPERTIES.filter((p) => p.id === "blue-horizon" || p.id === "terracotta");

  return (
    <Shell nav="saved">
      <header className="page-head">
        <h1>Wishlists</h1>
        <p className="sub">Saved</p>
      </header>

      {places.length === 0 ? (
        <div className="empty">
          <div className="ic">
            <Icon name="heart" />
          </div>
          <h3>Nothing saved yet.</h3>
          <p>Save places you want to come back to.</p>
          <p>Tap the heart on any farmhouse and it lands here for your next escape.</p>
          <Link className="btn" href="/">
            Explore farmhouses
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
          <h2>Popular right now</h2>
          <Link className="see-all" href="/search">
            See all <Icon name="arrow" />
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
