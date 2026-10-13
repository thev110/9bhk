/** Only relative, same-origin application destinations are accepted. */
export function safeNextPath(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\x00-\x20]/.test(value)) return fallback;
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//") || /[\\\x00-\x20]/.test(decoded)) return fallback;
    const target = new URL(value, "https://9bhk.invalid");
    return target.origin === "https://9bhk.invalid" && !target.pathname.startsWith("//")
      ? target.pathname + target.search + target.hash : fallback;
  } catch { return fallback; }
}

export function subscriptionActive(status: string | null | undefined, expiresAt: string | null | undefined, now = Date.now()): boolean {
  return status === "active" && Boolean(expiresAt) && Date.parse(expiresAt!) > now;
}

export function accountCacheKey(id: string): string { return `9bhk-account-v2:${id}`; }
