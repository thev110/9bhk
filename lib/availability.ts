import type { Property } from "@/lib/properties";

/**
 * Calendar occupancy for whole-house stays.
 *
 * All ranges are half-open `[checkIn, checkOut)` — a stay that checks out on
 * the 12th frees the 12th for the next guest. ISO `YYYY-MM-DD` strings sort
 * lexicographically, so the comparisons below are plain string comparisons and
 * carry no timezone risk (a `Date` built from "2026-10-11" is parsed as UTC
 * midnight but read back in local time, which silently shifts days in IST).
 */

export type DateRange = { checkIn: string; checkOut: string };

/**
 * Anything that holds nights on a property's calendar. Kept structural rather
 * than importing `Booking` from the store, because the store imports the
 * catalog and a type-only cycle is still a cycle to a bundler.
 */
export type Occupancy = {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  status: string;
};

/** Stays that no longer hold their nights. `awaiting` still does. */
const RELEASED_STATUSES = new Set(["cancelled"]);

/** Parse an ISO date to a UTC instant, avoiding local-time drift. */
export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

/** Shift an ISO date by whole days. */
export function addDays(iso: string, days: number): string {
  const date = parseIso(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Nights charged between two dates. Checkout day is free. */
export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((parseIso(checkOut).getTime() - parseIso(checkIn).getTime()) / 86400000);
}

/** Every occupied night in `[checkIn, checkOut)`. */
export function nightsInRange(range: DateRange): string[] {
  const nights: string[] = [];
  const count = nightsBetween(range.checkIn, range.checkOut);
  for (let index = 0; index < count; index += 1) nights.push(addDays(range.checkIn, index));
  return nights;
}

/**
 * Two stays clash when each starts before the other ends. Half-open ranges make
 * a same-day turnover (11th→12th and 12th→14th) legal, which is what hosts do.
 */
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.checkIn < b.checkOut && b.checkIn < a.checkOut;
}

/** Nights held by live bookings plus the host's own blocked dates. */
export function occupiedNights(property: Property, occupancies: Occupancy[]): Set<string> {
  const nights = new Set<string>(property.blockedDates ?? []);
  for (const occupancy of occupancies) {
    if (occupancy.propertyId !== property.id) continue;
    if (RELEASED_STATUSES.has(occupancy.status)) continue;
    for (const night of nightsInRange(occupancy)) nights.add(night);
  }
  return nights;
}

/** True when a single night is free. */
export function isNightAvailable(
  property: Property,
  occupancies: Occupancy[],
  iso: string,
): boolean {
  return !occupiedNights(property, occupancies).has(iso);
}

/** True when every night of the requested stay is free. */
export function isRangeAvailable(
  property: Property,
  occupancies: Occupancy[],
  range: DateRange,
): boolean {
  if (nightsBetween(range.checkIn, range.checkOut) < 1) return false;
  const occupied = occupiedNights(property, occupancies);
  return nightsInRange(range).every((night) => !occupied.has(night));
}

/**
 * The soonest stay of at least `nights` starting today or later, for hosts who
 * would rather see "next free window" than a wall of grey squares. Returns null
 * for a property that is solidly booked out over the search horizon.
 */
export function nextAvailableRange(
  property: Property,
  occupancies: Occupancy[],
  from: string,
  nights: number,
  horizonDays = 180,
): DateRange | null {
  for (let offset = 0; offset < horizonDays; offset += 1) {
    const checkIn = addDays(from, offset);
    const checkOut = addDays(checkIn, nights);
    if (isRangeAvailable(property, occupancies, { checkIn, checkOut })) {
      return { checkIn, checkOut };
    }
  }
  return null;
}

/**
 * Six weeks of days covering `cursor`'s month, padded so the grid starts on a
 * Monday. Shared by the booking calendar and the search date sheet so both
 * render identical geometry.
 */
export function monthMatrix(cursor: Date): Date[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  // JS weeks start Sunday; IST calendars read Monday-first.
  start.setDate(1 - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

/** Today as an ISO date in the viewer's own timezone. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * First day of the current month, in the viewer's own timezone.
 *
 * This is where a calendar must open. Opening on a fixed month (or on the
 * server's idea of "now") is what makes a picker look like it starts days or
 * months away from the viewer.
 */
export function currentMonthStart(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * True when `iso` is a night that has already gone.
 *
 * Strictly `<`, not `<=`: today itself is still bookable, which is the whole
 * point of opening the picker on the current month.
 */
export function isPastDate(iso: string, today: string): boolean {
  return iso < today;
}

/** `YYYY-MM` for an ISO date or a `Date` — the key a month comparison needs. */
export function monthKey(value: string | Date): string {
  if (typeof value === "string") return value.slice(0, 7);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}
