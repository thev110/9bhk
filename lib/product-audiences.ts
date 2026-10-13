export const PRODUCT_AUDIENCES = [
  { id: "stays", name: "9bhk Stays", destination: "/" },
  { id: "pro", name: "9bhk Pro", destination: "/realtor" },
  { id: "estates", name: "9bhk Estates", destination: "/buy" },
] as const;

export type ProductAudience = (typeof PRODUCT_AUDIENCES)[number]["id"];

/** Product choice controls the next screen, never account permissions. */
export function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return "/";
  return value;
}

export function audienceForDestination(destination: string): ProductAudience {
  const path = safeReturnPath(destination).split(/[?#]/)[0];
  if (path === "/realtor" || path.startsWith("/realtor/")) return "pro";
  if (path === "/buy" || path.startsWith("/buy/") || path === "/host" || path.startsWith("/host/")) return "estates";
  return "stays";
}

/** Preserve a booking or listing return path when its audience is selected. */
export function destinationForAudience(audience: ProductAudience, requested: string): string {
  const next = safeReturnPath(requested);
  if (audienceForDestination(next) === audience) return next;
  return PRODUCT_AUDIENCES.find((product) => product.id === audience)!.destination;
}

/** Switching between buying and listing retains an existing sale-listing mode. */
export function destinationForEstateIntent(intent: "buy" | "list", requested: string): string {
  const next = safeReturnPath(requested);
  const path = next.split(/[?#]/)[0];
  const prefix = intent === "buy" ? "/buy" : "/host";
  if (path === prefix || path.startsWith(`${prefix}/`)) return next;
  return intent === "buy" ? "/buy" : "/host/new";
}
