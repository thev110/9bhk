/**
 * 4-Subdomain Multi-Portal Architecture & 4-Category KYC Specification.
 *
 * Subdomains:
 *  - `www.9bhk.app`     -> Guest & Public Marketplace (`/` root)
 *  - `realtor.9bhk.app` -> Realtor & Co-Broker Portal (`/realtor` root)
 *  - `owners.9bhk.app`  -> Property Owners & Acquiring Buyers Portal (`/host` root)
 *  - `admin.9bhk.app`   -> Staff KYC, Moderation & Telemetry Command Center (`/admin` root)
 */

export const PORTAL_SUBDOMAINS = ["www", "realtor", "owners", "admin"] as const;
export type PortalSubdomain = (typeof PORTAL_SUBDOMAINS)[number];

export type PortalId = "guest" | "realtor" | "owners" | "admin";

export const PORTAL_HOSTS: Record<
  PortalId,
  {
    subdomain: PortalSubdomain;
    host: string;
    rootPath: string;
    label: string;
  }
> = {
  guest: {
    subdomain: "www",
    host: "www.9bhk.app",
    rootPath: "/",
    label: "Guests & Stays",
  },
  realtor: {
    subdomain: "realtor",
    host: "realtor.9bhk.app",
    rootPath: "/realtor",
    label: "Realtors & Co-Brokers",
  },
  owners: {
    subdomain: "owners",
    host: "owners.9bhk.app",
    rootPath: "/host",
    label: "Owners & Buyers",
  },
  admin: {
    subdomain: "admin",
    host: "admin.9bhk.app",
    rootPath: "/admin",
    label: "Staff Command Center",
  },
} as const;

function stripPort(host: string | null | undefined): string {
  if (!host) return "";
  return host.trim().toLowerCase().replace(/:\d+$/, "");
}

/**
 * Resolves which portal a request belongs to from its `Host` header.
 * Supports both production (`*.9bhk.app`) and local dev (`*.localhost`).
 */
export function resolvePortalFromHost(host: string | null | undefined): PortalId {
  const clean = stripPort(host);
  if (
    clean === "realtor.9bhk.app" ||
    clean === "realtor.localhost" ||
    clean.startsWith("realtor.localhost.")
  ) {
    return "realtor";
  }
  if (
    clean === "owners.9bhk.app" ||
    clean === "owners.localhost" ||
    clean.startsWith("owners.localhost.")
  ) {
    return "owners";
  }
  if (
    clean === "admin.9bhk.app" ||
    clean === "admin.localhost" ||
    clean.startsWith("admin.localhost.")
  ) {
    return "admin";
  }
  return "guest";
}

/**
 * Returns true when `host` is one of the 4 canonical portal hosts
 * (`www.9bhk.app`, `realtor.9bhk.app`, `owners.9bhk.app`, `admin.9bhk.app`)
 * or a local subdomain alias (`*.localhost`).
 */
export function isCanonicalPortalHost(
  host: string | null | undefined,
  canonicalHost: string,
): boolean {
  const clean = stripPort(host);
  const cleanCanonical = stripPort(canonicalHost);
  if (!clean) return false;
  if (clean === cleanCanonical) return true;
  if (
    clean === "www.9bhk.app" ||
    clean === "realtor.9bhk.app" ||
    clean === "owners.9bhk.app" ||
    clean === "admin.9bhk.app"
  ) {
    return true;
  }
  if (
    clean === "realtor.localhost" ||
    clean === "owners.localhost" ||
    clean === "admin.localhost"
  ) {
    return true;
  }
  return false;
}

/**
 * When a visitor lands on `/` of a dedicated portal subdomain, rewrite to that
 * portal's workspace root (`/realtor`, `/host`, or `/admin`).
 */
export function resolveSubdomainLandingPath(
  host: string | null | undefined,
  pathname: string,
): string | null {
  if (pathname !== "/") return null;
  const portal = resolvePortalFromHost(host);
  if (portal === "realtor") return "/realtor";
  if (portal === "owners") return "/host";
  if (portal === "admin") return "/admin";
  return null;
}

/**
 * Enforces strict cross-portal boundary redirects on production subdomains
 * (`www.9bhk.app`, `realtor.9bhk.app`, `owners.9bhk.app`, `admin.9bhk.app`)
 * and local subdomain aliases (`*.localhost`), while leaving plain `localhost`
 * / `127.0.0.1` passthrough intact for local test runners (`seo:flows`, `seo:audit`).
 */
