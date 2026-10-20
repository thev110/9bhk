import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { serviceSupabase } from "@/lib/supabase/service";
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Service maintenance is not configured." }, { status: 503 });
  const actual = request.headers.get("authorization") ?? "", expected = `Bearer ${secret}`;
  if (Buffer.byteLength(actual) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = serviceSupabase();
  if (!db) return NextResponse.json({ error: "Service maintenance unavailable." }, { status: 503 });
  const { data, error } = await db.rpc("bhk_expire_service_checkouts", { p_limit: 100 });
  if (error) return NextResponse.json({ error: "Service maintenance failed; retry required." }, { status: 503 });
  return NextResponse.json({ success: true, expired: data });
}
