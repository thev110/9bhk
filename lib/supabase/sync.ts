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
  });
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
