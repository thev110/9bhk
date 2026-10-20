import { NextResponse } from "next/server";
import { authenticated, failure, TransactionError } from "@/lib/server/transactions";
export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { user, service } = await authenticated(request);
    const { code } = await context.params;
    const { data: booking, error } = await service.from("bhk_bookings").select("property_id,status,payment_status").eq("code", code).eq("guest_id", user.id).maybeSingle();
    if (error) throw new TransactionError("Could not load arrival details.", 503);
    if (!booking || !["confirmed", "completed"].includes(booking.status) || booking.payment_status !== "paid") throw new TransactionError("Arrival details are available for confirmed paid reservations.", 403);
    const { data: property, error: propertyError } = await service.from("bhk_properties").select("address,check_in_time,check_out_time,house_rules").eq("id", booking.property_id).maybeSingle();
    if (propertyError || !property) throw new TransactionError("Arrival details are currently unavailable. Contact your host.", 503);
    return NextResponse.json({ address: property.address || null, checkInTime: property.check_in_time || "14:00", checkOutTime: property.check_out_time || "11:00", houseRules: property.house_rules || [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}
