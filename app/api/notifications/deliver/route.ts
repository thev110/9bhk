import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { serviceSupabase } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Notification delivery is not configured." }, { status: 503 });
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const service = serviceSupabase();
  if (!service) return NextResponse.json({ error: "Notification delivery is unavailable." }, { status: 503 });
  const queued = await service.rpc("bhk_queue_lifecycle_reminders");
  if (queued.error) return NextResponse.json({ error: "Could not queue lifecycle reminders." }, { status: 503 });
  const { data, error } = await service.rpc("bhk_deliver_notifications", { p_limit: 50 });
  if (error) return NextResponse.json({ error: "Delivery failed. Please retry." }, { status: 503 });
  return NextResponse.json({ success: true, ...data });
}
