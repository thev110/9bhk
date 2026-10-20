/**
 * "Verified" is shown only when a staff review of the listing's evidence is
 * recorded in the database: bhk_properties.verification_status = 'verified'
 * with the reviewing staff member (verified_by) and date. Those columns can
 * only be set by staff (bhk_guard_property). Everything else is host-provided.
 */
type WithVerification = {
  verification?: { status: "verified" | "unverified"; type?: string; date?: string; verifiedBy?: string };
};

export function hasStaffVerification(property: WithVerification): boolean {
  const v = property.verification;
  return v?.status === "verified" && Boolean(v.verifiedBy) && Boolean(v.date);
}

export const HOST_PROVIDED_LABEL = "Host-provided";
export const VERIFIED_LABEL = "Verified";
export const NO_PLATFORM_FEE = "No platform fee during launch. Any future fee will be shown clearly before you book.";
