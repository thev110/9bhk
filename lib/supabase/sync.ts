import type { Booking, User, RealtorClient, RealtorProperty } from "@/lib/store";
import type { SplitShare } from "@/lib/split";
import { requireSupabase, accountRequest } from "@/lib/supabase/browser";

/** A live stay, as the calendar needs it: dates and status, nothing personal. */
export type AvailabilityRange = {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  status: string;
};

type AvailabilityRow = {
  property_id: string;
  check_in: string;
  check_out: string;
  status: string;
};

function toRange(row: AvailabilityRow): AvailabilityRange {
  return {
    propertyId: row.property_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
    status: row.status,
  };
}

async function requireAccount() {
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Please sign in to continue.");
  return { supabase, id: data.user.id };
}

export async function persistProfile(user: User): Promise<void> {
  const { supabase, id } = await requireAccount();
  if (user.id !== id) throw new Error("Your account changed. Please reload before saving your profile.");
  const { error } = await supabase.from("bhk_profiles").update({
    full_name: user.name, phone: user.phone, avatar_url: user.avatarUrl ?? null,
    city: user.city, upi_id: user.upiId ?? null,
    role: user.role === "admin" ? undefined : user.role || "buyer",
    agency_name: user.agencyName ?? null, rera_number: user.reraNumber ?? null,
    locale: user.locale ?? "en",
  }).eq("id", id).select("id").single();
  if (error) throw error;
}

export async function persistLocale(locale: string): Promise<void> {
  const { supabase, id } = await requireAccount();
  const { error } = await supabase.from("bhk_profiles").update({ locale }).eq("id", id);
  if (error) throw error;
}

export async function persistBooking(_booking: Booking): Promise<void> { throw new Error("Bookings must be created through secure checkout."); }
export async function persistConfirmation(_booking: Booking): Promise<void> { throw new Error("Payment confirmation must be verified by the server."); }
export async function persistCancellation(booking: Booking): Promise<void> {
  await accountRequest(`/api/bookings/${encodeURIComponent(booking.code)}/cancel`);
}
export async function persistSplitShares(bookingCode: string, shares: SplitShare[]): Promise<void> {
  await accountRequest("/api/split/create", { bookingCode, members: shares.map(s => s.name) });
}

export async function persistClient(client: RealtorClient): Promise<void> {
  const { supabase, id } = await requireAccount();
  const { error } = await supabase.from("bhk_realtor_clients").insert({
    id: client.id, realtor_id: id, name: client.name, phone: client.phone,
    email: client.email || null, budget_min_cr: client.budgetMinCr, budget_max_cr: client.budgetMaxCr,
    preferred_stretch: client.preferredStretch, garage_need: client.garageNeed,
    confidential: client.confidential, notes: client.notes || null,
  });
  if (error) throw error;
}
export async function deleteClientFromDb(clientId: string): Promise<void> {
  const { supabase, id } = await requireAccount();
  const { data, error } = await supabase.from("bhk_realtor_clients").delete().eq("id", clientId).eq("realtor_id", id).select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("Client was not found or cannot be removed.");
}
export async function persistRealtorProperty(prop: RealtorProperty): Promise<void> {
  const { supabase, id } = await requireAccount();
  const { error } = await supabase.from("bhk_broker_properties").insert({
    id: prop.id, realtor_id: id, source_property_id: prop.sourcePropertyId || null,
    name: prop.name, location: prop.location, city: prop.city, bedrooms: prop.bedrooms,
    bathrooms: prop.bathrooms, guests: prop.guests, for_rent: prop.forRent, for_sale: prop.forSale,
    nightly_rate: prop.nightlyRate ?? null, sale_price_cr: prop.salePriceCr ?? null,
    pool: prop.pool, notes: prop.notes || null,
  });
  if (error) throw error;
}
export async function deleteRealtorProperty(idToDelete: string): Promise<void> {
  const { supabase, id } = await requireAccount();
  const { data, error } = await supabase.from("bhk_broker_properties").delete().eq("id", idToDelete).eq("realtor_id", id).select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("Property was not found or cannot be removed.");
}
export async function persistSaved(propertyId: string, saved: boolean): Promise<void> {
  const { supabase, id } = await requireAccount();
  const result = saved
    ? await supabase.from("bhk_wishlist").upsert({ user_id: id, property_id: propertyId }, { onConflict: "user_id,property_id", ignoreDuplicates: true })
    : await supabase.from("bhk_wishlist").delete().eq("user_id", id).eq("property_id", propertyId);
  if (result.error) throw result.error;
}
export async function persistNotificationRead(noteId: string): Promise<void> {
  const { supabase, id } = await requireAccount();
  const { error } = await supabase.from("bhk_notifications").update({ read_at: new Date().toISOString() }).eq("id", noteId).eq("user_id", id).select("id").single();
  if (error) throw error;
}

/** Public occupied-night projection. Fail closed when the projection cannot be loaded;
 * querying only the viewer's own bookings would incorrectly expose other guests' nights as free. */
export async function loadAvailability(): Promise<AvailabilityRange[]> {
  const supabase = requireSupabase();

  const { data, error } = await supabase.rpc("bhk_availability");
  if (!error && Array.isArray(data)) {
    return (data as unknown as AvailabilityRow[]).map(toRange);
  }

  throw new Error("Live availability is unavailable. Please try again shortly.");
}

export async function persistViewingRequest(req: {
  propertyId: string; propertyName: string; buyerName: string; buyerPhone: string;
  buyerEmail?: string; automotiveMandate?: string; notes?: string;
}): Promise<void> {
  await accountRequest("/api/viewings", req);
}
