"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Icon, settingIcon } from "./icon";
import { useCatalog } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { CITIES } from "@/lib/format";
import { SETTINGS, SETTING_LABEL } from "@/lib/properties";
import { useT } from "@/lib/i18n";
import { settingLabel } from "@/lib/i18n/vibes";

export function CommandMenu() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { properties } = useCatalog();
  const { setCity, showToast } = useStore();
  const t = useT();

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
        <Command label={t("cmdk.label")}>
          <div className="cmdk-header">
            <Icon name="search" className="cmdk-search-ico" />
            <Command.Input placeholder={t("cmdk.placeholder")} autoFocus />
            <button className="cmdk-close" type="button" onClick={() => setOpen(false)} aria-label={t("a11y.closeSearch")}>
              <kbd>ESC</kbd>
            </button>
          </div>

          <Command.List className="cmdk-list">
            <Command.Empty className="cmdk-empty">{t("cmdk.empty")}</Command.Empty>

            <Command.Group heading={t("cmdk.groupEstates")}>
              {properties.slice(0, 5).map((p) => (
                <Command.Item
                  key={p.id}
                  value={`${p.name} ${p.location} ${p.settingName} ${p.settingDetail} ${p.garage?.name ?? ""}`}
                  onSelect={() => run(() => router.push(`/property/${p.id}`))}
                  className="cmdk-item"
                >
                  <Icon name={settingIcon(p.setting)} />
                  <div className="cmdk-item-main">
                    <strong>{p.name}</strong>
                    <span>
                      {p.settingName} · {p.settingDetail}
                      {p.isForSale && p.salePrice
                        ? ` · ${p.salePrice >= 10000000 ? `₹${(p.salePrice / 10000000).toFixed(1)}Cr` : ""}`
                        : ` · ₹${p.price.toLocaleString("en-IN")}/nt`}
                    </span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading={t("cmdk.groupPortals")}>
              <Command.Item value="buy marketplace properties for sale acquisition" onSelect={() => run(() => router.push("/buy"))} className="cmdk-item">
                <Icon name="award" />
                <span>{t("cmdk.buyMarketplace")}</span>
              </Command.Item>
              <Command.Item value="realtor broker portal client onboarding mandates" onSelect={() => run(() => router.push("/realtor"))} className="cmdk-item">
                <Icon name="key" />
                <span>{t("cmdk.realtorPortal")}</span>
              </Command.Item>
              <Command.Item value="home explore group stays villas" onSelect={() => run(() => router.push("/"))} className="cmdk-item">
                <Icon name="compass" />
                <span>{t("cmdk.exploreStays")}</span>
              </Command.Item>
              <Command.Item value="host list estate sell property" onSelect={() => run(() => router.push("/host/new"))} className="cmdk-item">
                <Icon name="home" />
                <span>{t("cmdk.listEstate")}</span>
              </Command.Item>
              <Command.Item value="saved wishlists" onSelect={() => run(() => router.push("/saved"))} className="cmdk-item">
                <Icon name="heart" />
                <span>{t("cmdk.savedSanctuaries")}</span>
              </Command.Item>
              <Command.Item value="trips bookings" onSelect={() => run(() => router.push("/trips"))} className="cmdk-item">
                <Icon name="map" />
                <span>{t("cmdk.myTrips")}</span>
              </Command.Item>
              <Command.Item value="profile account" onSelect={() => run(() => router.push("/profile"))} className="cmdk-item">
                <Icon name="user" />
                <span>{t("cmdk.profileSettings")}</span>
              </Command.Item>
              <Command.Item value="admin operations console" onSelect={() => run(() => router.push("/admin"))} className="cmdk-item">
                <Icon name="shield" />
                <span>{t("cmdk.adminConsole")}</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading={t("cmdk.groupGarage")}>
              <Command.Item
                value="subterranean collector vault supercar"
                onSelect={() => run(() => router.push("/buy?garage=collector_vault"))}
                className="cmdk-item"
              >
                <Icon name="car" />
                <span>{t("cmdk.collectorVaults")}</span>
              </Command.Item>
              <Command.Item
                value="marine port slipway boat trailer"
                onSelect={() => run(() => router.push("/buy?garage=marine_port"))}
                className="cmdk-item"
              >
                <Icon name="waves" />
                <span>{t("cmdk.marineSlipway")}</span>
              </Command.Item>
              <Command.Item
                value="ev high-output pavilion charging fast"
                onSelect={() => run(() => router.push("/buy?garage=ev_pavilion"))}
                className="cmdk-item"
              >
                <Icon name="bolt" />
                <span>{t("cmdk.evPavilions")}</span>
              </Command.Item>
              <Command.Item
                value="coastal teak portico shade"
                onSelect={() => run(() => router.push("/buy?garage=teak_portico"))}
                className="cmdk-item"
              >
                <Icon name="car" />
                <span>{t("cmdk.teakPorticos")}</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading={t("cmdk.groupZone")}>
              {SETTINGS.map((s) => (
                <Command.Item
                  key={s}
                  value={`setting ${SETTING_LABEL[s]}`}
                  onSelect={() => run(() => router.push(`/search?setting=${encodeURIComponent(SETTING_LABEL[s])}`))}
                  className="cmdk-item"
                >
                  <Icon name={settingIcon(s)} />
                  <span>{settingLabel(t, s)}</span>
                </Command.Item>
              ))}
              {CITIES.map((c) => (
                <Command.Item
                  key={c}
                  value={`location region ${c}`}
                  onSelect={() =>
                    run(() => {
                      setCity(c);
                      router.push(`/search?city=${encodeURIComponent(c)}`);
                    })
                  }
                  className="cmdk-item"
                >
                  <Icon name="pin" />
                  <span>{t("cmdk.estatesAlong", { city: c })}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          <div className="cmdk-footer">
            <span>{t("cmdk.tip")}</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
