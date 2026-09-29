import { SETTING_LABEL, type Setting } from "@/lib/properties";
import type { DictKey } from "./en";
import type { TFn } from "./garage";

/**
 * VIBES and FILTERS (lib/properties.ts) are load-bearing: `matchesFilter()`
 * lowercases the value and matches it against the property, and the home page
 * puts it in the URL as `?vibe=...`. Translating the array values themselves
 * would break both.
 *
 * So the English value stays the identity and these map it to a display label.
 */
const VIBE_LABEL: Record<string, DictKey> = {
  Seaside: "setting.seaside",
  "Hill Station": "setting.hillStation",
  "In the City": "setting.city",
  Countryside: "setting.countryside",
  "Collector Garage": "vibe.collectorGarage",
  "EV Ready": "vibe.evReady",
  "Teak Portico": "garage.teakPortico",
  Pool: "vibe.pool",
  "Large Groups": "vibe.largeGroups",
  Bonfire: "vibe.bonfire",
  "Celebration Ready": "celebration.filter",
};

const FILTER_LABEL: Record<string, DictKey> = {
  ...VIBE_LABEL,
  "Supercar Garage": "filter.supercarGarage",
  "For Sale": "property.forSale",
};

const SETTING_KEY: Record<Setting, DictKey> = {
  seaside: "setting.seaside",
  hill_station: "setting.hillStation",
  city: "setting.city",
  countryside: "setting.countryside",
};

/** Display label for a VIBES entry. Unknown values fall through unchanged. */
export function vibeLabel(t: TFn, vibe: string): string {
  const key = VIBE_LABEL[vibe];
  return key ? t(key) : vibe;
}

/** Display label for a FILTERS entry. Unknown values fall through unchanged. */
export function filterLabel(t: TFn, filter: string): string {
  const key = FILTER_LABEL[filter];
  return key ? t(key) : filter;
}

/** Display label for a `Setting`. */
export function settingLabel(t: TFn, setting: Setting): string {
  return t(SETTING_KEY[setting]);
}

/** Display label for a `Setting`, keyed off its English identity string. */
export function settingLabelFor(t: TFn, label: string): string {
  const match = (Object.keys(SETTING_LABEL) as Setting[]).find(
    (key) => SETTING_LABEL[key] === label,
  );
  return match ? settingLabel(t, match) : label;
}
