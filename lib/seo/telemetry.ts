export const METRIC_EVENTS = ["property_view", "search", "filter", "wishlist", "inquiry", "booking_start", "booking_complete", "guide_view", "location_page_view"] as const;
export function metricInput(input: unknown): { event: string; property_id: string | null } | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  if (typeof value.event !== "string" || !METRIC_EVENTS.includes(value.event as typeof METRIC_EVENTS[number])) return null;
  const property = value.propertyId;
  return { event: value.event, property_id: typeof property === "string" && /^[a-zA-Z0-9-]{1,100}$/.test(property) ? property : null };
}
