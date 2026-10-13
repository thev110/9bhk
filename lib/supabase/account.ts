import { requireSupabase } from "@/lib/supabase/browser";
import { subscriptionActive } from "@/lib/account";
import type { Booking, User, AppNote, RealtorClient, RealtorProperty } from "@/lib/store";
import type { Locale } from "@/lib/i18n/types";
import { LOCALES } from "@/lib/i18n/types";

export async function loadAccount() {
  const client = requireSupabase();
  const { data: auth, error } = await client.auth.getUser();
  if (error?.name === "AuthSessionMissingError") return null;
  if (error) throw error;
  if (!auth.user) return null;
  const id = auth.user.id;
  const result = await Promise.all([
    client.from("bhk_profiles").select("*").eq("id", id).single(),
    client.from("bhk_bookings").select("*").eq("guest_id", id).order("created_at", { ascending: false }),
    client.from("bhk_notifications").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    client.from("bhk_wishlist").select("property_id").eq("user_id", id),
    client.from("bhk_realtor_clients").select("*").eq("realtor_id", id),
    client.from("bhk_broker_properties").select("*").eq("realtor_id", id),
    client.from("bhk_broker_subscriptions").select("*").eq("user_id", id).order("expires_at", { ascending: false }).limit(1),
  ]);
  for (const item of result) if (item.error) throw item.error;
  const profile = result[0].data;
  const user: User = { id, name: profile.full_name || auth.user.email?.split("@")[0] || "Explorer",
    email: auth.user.email || "", phone: profile.phone || auth.user.phone || "", city: profile.city || "Chennai",
    avatarUrl: profile.avatar_url || undefined, upiId: profile.upi_id || undefined,
    role: profile.role || "buyer", agencyName: profile.agency_name || undefined, reraNumber: profile.rera_number || undefined,
    verifiedBroker: Boolean(profile.verified_broker), commissionRate: Number(profile.commission_rate),
    locale: LOCALES.includes(profile.locale) ? profile.locale as Locale : "en" };
  const bookingRows = result[1].data || [];
  let shareRows: any[] = [];
  if (bookingRows.length) {
    const shares = await client.from("bhk_split_shares").select("*").in("booking_id", bookingRows.map(b => b.id)).order("slot");
    if (shares.error) throw shares.error;
    shareRows = shares.data || [];
  }
  const bookings: Booking[] = bookingRows.map(b => ({
    id: b.id, code: b.code, propertyId: b.property_id, propertyName: b.property_name,
    guestId: b.guest_id, hostId: b.host_id, checkIn: b.check_in, checkOut: b.check_out,
    adults: b.adults, children: b.children, total: Number(b.total), status: b.status,
    guestName: b.guest_name, guestEmail: b.guest_email, guestPhone: b.guest_phone || "",
    upiId: b.upi_id, paymentRef: b.payment_ref, orderId: b.order_id,
    holdExpiresAt: b.hold_expires_at, paymentStatus: b.payment_status, refundStatus: b.refund_status,
    createdAt: b.created_at, cancellationDeadline: b.cancellation_deadline, quote: b.quote,
    split: shareRows.filter(s => s.booking_id === b.id).map(s => ({ id: s.id, name: s.member_name, amount: Number(s.amount), paid: s.paid, paidAt: s.paid_at })),
  }));
  const notes: AppNote[] = (result[2].data || []).map(n => ({ id: n.id, title: n.title, body: n.body, href: n.href || "/trips", when: n.created_at, read: Boolean(n.read_at), readAt: n.read_at || undefined }));
  const clients: RealtorClient[] = (result[4].data || []).map(c => ({ id: c.id, name: c.name, phone: c.phone, email: c.email, budgetMinCr: Number(c.budget_min_cr), budgetMaxCr: Number(c.budget_max_cr), preferredStretch: c.preferred_stretch, garageNeed: c.garage_need, confidential: c.confidential, notes: c.notes, createdAt: c.created_at }));
  const realtorProperties: RealtorProperty[] = (result[5].data || []).map(p => ({ id: p.id, sourcePropertyId: p.source_property_id, name: p.name, location: p.location, city: p.city, bedrooms: p.bedrooms, bathrooms: p.bathrooms, guests: p.guests, forRent: p.for_rent, forSale: p.for_sale, nightlyRate: p.nightly_rate, salePriceCr: p.sale_price_cr, pool: p.pool, notes: p.notes, createdAt: p.created_at }));
  const subscription = result[6].data?.[0];
  return { user, bookings, notes, clients, realtorProperties, saved: (result[3].data || []).map(s => s.property_id as string),
    brokerSubscribed: subscriptionActive(subscription?.status, subscription?.expires_at),
    brokerSubscriptionExpiresAt: subscription?.expires_at, brokerSubscribedAt: subscription?.created_at, brokerSubscriptionPaymentId: subscription?.payment_id };
}
