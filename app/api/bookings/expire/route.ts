import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { serviceSupabase } from "@/lib/supabase/service";
export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: "Reservation maintenance is not configured." }, { status: 503 });
  const actual = request.headers.get("authorization") ?? "";
  const token = `Bearer ${expected}`;
  if (Buffer.byteLength(actual) !== Buffer.byteLength(token) || !timingSafeEqual(Buffer.from(actual), Buffer.from(token))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const service = serviceSupabase();
  if (!service) return NextResponse.json({ error: "Reservation maintenance is unavailable." }, { status: 503 });
  const { data, error } = await service.rpc("bhk_expire_holds");
  if (error) return NextResponse.json({ error: "Maintenance failed; retry required." }, { status: 503 });
  return NextResponse.json({ success: true, ...data });
}
