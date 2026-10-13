import { NextResponse } from "next/server";
import { serviceSupabase } from "@/lib/supabase/service";
import { metricInput } from "@/lib/seo/telemetry";

const buckets = new Map<string, { count: number; until: number }>();
export async function POST(request: Request) {
  // Disabled by default. No cookies, account identifiers, query text, or contact data.
  if (process.env.NEXT_PUBLIC_ANALYTICS_ID !== "first-party") return new NextResponse(null, { status: 204 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return new NextResponse(null, { status: 403 });
  const source = (request.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const now = Date.now();
  for (const [key, bucket] of buckets) if (bucket.until <= now) buckets.delete(key);
  const bucket = buckets.get(source) ?? { count: 0, until: now + 60000 };
  if (bucket.count >= 60 || buckets.size >= 10000) return new NextResponse(null, { status: 429 });
  bucket.count += 1; buckets.set(source, bucket);
  const raw = await request.text();
  if (raw.length > 1024) return new NextResponse(null, { status: 413 });
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return new NextResponse(null, { status: 400 }); }
  const metric = metricInput(body);
  if (!metric) return new NextResponse(null, { status: 400 });
  const service = serviceSupabase();
  if (!service) return new NextResponse(null, { status: 503 });
  const { error } = await service.from("bhk_usage_events").insert(metric);
  return new NextResponse(null, { status: error ? 503 : 204 });
}
