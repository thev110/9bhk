"use client";

import { useCallback, useEffect, useState } from "react";
import { currentMonthStart, monthKey, todayIso } from "@/lib/availability";

/**
 * The month a date picker should open on, plus today's date for the past-night
 * guard.
 *
 * Both are resolved in an effect rather than in `useState`, because these pages
 * are server-rendered as well: "today" on the server is not necessarily "today"
 * for the viewer, and a value computed during the first render would differ
 * between the server pass and hydration. Until the effect runs, `cursor` and
 * `today` are null, and callers render an empty grid — one frame, and never a
 * stale month.
 */
export function useCalendarStart() {
  const [cursor, setCursor] = useState<Date | null>(null);
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    setCursor(currentMonthStart());
    setToday(todayIso());
  }, []);

  /**
   * Step whole months from wherever the grid currently is. Going back from the
   * opening month would only ever reveal nights that have already gone, so
   * callers can disable it via `canGoBack`.
   */
  const goToMonth = useCallback((offset: number) => {
    setCursor((curr) => {
      const base = curr ?? currentMonthStart();
      return new Date(base.getFullYear(), base.getMonth() + offset, 1);
    });
  }, []);

  // False on the opening month and for any month before it.
  const canGoBack = cursor !== null && today !== null && monthKey(cursor) > monthKey(today);

  return { cursor, today, setCursor, goToMonth, canGoBack, ready: cursor !== null && today !== null };
}
