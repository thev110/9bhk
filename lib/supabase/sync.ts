import type { Booking, User } from "@/lib/store";
import type { SplitShare } from "@/lib/split";
import { browserSupabase } from "@/lib/supabase/browser";

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

export async function persistCancellation(booking: Booking): Promise<void> {
  const supabase = browserSupabase();
  const id = await sessionUserId();
  if (!supabase || !id) return;
  await supabase.from("bhk_bookings").update({ status: "cancelled" }).eq("code", booking.code);
  await supabase.from("bhk_notifications").insert({
    user_id: id,
    title: "Stay cancelled",
    body: `${booking.propertyName || "Your farmhouse"} reservation has been cancelled and dates released.`,
    href: "/trips",
  });
}

/**
 * Persist the group's split ledger so each share exists as a real row.
 *
 * Keyed by booking *code* because that is what the client holds; the table
 * itself references the booking's uuid, which the browser never sees.
 *
 * Note this writes the locally-known paid flags. The authoritative settle
 * happens in the payment webhook, which runs with the service role — a guest
 * marking their own share paid here is a UI affordance, not a receipt.
 */
export async function persistSplitShares(
  bookingCode: string,
  shares: SplitShare[],
): Promise<void> {
  const supabase = browserSupabase();
  const id = await sessionUserId();
  if (!supabase || !id || shares.length === 0) return;

  const { data: booking } = await supabase
    .from("bhk_bookings")
    .select("id")
    .eq("code", bookingCode)
    .maybeSingle();
  if (!booking) return;

  await supabase.from("bhk_split_shares").upsert(
    shares.map((share, slot) => ({
      booking_id: booking.id,
      slot,
      member_name: share.name,
      amount: share.amount,
      paid: share.paid,
      paid_at: share.paidAt ?? null,
    })),
    { onConflict: "booking_id,slot" },
  );
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

/**
 * Every live stay in the marketplace, as bare date ranges.
 *
 * Booking state cannot come from `bhk_bookings` directly: its RLS policy only
 * returns the viewer's own rows as guest or host, so a calendar reading that
 * table would show every other guest's weekend as free. `bhk_availability()` is
 * the public projection the migration adds, and it is what makes the picker
 * agree with reality.
 *
 * If that function is missing — the migration has not been pushed yet — this
 * degrades to the rows RLS will actually hand over, so a database that predates
 * the change still shows *its own* bookings rather than nothing. A property with
 * no bookings simply contributes no ranges, and every future night stays
 * available.
 */
export async function loadAvailability(): Promise<AvailabilityRange[]> {
  const supabase = browserSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc("bhk_availability");
  if (!error && Array.isArray(data)) {
    return (data as unknown as AvailabilityRow[]).map(toRange);
  }

  const { data: own } = await supabase
    .from("bhk_bookings")
    .select("property_id, check_in, check_out, status");
  return ((own as unknown as AvailabilityRow[] | null) ?? []).map(toRange);
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
