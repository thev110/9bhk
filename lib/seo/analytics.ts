/**
 * Privacy-conscious analytics seam.
 *
 * There is no analytics vendor in the app today and this module deliberately
 * does not add one. What it does is define the event vocabulary and a single
 * non-blocking dispatch point, so that:
 *
 *   • measurement can be switched on later with one `<Analytics />` mount and
 *     zero changes to feature code, and
 *   • nothing here ever blocks rendering, loads no third-party script, sets no
 *     advertising cookie and sends no personal data.
 *
 * Events fire only after the page is interactive and are batched through
 * `requestIdleCallback`, so a click handler never waits on a network call.
 *
 * TODO(business-data): if a vendor is chosen, implement `loadVendor()` and set
 * `NEXT_PUBLIC_ANALYTICS_ID`. Keep the consent posture in
 * `/legal/cookies` accurate — that page currently states no tracking cookie is
 * used, which must stay true for whatever is added.
 */

export type AnalyticsEvent =
  | "property_view"
  | "search"
  | "filter"
  | "wishlist"
  | "inquiry"
  | "booking_start"
  | "booking_complete"
  | "guide_view"
  | "location_page_view";

export type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

type Listener = (event: AnalyticsEvent, payload: AnalyticsPayload) => void;

const listeners = new Set<Listener>();
const queue: Array<[AnalyticsEvent, AnalyticsPayload]> = [];

/** True once a vendor is actually configured. Kept false by default. */
export const analyticsEnabled = Boolean(process.env.NEXT_PUBLIC_ANALYTICS_ID);

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function flush(): void {
  while (queue.length) {
    const [event, payload] = queue.shift()!;
    for (const listener of listeners) {
      try {
        listener(event, payload);
      } catch {
        /* a broken listener must never break the page */
      }
    }
  }
}

/**
 * Record an event. Always a no-op cost when nothing is subscribed, and always
 * deferred off the critical path.
 */
export function track(event: AnalyticsEvent, payload: AnalyticsPayload = {}): void {
  if (typeof window === "undefined") return;
  if (!listeners.size) return;
  queue.push([event, payload]);
  const schedule =
    typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback
      : (cb: () => void) => window.setTimeout(cb, 200);
  schedule(flush);
}

/** Event names the UI already produces, kept in one list for the report. */
export const EVENT_CATALOG: Array<{ event: AnalyticsEvent; firesOn: string }> = [
  { event: "property_view", firesOn: "property detail page mount" },
  { event: "search", firesOn: "search submit on the home page" },
  { event: "filter", firesOn: "filter chip / sort change on /search" },
  { event: "wishlist", firesOn: "save or unsave a listing" },
  { event: "inquiry", firesOn: "private viewing / walkthrough request" },
  { event: "booking_start", firesOn: "open the booking flow for a listing" },
  { event: "booking_complete", firesOn: "booking confirmed by the host" },
  { event: "guide_view", firesOn: "guide page mount" },
  { event: "location_page_view", firesOn: "destination page mount" },
];
