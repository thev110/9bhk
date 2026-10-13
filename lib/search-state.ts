/** Only valid dates and guest counts may cross from discovery into checkout. */
export function validIsoDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function bookingQuery(input: URLSearchParams): string {
  const result = new URLSearchParams();
  const checkIn = input.get("checkIn") ?? "";
  const checkOut = input.get("checkOut") ?? "";
  if (validIsoDay(checkIn) && validIsoDay(checkOut) && checkOut > checkIn) {
    result.set("checkIn", checkIn);
    result.set("checkOut", checkOut);
  }
  const guests = Number(input.get("guests"));
  if (Number.isInteger(guests) && guests >= 1 && guests <= 100) result.set("guests", String(guests));
  return result.toString();
}
