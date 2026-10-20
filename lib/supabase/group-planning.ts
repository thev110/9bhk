import { browserSupabase } from "@/lib/supabase/browser";

async function account() {
  const db = browserSupabase();
  if (!db) throw new Error("Online services are unavailable.");
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new Error("Sign in to organise your trip.");
  return { db, user: data.user };
}
async function mutate(name: string, args: Record<string, unknown>) {
  const { db } = await account();
  const { error } = await db.rpc(name, args);
  if (error) throw new Error(error.message);
}
export const removeGroupMember = (planId: string, userId: string) => mutate("bhk_remove_group_member", { p_plan: planId, p_user: userId });
export const restoreInvitationAccess = (planId: string, userId: string) => mutate("bhk_restore_group_invitation_access", { p_plan: planId, p_user: userId });
export const transferGroup = (planId: string, userId: string) => mutate("bhk_transfer_group", { p_plan: planId, p_owner: userId });
export const saveRoomPreference = (planId: string, preference: string) => mutate("bhk_set_room_preference", { p_plan: planId, p_preference: preference });
export const assignGroupRoom = (planId: string, userId: string, room: string | null) => mutate("bhk_assign_group_room", { p_plan: planId, p_user: userId, p_room: room });
export const linkGroupBooking = (planId: string, bookingId: string) => mutate("bhk_link_group_booking", { p_plan: planId, p_booking: bookingId });
export const setGroupBookedGuest = (planId: string, userId: string, approved: boolean) => mutate("bhk_set_group_booked_guest", { p_plan: planId, p_user: userId, p_approved: approved });
export const assignGroupPayer = (planId: string, shareId: string, userId: string) => mutate("bhk_assign_group_payer", { p_plan: planId, p_share: shareId, p_user: userId });
export async function groupFundingProgress(planId: string) {
  const { db } = await account();
  const { data, error } = await db.rpc("bhk_group_funding_progress", { p_plan: planId });
  if (error) throw new Error(error.message);
  return data;
}
export async function groupMessages(planId: string) {
  const { db } = await account();
  const { data, error } = await db.from("bhk_group_messages").select("id,plan_id,sender_id,body,created_at")
    .eq("plan_id",planId).order("created_at",{ascending:false}).limit(100);
  if (error) throw new Error("Could not load group messages.");
  return (data ?? []).reverse();
}
export async function postGroupMessage(planId: string, body: string) {
  const { db, user } = await account();
  const { error } = await db.from("bhk_group_messages").insert({ plan_id: planId, sender_id: user.id, body: body.trim() });
  if (error) throw new Error("Could not send group message.");
}
export async function groupBookingProgress(planId: string) {
  const { db } = await account();
  const { data, error } = await db.rpc("bhk_group_booking_progress", { p_plan: planId });
  if (error) throw new Error(error.message);
  return data;
}

export async function loadGroupPlanning(planId: string) {
  const { db } = await account();
  const [itinerary, rooms] = await Promise.all([
    db.from("bhk_group_itinerary").select("id,plan_id,author_id,title,notes,starts_at,ends_at").eq("plan_id", planId).order("starts_at"),
    db.from("bhk_group_room_preferences").select("user_id,preference,assigned_room").eq("plan_id", planId),
  ]);
  if (itinerary.error || rooms.error) throw new Error("Could not load group planning.");
  return { itinerary: itinerary.data ?? [], rooms: rooms.data ?? [] };
}
export async function addItineraryItem(planId: string, item: { title: string; notes: string; startsAt: string; endsAt?: string }) {
  const { db, user } = await account();
  const { data, error } = await db.from("bhk_group_itinerary").insert({
    plan_id: planId, author_id: user.id, title: item.title.trim(), notes: item.notes.trim(),
    starts_at: item.startsAt, ends_at: item.endsAt ?? null,
  }).select("id").single();
  if (error) throw new Error("Could not save itinerary item.");
  return data.id as string;
}
export async function deleteItineraryItem(id: string) {
  const { db } = await account();
  const { data, error } = await db.from("bhk_group_itinerary").delete().eq("id", id).select("id");
  if (error || !data?.length) throw new Error("Could not remove itinerary item.");
}
