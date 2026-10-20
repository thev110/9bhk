export type DiscoveryRequest = { propertyIds: string[]; checkIn: string; checkOut: string; adults: number; children: number; flexDays: number };
export function discoveryRequest(raw: unknown): DiscoveryRequest {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Enter comparison details.");
  const body = raw as Record<string, unknown>;
  if (!Array.isArray(body.propertyIds) || body.propertyIds.length < 1 || body.propertyIds.length > 4
    || body.propertyIds.some(id => typeof id !== "string" || !id.trim() || id.length > 200)
    || new Set(body.propertyIds).size !== body.propertyIds.length) throw new Error("Choose up to four different listings.");
  for (const key of ["checkIn", "checkOut"]) {
    const value = body[key];
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Choose valid dates.");
    const date = new Date(`${value}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error("Choose valid dates.");
  }
  const nights = (Date.parse(body.checkOut as string) - Date.parse(body.checkIn as string)) / 86400000;
  const flexDays = body.flexDays ?? 0;
  if (nights < 1 || nights > 90) throw new Error("Choose a stay of 1–90 nights.");
  if (!Number.isInteger(body.adults) || (body.adults as number) < 1 || (body.adults as number) > 10000
    || !Number.isInteger(body.children) || (body.children as number) < 0 || (body.children as number) > 10000
    || !Number.isInteger(flexDays) || (flexDays as number) < 0 || (flexDays as number) > 3) throw new Error("Enter valid guest counts and 0–3 flexible days.");
  return { propertyIds: body.propertyIds as string[], checkIn: body.checkIn as string, checkOut: body.checkOut as string, adults: body.adults as number, children: body.children as number, flexDays: flexDays as number };
}
