import "server-only";
import { serviceSupabase } from "@/lib/supabase/service";

/** Call after validating source-event eligibility and recipient access. Never accept arbitrary client recipients. */
export async function enqueueNotification(input: {
  recipientId: string;
  eventKey: string;
  category: "transactional" | "marketing";
  title: string;
  body: string;
  href?: string;
  expiresAt: string;
}) {
  const db = serviceSupabase();
  if (!db) throw new Error("Notification service is unavailable.");
  const { error } = await db.from("bhk_notification_outbox").upsert({
    user_id: input.recipientId, event_key: input.eventKey, category: input.category,
    title: input.title, body: input.body, href: input.href ?? null, expires_at: input.expiresAt,
  }, { onConflict: "user_id,event_key", ignoreDuplicates: true });
  if (error) throw new Error("Could not queue notification.");
}
