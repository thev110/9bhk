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
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { properties } = useCatalog();
  const { setCity, showToast } = useStore();

  useEffect(() => {
    setMounted(true);
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

  if (!mounted || !open) return null;

  return (
    <div className="cmdk-scrim" onClick={() => setOpen(false)}>
      <div className="cmdk-modal" onClick={(e) => e.stopPropagation()}>
        <Command label="Global Command Palette">
          <div className="cmdk-header">
            <Icon name="search" className="cmdk-search-ico" />
            <Command.Input placeholder="Search beachfront estates, garage types, coastal frontage… (ESC)" autoFocus />
            <button className="cmdk-close" type="button" onClick={() => setOpen(false)} aria-label="Close search">
              <kbd>ESC</kbd>
            </button>
          </div>

          <Command.List className="cmdk-list">
            <Command.Empty className="cmdk-empty">No coastal estates or commands match that search.</Command.Empty>

            <Command.Group heading="Exclusive Coastal Sanctuaries">
              {properties.slice(0, 5).map((p) => (
                <Command.Item
                  key={p.id}
                  value={`${p.name} ${p.location} ${p.beachFrontage} ${p.garage.name}`}
                  onSelect={() => run(() => router.push(`/property/${p.id}`))}
                  className="cmdk-item"
                >
                  <Icon name="home" />
                  <div className="cmdk-item-main">
                    <strong>{p.name}</strong>
                    <span>
                      {p.location} · {p.beachFrontage.split(" ")[0]}ft Beach
                      {p.isForSale && p.salePrice ? ` · ${p.salePrice >= 10000000 ? `₹${(p.salePrice / 10000000).toFixed(1)}Cr` : ""}` : ` · ₹${p.price.toLocaleString("en-IN")}/nt`}
                    </span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Primary Portals & Actions">
              <Command.Item value="buy marketplace properties for sale acquisition" onSelect={() => run(() => router.push("/buy"))} className="cmdk-item">
                <Icon name="award" />
                <span>Buy Marketplace (Estates For Sale)</span>
              </Command.Item>
              <Command.Item value="realtor broker portal client onboarding mandates" onSelect={() => run(() => router.push("/realtor"))} className="cmdk-item">
                <Icon name="key" />
                <span>Realtor & Broker Portal</span>
              </Command.Item>
              <Command.Item value="home explore beachfront stays" onSelect={() => run(() => router.push("/"))} className="cmdk-item">
                <Icon name="compass" />
                <span>Explore Beachfront Stays</span>
              </Command.Item>
              <Command.Item value="host list estate sell property" onSelect={() => run(() => router.push("/host/new"))} className="cmdk-item">
                <Icon name="home" />
                <span>List an Estate (For Sale / Rent)</span>
              </Command.Item>
              <Command.Item value="saved wishlists" onSelect={() => run(() => router.push("/saved"))} className="cmdk-item">
                <Icon name="heart" />
                <span>Saved Sanctuaries</span>
              </Command.Item>
              <Command.Item value="trips bookings" onSelect={() => run(() => router.push("/trips"))} className="cmdk-item">
                <Icon name="map" />
                <span>My Trips</span>
              </Command.Item>
              <Command.Item value="profile account" onSelect={() => run(() => router.push("/profile"))} className="cmdk-item">
                <Icon name="user" />
                <span>Profile & Settings</span>
              </Command.Item>
              <Command.Item value="admin operations console" onSelect={() => run(() => router.push("/admin"))} className="cmdk-item">
                <Icon name="shield" />
                <span>Admin Operations Console</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Automotive & Garage Architecture">
              <Command.Item
                value="subterranean collector vault supercar"
                onSelect={() => run(() => router.push("/buy?garage=collector_vault"))}
                className="cmdk-item"
              >
                <Icon name="car" />
                <span>Subterranean Collector Vaults (Supercar Low-Ramp)</span>
              </Command.Item>
              <Command.Item
                value="marine port slipway boat trailer"
                onSelect={() => run(() => router.push("/buy?garage=marine_port"))}
                className="cmdk-item"
              >
                <Icon name="waves" />
                <span>Beach & Marine Slipway Ports</span>
              </Command.Item>
              <Command.Item
                value="ev high-output pavilion charging fast"
                onSelect={() => run(() => router.push("/buy?garage=ev_pavilion"))}
                className="cmdk-item"
              >
                <Icon name="bolt" />
                <span>High-Output EV Pavilions (50kW+ DC)</span>
              </Command.Item>
              <Command.Item
                value="coastal teak portico shade"
                onSelect={() => run(() => router.push("/buy?garage=teak_portico"))}
                className="cmdk-item"
              >
                <Icon name="car" />
                <span>Coastal Teak Open Porticos</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Filter by Coastal Zone">
              {CITIES.map((c) => (
                <Command.Item
                  key={c}
                  value={`coastal region ${c}`}
                  onSelect={() =>
                    run(() => {
                      setCity(c);
                      router.push(`/search?city=${encodeURIComponent(c)}`);
                    })
                  }
                  className="cmdk-item"
                >
                  <Icon name="pin" />
                  <span>Estates along {c}</span>
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
