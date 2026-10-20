export const listingFactKeys = ["pool_fenced", "step_free_access", "pet_facilities", "workspace", "overnight_capacity", "visitor_capacity", "event_capacity", "ground_floor_bedrooms", "parking_spaces", "beds"] as const;
export type ListingFactKey = typeof listingFactKeys[number];
export type ListingFactInput = { property_id: string; fact_key: ListingFactKey; value: boolean | number; source_label: string; observed_on: string; media_id: string | null };
export type ListingFact = ListingFactInput & { review_status: "supplied" | "reviewed" | "rejected" | "expired"; review_scope: string | null; reviewed_at: string | null; expires_at: string | null };
export type ListingMedia = { id: string; property_id: string; kind: "photo" | "floor_plan" | "accessible_route" | "bed_layout"; url: string; room_label: string; caption: string; width_cm: number | null; length_cm: number | null };
export type ListingOccasion = { property_id: string; occasion: "family_stay" | "celebration" | "wedding" | "shoot" | "corporate_retreat" | "external_services"; permission: "not_allowed" | "approval_required"; conditions: string };

export function validateListingFact(fact: ListingFactInput, today = new Date().toISOString().slice(0, 10)): void {
  const booleanKeys: readonly string[] = listingFactKeys.slice(0, 4);
  if (!listingFactKeys.includes(fact.fact_key) || !fact.property_id.trim()) throw new Error("Choose a listing and supported fact.");
  if (booleanKeys.includes(fact.fact_key) ? typeof fact.value !== "boolean" : typeof fact.value !== "number" || !Number.isInteger(fact.value) || fact.value < 0 || fact.value > 10000) throw new Error("Enter a valid feature value.");
  if (!fact.source_label.trim() || fact.source_label.length > 200) throw new Error("Provide the source of this fact.");
  const parsed = new Date(`${fact.observed_on}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fact.observed_on) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== fact.observed_on || fact.observed_on > today) throw new Error("Provide a valid observation date.");
}

/** Missing, rejected, expired or unreviewed evidence cannot satisfy a verified filter. */
export function hasReviewedFeature(facts: readonly ListingFact[], key: ListingFactKey, now = Date.now()): boolean {
  return facts.some(fact => fact.fact_key === key && fact.value === true && fact.review_status === "reviewed" && !!fact.media_id
    && !!fact.review_scope?.trim() && !!fact.reviewed_at && Date.parse(fact.reviewed_at) <= now && !!fact.expires_at && Date.parse(fact.expires_at) > now);
}

/** A supplied-data checklist only; its score is never a verification decision. */
export function listingQuality(media: readonly ListingMedia[], facts: readonly ListingFact[]) {
  const items = [
    { key: "photos", complete: media.filter(item => item.kind === "photo").length >= 3 },
    { key: "floor_plan", complete: media.some(item => item.kind === "floor_plan") },
    { key: "bed_layout", complete: media.some(item => item.kind === "bed_layout") },
    { key: "overnight_capacity", complete: facts.some(item => item.fact_key === "overnight_capacity" && typeof item.value === "number" && item.value > 0 && item.review_status !== "rejected") },
    { key: "accessibility", complete: facts.some(item => item.fact_key === "step_free_access" && typeof item.value === "boolean" && item.review_status !== "rejected") },
  ];
  return { items, supplied: items.filter(item => item.complete).length, total: items.length };
}
