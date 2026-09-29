import { inr } from "@/lib/format";
import { browserSupabase } from "@/lib/supabase/browser";
import { listDocumentsForProperties, type PropertyDocument } from "@/lib/supabase/documents";

/**
 * The console's review queue, read from listings that are actually waiting.
 *
 * This used to be a hardcoded batch, which meant the "submitted documents"
 * checklist was decoration: it could not show a real upload, and a Download
 * button had nothing to download. Everything here is a live row.
 */

/** What staff can do to a submission, in the console's vocabulary. */
export type ListingDecision = "approve" | "changes" | "reject";

export type ReviewListing = {
  id: string;
  name: string;
  /** Location and capacity line, pre-joined for display. */
  meta: string;
  host: string;
  hostId: string | null;
  price: string;
  amenities: string;
  images: string[];
  /** ISO timestamp, or null for rows that predate the review columns. */
  submittedAt: string | null;
  documents: PropertyDocument[];
};

type PropertyRow = {
  id: string;
  name: string;
  type: string | null;
  location: string | null;
  city: string | null;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  price: number;
  amenities: string[] | null;
  image_urls: string[] | null;
  host_id: string | null;
  submitted_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
};

/**
 * A decision maps onto the listing's `status`, because `status` is what the
 * public catalog already filters on — 'changes' sends it back to the host
 * rather than live, and only 'approve' publishes.
 */
const DECISION_STATUS: Record<ListingDecision, string> = {
  approve: "published",
  changes: "pending",
  reject: "rejected",
};

/** Fallback art, so a listing with no photos still renders a card. */
const PLACEHOLDER_IMAGE = "/assets/prop-palm-grove.jpg";

/**
 * Every listing awaiting a decision, newest first, with its documents.
 *
 * Returns an empty array rather than throwing when the caller is not staff or
 * Supabase is absent — the console then shows an honest empty queue instead of
 * an error it cannot act on.
 */
export async function loadReviewQueue(): Promise<ReviewListing[]> {
  const supabase = browserSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("bhk_properties")
    .select(
      "id, name, type, location, city, guests, bedrooms, beds, bathrooms, price, amenities, image_urls, host_id, submitted_at",
    )
    .eq("status", "pending")
    .order("submitted_at", { ascending: false, nullsFirst: false });
  if (error || !data) return [];

  const rows = data as unknown as PropertyRow[];
  if (rows.length === 0) return [];

  const hostIds = [...new Set(rows.map((row) => row.host_id).filter((id): id is string => Boolean(id)))];

  // Two round trips, not N: profiles and documents are each fetched for the
  // whole batch. There is no FK between listings and profiles to embed through
  // (both point at auth.users), so host names are joined here.
  const [profiles, documents] = await Promise.all([
    hostIds.length
      ? supabase
          .from("bhk_profiles")
          .select("id, full_name, email, created_at")
          .in("id", hostIds)
          .then(({ data: found }) => (found as unknown as ProfileRow[] | null) ?? [])
      : Promise.resolve([] as ProfileRow[]),
    listDocumentsForProperties(rows.map((row) => row.id)),
  ]);

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const docsByProperty = new Map<string, PropertyDocument[]>();
  for (const doc of documents) {
    const list = docsByProperty.get(doc.propertyId);
    if (list) list.push(doc);
    else docsByProperty.set(doc.propertyId, [doc]);
  }

  return rows.map((row) => {
    const profile = row.host_id ? profileById.get(row.host_id) : undefined;
    const hostName = profile?.full_name || profile?.email?.split("@")[0] || "";
    const since = profile?.created_at ? new Date(profile.created_at).getFullYear() : null;

    return {
      id: row.id,
      name: row.name,
      meta: [
        row.city || row.location || "",
        `${row.guests} guests`,
        `${row.bedrooms} bedrooms`,
        `${row.beds} beds`,
        `${row.bathrooms} bathrooms`,
      ]
        .filter(Boolean)
        .join(" · "),
      host: since ? `${hostName} · host since ${since}` : hostName,
      hostId: row.host_id,
      price: inr(row.price),
      amenities: (row.amenities ?? []).join(" · "),
      images: (row.image_urls ?? []).length ? (row.image_urls as string[]) : [PLACEHOLDER_IMAGE],
      submittedAt: row.submitted_at,
      documents: docsByProperty.get(row.id) ?? [],
    };
  });
}

/**
 * Record a staff decision on a listing.
 *
 * The note is stored either way: a rejection without a reason is what makes a
 * host resubmit the same listing unchanged.
 */
export async function decideListing(input: {
  id: string;
  decision: ListingDecision;
  note?: string;
}): Promise<boolean> {
  const supabase = browserSupabase();
  if (!supabase || !input.id) return false;

  const { data } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("bhk_properties")
    .update({
      status: DECISION_STATUS[input.decision],
      review_note: input.note?.trim() || null,
      reviewed_by: data.user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.id);
  return !error;
}

/**
 * How long a submission has been waiting, as whole days.
 *
 * Returned as a number so the caller picks the wording: "today" and "waiting
 * 3 days" are different sentences in every locale.
 */
export function waitingDays(submittedAt: string | null, now: Date = new Date()): number | null {
  if (!submittedAt) return null;
  const submitted = new Date(submittedAt);
  if (Number.isNaN(submitted.getTime())) return null;
  const elapsed = now.getTime() - submitted.getTime();
  return Math.max(0, Math.floor(elapsed / 86400000));
}
