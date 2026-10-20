import { browserSupabase } from "@/lib/supabase/browser";

async function authenticated() {
  const db = browserSupabase();
  if (!db) throw new Error("Online services are not configured.");
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new Error("Sign in to continue.");
  return { db, user: data.user };
}

/** Authenticated server mutation; success is returned only after persistence. */
export async function operationRequest<T = Record<string, unknown>>(path: string, body?: unknown): Promise<T> {
  const { db } = await authenticated();
  const { data } = await db.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in to continue.");
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Could not save your request.");
  return result as T;
}

export type BookingMessage = { id: string; sender_id: string; body: string; created_at: string };
export async function listBookingMessages(bookingId: string): Promise<BookingMessage[]> {
  const { db } = await authenticated();
  const { data, error } = await db.from("bhk_booking_messages").select("id,sender_id,body,created_at")
    .eq("booking_id", bookingId).order("created_at");
  if (error) throw error;
  return data ?? [];
}
export async function sendBookingMessage(bookingId: string, body: string): Promise<BookingMessage> {
  if (!body.trim() || body.trim().length > 4000) throw new Error("Enter a message of up to 4,000 characters.");
  const { db, user } = await authenticated();
  const { data, error } = await db.from("bhk_booking_messages").insert({ booking_id: bookingId, sender_id: user.id, body: body.trim() })
    .select("id,sender_id,body,created_at").single();
  if (error) throw error;
  return data;
}
export async function createSupportTicket(bookingId: string, subject: string, body: string): Promise<string> {
  if (!subject.trim() || subject.trim().length > 200 || !body.trim() || body.trim().length > 4000) {
    throw new Error("Enter a subject and message (up to 4,000 characters).");
  }
  const { db, user } = await authenticated();
  const { data, error } = await db.from("bhk_support_tickets")
    .insert({ booking_id: bookingId, requester_id: user.id, subject: subject.trim(), body: body.trim() }).select("id").single();
  if (error) throw error;
  return data.id;
}
export async function submitStayReview(bookingId: string, propertyId: string, rating: number, body: string): Promise<string> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || body.trim().length < 10 || body.trim().length > 4000) {
    throw new Error("Choose 1–5 stars and write a review of 10–4,000 characters.");
  }
  const { db, user } = await authenticated();
  const { data, error } = await db.from("bhk_stay_reviews")
    .insert({ booking_id: bookingId, property_id: propertyId, author_id: user.id, rating, body: body.trim() }).select("id").single();
  if (error) throw error;
  return data.id;
}
export type StayReview = { id: string; rating: number; body: string; created_at: string; verified_stay: boolean };
export async function listVerifiedReviews(propertyId: string): Promise<StayReview[]> {
  const db = browserSupabase();
  if (!db) return [];
  const { data, error } = await db.from("bhk_stay_reviews").select("id,rating,body,created_at,verified_stay")
    .eq("property_id", propertyId).eq("published", true).eq("verified_stay", true).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createGroupPlan(name: string, checkIn?: string, checkOut?: string): Promise<string> {
  if (!name.trim() || name.trim().length > 100) throw new Error("Enter a group name of up to 100 characters.");
  const { db, user } = await authenticated();
  const { data, error } = await db.from("bhk_group_plans")
    .insert({ owner_id: user.id, name: name.trim(), check_in: checkIn || null, check_out: checkOut || null }).select("id").single();
  if (error) throw error;
  return data.id;
}
export async function createGroupInvitation(planId: string): Promise<string> {
  const { db } = await authenticated();
  const { data, error } = await db.from("bhk_group_invitations").insert({ plan_id: planId }).select("token").single();
  if (error) throw error;
  return data.token;
}
export async function acceptGroupInvitation(token: string): Promise<string> {
  const { db } = await authenticated();
  const { data, error } = await db.rpc("bhk_accept_group_invitation", { invite_token: token });
  if (error) throw error;
  return data;
}
export async function loadGroupPlan(planId: string) {
  const { db } = await authenticated();
  const [plan, members, shortlist, votes] = await Promise.all([
    db.from("bhk_group_plans").select("id,name,owner_id,check_in,check_out").eq("id", planId).single(),
    db.from("bhk_group_members").select("user_id").eq("plan_id", planId),
    db.from("bhk_group_shortlist").select("property_id,added_by").eq("plan_id", planId),
    db.from("bhk_group_votes").select("property_id,user_id,vote").eq("plan_id", planId),
  ]);
  for (const result of [plan, members, shortlist, votes]) if (result.error) throw result.error;
  return { plan: plan.data, members: members.data, shortlist: shortlist.data, votes: votes.data };
}
export async function addGroupShortlist(planId: string, propertyId: string): Promise<void> {
  const { db, user } = await authenticated();
  const { error } = await db.from("bhk_group_shortlist").insert({ plan_id: planId, property_id: propertyId, added_by: user.id });
  if (error) throw error;
}
export async function voteForProperty(planId: string, propertyId: string, vote: boolean): Promise<void> {
  const { db, user } = await authenticated();
  const { error } = await db.from("bhk_group_votes").upsert({ plan_id: planId, property_id: propertyId, user_id: user.id, vote });
  if (error) throw error;
}
