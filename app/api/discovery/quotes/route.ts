import { NextResponse } from "next/server";
import { discoveryRequest } from "@/lib/discovery";
import { serviceSupabase } from "@/lib/supabase/service";

export async function POST(request: Request) {
  let input;
  try {
    const text = await request.text();
    if (text.length > 4096) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    input = discoveryRequest(JSON.parse(text));
  } catch (error) {
    return NextResponse.json({ error: error instanceof SyntaxError ? "Invalid request body." : error instanceof Error ? error.message : "Invalid comparison." }, { status: 400 });
  }
  const service = serviceSupabase();
  if (!service) return NextResponse.json({ error: "Live quotes are unavailable." }, { status: 503 });
  const { data, error } = await service.rpc("bhk_discovery_quotes", {
    p_properties: input.propertyIds, p_check_in: input.checkIn, p_check_out: input.checkOut,
    p_adults: input.adults, p_children: input.children, p_flex: input.flexDays,
  });
  if (error) return NextResponse.json({ error: "Live quotes are unavailable. Please retry." }, { status: 503 });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
