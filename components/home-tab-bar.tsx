"use client";

import { TabBar } from "@/components/shell";

/**
 * Client boundary for the homepage's bottom tab bar.
 *
 * `TabBar` reads the locale from the client-side i18n store, so it cannot run
 * on the server. Isolating it here lets the homepage itself be a server
 * component (which is what makes its metadata, JSON-LD and body content
 * render on the server) while the mobile navigation stays exactly as it was.
 */
export function HomeTabBar() {
  return <TabBar current="explore" />;
}