export function resolveCrossPortalRedirect(
  host: string | null | undefined,
  pathname: string,
): string | null {
  const clean = stripPort(host);
  if (!clean) return null;

  const isProdGuest = clean === "www.9bhk.app" || clean === "9bhk.app";
  const portal = resolvePortalFromHost(host);

  if (isProdGuest) {
    if (pathname === "/realtor" || pathname.startsWith("/realtor/")) {
      return "https://realtor.9bhk.app";
    }
    if (pathname === "/host" || pathname.startsWith("/host/")) {
      return pathname === "/host" ? "https://owners.9bhk.app" : `https://owners.9bhk.app${pathname}`;
    }
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return "https://admin.9bhk.app";
    }
    return null;
  }

  const isGuestAuthOrProfile =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/profile" ||
    pathname === "/onboarding";

  if (portal === "realtor") {
    if (isGuestAuthOrProfile) {
      return clean.endsWith(".9bhk.app") ? "https://realtor.9bhk.app/" : "/";
    }
    if (pathname === "/host" || pathname.startsWith("/host/")) {
      return "https://owners.9bhk.app";
    }
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return "https://admin.9bhk.app";
    }
  }

  if (portal === "owners") {
    if (isGuestAuthOrProfile) {
      return clean.endsWith(".9bhk.app") ? "https://owners.9bhk.app/" : "/";
    }
    if (pathname === "/realtor" || pathname.startsWith("/realtor/")) {
      return "https://realtor.9bhk.app";
    }
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return "https://admin.9bhk.app";
    }
  }

  if (portal === "admin") {
    if (
      isGuestAuthOrProfile ||
      pathname === "/realtor" ||
      pathname.startsWith("/realtor/") ||
      pathname === "/host" ||
      pathname.startsWith("/host/")
    ) {
      return clean.endsWith(".9bhk.app") ? "https://admin.9bhk.app/" : "/";
    }
  }

  return null;
}

/* ── 4-Category KYC Engine Specification ─────────────────────────────────── */

export const KYC_CATEGORIES = ["guest", "realtor", "seller", "buyer"] as const;
export type KycCategory = (typeof KYC_CATEGORIES)[number];

export const KYC_DOCUMENT_KINDS = [
  "guest_id",
  "rera_certificate",
  "realtor_pan",
  "agency_proof",
  "ownership_proof",
  "tax_receipt",
  "host_id",
  "buyer_id",
  "proof_of_funds",
] as const;
export type KycDocumentKind = (typeof KYC_DOCUMENT_KINDS)[number];

export const REQUIRED_KYC_DOCUMENTS: Record<
  KycCategory,
  readonly { kind: KycDocumentKind; label: string; description: string }[]
> = {
  guest: [
    {
      kind: "guest_id",
      label: "Government Photo ID",
      description: "Passport, Aadhaar, or Voter ID for Digital Arrival Pass & gate entry",
    },
  ],
  realtor: [
    {
      kind: "rera_certificate",
      label: "State RERA Registration Certificate",
      description: "Active RERA agent/agency registration certificate",
    },
    {
      kind: "realtor_pan",
      label: "Broker / Agency PAN Card",
      description: "Tax identity for brokerage settlement & TDS",
    },
    {
      kind: "agency_proof",
      label: "Agency Letterhead or GST Proof",
      description: "Firm registration or authorized signatory proof",
    },
  ],
  seller: [
    {
      kind: "ownership_proof",
      label: "Sale Deed / Patta / Title Proof",
      description: "Registered ownership deed for the estate",
    },
    {
      kind: "tax_receipt",
      label: "Property Tax Receipt / EC",
      description: "Recent municipal tax receipt or Encumbrance Certificate",
    },
    {
      kind: "host_id",
      label: "Owner Government ID & PAN",
      description: "Owner Aadhaar/Passport/PAN matching title deed",
    },
  ],
  buyer: [
    {
      kind: "buyer_id",
      label: "Buyer Government ID & PAN",
      description: "PAN or Passport of the acquiring individual/entity",
    },
    {
      kind: "proof_of_funds",
      label: "Proof of Funds / Sanction Letter",
      description:
        "Bank comfort letter, net-worth certificate, or sanction letter for offers & document vault",
    },
  ],
} as const;

export function summarizeCategoryKyc(
  category: KycCategory,
  docs: ReadonlyArray<{ kind: string; status: string }>,
): {
  category: KycCategory;
  requiredKinds: KycDocumentKind[];
  totalRequired: number;
  verifiedCount: number;
  pendingCount: number;
  rejectedCount: number;
  missingKinds: KycDocumentKind[];
  verified: boolean;
  isFullyVerified: boolean;
} {
  const required = REQUIRED_KYC_DOCUMENTS[category] ?? [];
  const requiredKinds = required.map((item) => item.kind);
  const byKind = new Map<string, string>();
  for (const doc of docs) {
    if (requiredKinds.includes(doc.kind as KycDocumentKind)) {
      byKind.set(doc.kind, doc.status);
    }
  }

  let verifiedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;
  const missingKinds: KycDocumentKind[] = [];

  for (const kind of requiredKinds) {
    const status = byKind.get(kind);
    if (status === "verified") {
      verifiedCount += 1;
    } else {
      missingKinds.push(kind);
      if (status === "pending") {
        pendingCount += 1;
      } else if (status === "rejected") {
        rejectedCount += 1;
      }
    }
  }

  const isFullyVerified =
    requiredKinds.length > 0 && verifiedCount === requiredKinds.length;

  return {
    category,
    requiredKinds,
    totalRequired: requiredKinds.length,
    verifiedCount,
    pendingCount,
    rejectedCount,
    missingKinds,
    verified: isFullyVerified,
    isFullyVerified,
  };
}
