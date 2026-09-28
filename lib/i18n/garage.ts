import type { DictKey } from "./en";

export type TFn = (key: DictKey, vars?: Record<string, string | number>) => string;

/** Canonical garage type -> catalog key. */
const GARAGE_TYPE_KEY: Record<string, DictKey> = {
  collector_vault: "garage.collectorVault",
  marine_port: "garage.marinePort",
  ev_pavilion: "garage.evPavilion",
  teak_portico: "garage.teakPortico",
};

/**
 * Translate a garage type slug. Falls back to the Teak Portico label, which
 * matches the existing `?:` chain behaviour in the card components.
 */
export function garageLabel(t: TFn, type: string): string {
  return t(GARAGE_TYPE_KEY[type] ?? "garage.teakPortico");
}
