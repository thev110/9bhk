import type { DictKey } from "./en";
import type { TFn } from "./garage";

/**
 * VIBES and FILTERS (lib/properties.ts) are load-bearing: `matchesFilter()`
 * lowercases the value and substring-matches it against the property blob, and
 * the home page puts it in the URL as `?vibe=...`. Translating the array
 * values themselves would break both.
 *
 * So the English value stays the identity and these map it to a display label.
 */
const VIBE_LABEL: Record<string, DictKey> = {
  Oceanfront: "vibe.oceanfront",
  "Collector Garage": "vibe.collectorGarage",
  "Marine Port": "garage.marinePort",
  "EV Ready": "vibe.evReady",
  "Teak Portico": "garage.teakPortico",
  Pool: "vibe.pool",
  "Direct Beach": "vibe.directBeach",
  "Large Groups": "vibe.largeGroups",
};

const FILTER_LABEL: Record<string, DictKey> = {
  ...VIBE_LABEL,
  "Supercar Garage": "filter.supercarGarage",
  "For Sale": "property.forSale",
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
