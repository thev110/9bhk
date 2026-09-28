import type { Booking, User } from "@/lib/store";
import { browserSupabase } from "@/lib/supabase/browser";

async function sessionUserId(): Promise<string | null> {
  const supabase = browserSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function persistProfile(user: User): Promise<void> {
  const supabase = browserSupabase();
  const id = await sessionUserId();
  if (!supabase || !id) return;
  await supabase.from("bhk_profiles").upsert({
    id,
    full_name: user.name,
    email: user.email,
    phone: user.phone,
    avatar_url: user.avatarUrl ?? null,
    city: user.city,
    upi_id: user.upiId ?? null,
    role: user.role || "buyer",
    agency_name: user.agencyName ?? null,
    rera_number: user.reraNumber ?? null,
    verified_broker: Boolean(user.verifiedBroker),
    commission_rate: user.commissionRate ?? 2.0,
    locale: user.locale ?? "en",
  });
}

/** Persist a language change without touching the rest of the profile row. */
export async function persistLocale(locale: string): Promise<void> {
  const supabase = browserSupabase();
  const id = await sessionUserId();
  if (!supabase || !id) return;
  await supabase.from("bhk_profiles").update({ locale }).eq("id", id);
}

export async function persistBooking(booking: Booking): Promise<void> {
  const supabase = browserSupabase();
  const id = await sessionUserId();
  if (!supabase || !id) return;
  await supabase.from("bhk_bookings").insert({
    code: booking.code,
    property_id: booking.propertyId,
    property_name: booking.propertyName || booking.propertyId,
    guest_id: id,
    guest_name: booking.guestName,
    guest_email: booking.guestEmail,
    guest_phone: booking.guestPhone,
    check_in: booking.checkIn,
    check_out: booking.checkOut,
    adults: booking.adults,
    children: booking.children,
    total: booking.total,
    status: booking.status,
    upi_id: booking.upiId ?? null,
    payment_ref: booking.paymentRef ?? null,
  });
  await supabase.from("bhk_notifications").insert({
    user_id: id,
    title: "Payment sent",
    body: `${booking.propertyName || "Your farmhouse"} is waiting for the host to confirm.`,
    href: "/trips",
  });
}

export async function persistConfirmation(booking: Booking): Promise<void> {
  const supabase = browserSupabase();
  const id = await sessionUserId();
  if (!supabase || !id) return;
  await supabase.from("bhk_bookings").update({ status: "confirmed" }).eq("code", booking.code);
  await supabase.from("bhk_notifications").insert({
    user_id: id,
    title: "Stay is booked",
    body: `${booking.propertyName || "Your farmhouse"} is confirmed. Check Trips for arrival details.`,
    href: "/trips",
  });
}

export async function persistClient(client: any): Promise<void> {
  const supabase = browserSupabase();
  const id = await sessionUserId();
  if (!supabase || !id) return;
  await supabase.from("bhk_realtor_clients").insert({
    id: client.id,
    realtor_id: id,
    name: client.name,
    phone: client.phone,
    email: client.email || null,
    budget_min_cr: client.budgetMinCr,
    budget_max_cr: client.budgetMaxCr,
    preferred_stretch: client.preferredStretch,
    garage_need: client.garageNeed,
    confidential: client.confidential,
    notes: client.notes || null,
  });
}

export async function deleteClientFromDb(clientId: string): Promise<void> {
  const supabase = browserSupabase();
  const id = await sessionUserId();
  if (!supabase || !id) return;
  await supabase.from("bhk_realtor_clients").delete().eq("id", clientId).eq("realtor_id", id);
}

export async function loadRealtorClients(): Promise<any[]> {
  const supabase = browserSupabase();
  const id = await sessionUserId();
  if (!supabase || !id) return [];
  const { data } = await supabase.from("bhk_realtor_clients").select("*").eq("realtor_id", id);
  if (!data) return [];
  return data.map((r: any) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email || undefined,
    budgetMinCr: Number(r.budget_min_cr),
    budgetMaxCr: Number(r.budget_max_cr),
    preferredStretch: r.preferred_stretch,
    garageNeed: r.garage_need,
    confidential: Boolean(r.confidential),
    notes: r.notes || undefined,
    createdAt: r.created_at,
  }));
}

export async function persistViewingRequest(req: {
  propertyId: string;
  propertyName: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  automotiveMandate?: string;
}): Promise<void> {
  const supabase = browserSupabase();
  const id = await sessionUserId();
  if (!supabase) return;
  await supabase.from("bhk_viewing_requests").insert({
    property_id: req.propertyId,
    property_name: req.propertyName,
    buyer_name: req.buyerName,
    buyer_phone: req.buyerPhone,
    buyer_email: req.buyerEmail || null,
    user_id: id || null,
    automotive_mandate: req.automotiveMandate || null,
  });
}
