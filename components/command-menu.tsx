"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Icon } from "./icon";
import { useCatalog } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { CITIES } from "@/lib/format";
import { VIBES } from "@/lib/properties";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { properties } = useCatalog();
  const { setCity, showToast } = useStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };

    const handleCustomOpen = () => setOpen(true);
    window.addEventListener("keydown", down);
    window.addEventListener("open-command-menu", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("open-command-menu", handleCustomOpen);
    };
  }, []);

  function run(callback: () => void) {
    setOpen(false);
    callback();
  }

  if (!open) return null;

  return (
    <div className="cmdk-scrim" onClick={() => setOpen(false)}>
      <div className="cmdk-modal" onClick={(e) => e.stopPropagation()}>
        <Command label="Global Command Palette">
          <div className="cmdk-header">
            <Icon name="search" className="cmdk-search-ico" />
            <Command.Input placeholder="Search farmhouses, areas, vibes or actions… (ESC to close)" autoFocus />
            <button className="cmdk-close" type="button" onClick={() => setOpen(false)} aria-label="Close search">
              <kbd>ESC</kbd>
            </button>
          </div>

          <Command.List className="cmdk-list">
            <Command.Empty className="cmdk-empty">No farmhouses or commands match that search.</Command.Empty>

            <Command.Group heading="Popular Farmhouses">
              {properties.slice(0, 5).map((p) => (
                <Command.Item
                  key={p.id}
                  value={`${p.name} ${p.location} ${p.city}`}
                  onSelect={() => run(() => router.push(`/property/${p.id}`))}
                  className="cmdk-item"
                >
                  <Icon name="home" />
                  <div className="cmdk-item-main">
                    <strong>{p.name}</strong>
                    <span>{p.location} · ₹{p.price.toLocaleString("en-IN")}/night</span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Quick Navigation">
              <Command.Item value="home explore" onSelect={() => run(() => router.push("/"))} className="cmdk-item">
                <Icon name="compass" />
                <span>Explore Feed</span>
              </Command.Item>
              <Command.Item value="saved wishlists" onSelect={() => run(() => router.push("/saved"))} className="cmdk-item">
                <Icon name="heart" />
                <span>Saved Wishlists</span>
              </Command.Item>
              <Command.Item value="trips bookings" onSelect={() => run(() => router.push("/trips"))} className="cmdk-item">
                <Icon name="map" />
                <span>My Trips</span>
              </Command.Item>
              <Command.Item value="profile account" onSelect={() => run(() => router.push("/profile"))} className="cmdk-item">
                <Icon name="user" />
                <span>Profile & Settings</span>
              </Command.Item>
              <Command.Item value="host list farmhouse" onSelect={() => run(() => router.push("/host/new"))} className="cmdk-item">
                <Icon name="award" />
                <span>List Your Farmhouse</span>
              </Command.Item>
              <Command.Item value="admin operations console" onSelect={() => run(() => router.push("/admin"))} className="cmdk-item">
                <Icon name="shield" />
                <span>Admin Operations Console</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Filter by City">
              {CITIES.map((c) => (
                <Command.Item
                  key={c}
                  value={`city ${c}`}
                  onSelect={() =>
                    run(() => {
                      setCity(c);
                      showToast(`Showing stays in ${c}`);
                      router.push(`/search?city=${encodeURIComponent(c)}`);
                    })
                  }
                  className="cmdk-item"
                >
                  <Icon name="pin" />
                  <span>Stays around {c}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Explore by Vibe">
              {VIBES.map((v) => (
                <Command.Item
                  key={v}
                  value={`vibe ${v}`}
                  onSelect={() => run(() => router.push(`/search?vibe=${encodeURIComponent(v)}`))}
                  className="cmdk-item"
                >
                  <Icon name="flame" />
                  <span>{v} farmhouses</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          <div className="cmdk-footer">
            <span>Tip: Press <strong>⌘K</strong> or <strong>Ctrl+K</strong> anytime</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
