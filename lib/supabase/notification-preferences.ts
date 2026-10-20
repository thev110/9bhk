import { browserSupabase } from "@/lib/supabase/browser";

export type NotificationPreferences = {
  marketing_in_app: boolean;
  timezone: string;
  quiet_start: string | null;
  quiet_end: string | null;
};
async function account() {
  const db = browserSupabase();
  if (!db) throw new Error("Online services are unavailable.");
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new Error("Sign in to manage notifications.");
  return { db, id: data.user.id };
}
export async function readNotificationPreferences(): Promise<NotificationPreferences> {
  const { db, id } = await account();
  const { data, error } = await db.from("bhk_notification_preferences").select("marketing_in_app,timezone,quiet_start,quiet_end").eq("user_id", id).maybeSingle();
  if (error) throw new Error("Could not load notification preferences.");
  return data ?? { marketing_in_app: false, timezone: "Asia/Kolkata", quiet_start: null, quiet_end: null };
}
export async function saveNotificationPreferences(preferences: NotificationPreferences) {
  const { db, id } = await account();
  const { error } = await db.from("bhk_notification_preferences").upsert({
    user_id: id, marketing_in_app: preferences.marketing_in_app, timezone: preferences.timezone,
    quiet_start: preferences.quiet_start, quiet_end: preferences.quiet_end,
  });
  if (error) throw new Error("Could not save notification preferences.");
}
