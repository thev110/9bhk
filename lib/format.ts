export function inr(amount: number): string {
  const sign = amount < 0 ? "−" : "";
  const value = Math.abs(Math.round(amount));
  return `${sign}₹${value.toLocaleString("en-IN")}`;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

export function quote(nightly: number, cleaning: number, nights: number) {
  const stay = nightly * nights;
  const beforeTax = stay + cleaning;
  const tax = Math.round(beforeTax * 0.12);
  return { stay, cleaning, tax, discount: 0, total: beforeTax + tax };
}

export function formatRange(checkIn: string, checkOut: string, tag = "en-IN"): string {
  const a = new Date(`${checkIn}T00:00:00`);
  const b = new Date(`${checkOut}T00:00:00`);
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  // Month/day names follow the active locale (en-IN / ta-IN / te-IN); the
  // separators below are locale-neutral so the range reads consistently.
  const day = (d: Date) => d.toLocaleDateString(tag, { day: "numeric" });
  const mon = (d: Date) => d.toLocaleDateString(tag, { month: "short", year: "numeric" });
  if (sameMonth) return `${day(a)}–${day(b)} ${mon(b)}`;
  return `${day(a)} ${mon(a)} – ${day(b)} ${mon(b)}`;
}

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const CITIES = [
  "Chennai",
  "ECR",
  "Mahabalipuram",
  "Chengalpattu",
  "Kanchipuram",
  "Pondicherry",
] as const;

export type City = (typeof CITIES)[number];
