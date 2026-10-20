/**
 * Twelve Tools listing badge, exactly as published at https://twelve.tools/badge
 * (free listings must show a backlink to twelve.tools on the homepage or footer;
 * their checker looks for this badge). Keep the markup as-is: href, target,
 * src, alt, width and height are theirs. A plain <img> on purpose: a 200x54
 * remote SVG needs no next/image optimisation or remotePatterns entry.
 */
export function TwelveToolsBadge() {
  return (
    <a href="https://twelve.tools" target="_blank">
      {/* eslint-disable-next-line @next/next/no-img-element -- official third-party badge */}
      <img src="https://twelve.tools/badge0-white.svg" alt="Featured on Twelve Tools" width="200" height="54" />
    </a>
  );
}
